import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

// 실 DB(Postgres, 로컬 Docker 컨테이너)를 대상으로 하는 통합 테스트.
// 단위 테스트(*.spec.ts)는 PrismaService를 mock하지만, 여기서는 컨트롤러/가드/Prisma를 전부 실제로 거친다.
describe("App e2e", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix("api");
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // 도안 등록은 게스트 불가(코드가 provider !== GUEST를 체크) → 카카오 로그인으로 실제 계정 발급
  async function createLoggedInUser() {
    const guestRes = await request(app.getHttpServer()).post("/api/auth/guest").expect(201);
    const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes("kauth.kakao.com/oauth/token")) {
        return new Response(JSON.stringify({ access_token: "fake-token" }), { status: 200 });
      }
      if (url.includes("kapi.kakao.com/v2/user/me")) {
        return new Response(JSON.stringify({ id: Math.floor(Math.random() * 1_000_000) }), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    const kakaoRes = await request(app.getHttpServer())
      .post("/api/auth/kakao")
      .set("Authorization", `Bearer ${guestRes.body.accessToken}`)
      .send({ code: "dummy-code" })
      .expect(201);
    fetchSpy.mockRestore();
    return kakaoRes.body.accessToken as string;
  }

  beforeEach(async () => {
    // FK 자식 테이블부터 순서대로 정리
    await prisma.projectPhoto.deleteMany();
    await prisma.projectYarnUsage.deleteMany();
    await prisma.project.deleteMany();
    await prisma.patternBookmark.deleteMany();
    await prisma.yarnBatch.deleteMany();
    await prisma.yarnPhoto.deleteMany();
    await prisma.yarn.deleteMany();
    await prisma.pattern.deleteMany();
    await prisma.yarnCatalog.deleteMany();
    await prisma.user.deleteMany();
  });

  // 0. 헬스체크: Render 배포 인스턴스가 슬립되지 않도록 GitHub Actions에서 주기적으로 호출하는 엔드포인트
  describe("헬스체크", () => {
    it("GET /api/health는 200과 status ok를 반환한다", async () => {
      const res = await request(app.getHttpServer()).get("/api/health").expect(200);
      expect(res.body).toEqual({ status: "ok" });
    });
  });

  // 1. 게스트 생성 → 로그인(게스트 토큰 자체가 세션) → 실 등록 → 도안 매칭 조회
  describe("게스트 → 실 등록 → 매칭 조회", () => {
    it("게스트로 시작해 실을 등록하고 매칭 목록을 조회할 수 있다", async () => {
      const guestRes = await request(app.getHttpServer()).post("/api/auth/guest").expect(201);
      const token = guestRes.body.accessToken;
      expect(token).toBeTruthy();

      const meRes = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(meRes.body.provider).toBe("GUEST");

      const yarnRes = await request(app.getHttpServer())
        .post("/api/yarns")
        .set("Authorization", `Bearer ${token}`)
        .send({
          brand: "테스트 브랜드",
          weightCategory: "DK",
          batches: [
            {
              skeinCount: 2,
              weightPerSkeinG: 100,
              lengthPerSkeinM: 200,
              inputUnit: "METRIC",
            },
          ],
        })
        .expect(201);
      expect(yarnRes.body.id).toBeTruthy();
      expect(yarnRes.body.brand).toBe("테스트 브랜드");

      const matchesRes = await request(app.getHttpServer())
        .get(`/api/yarns/${yarnRes.body.id}/pattern-matches`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(matchesRes.body)).toBe(true);
    });

    it("토큰 없이 실 등록을 시도하면 401", async () => {
      await request(app.getHttpServer())
        .post("/api/yarns")
        .send({ brand: "무단 등록", batches: [] })
        .expect(401);
    });
  });

  // 2. 게스트 → 소셜 계정(카카오) 병합: 게스트가 등록한 실이 카카오 계정으로 그대로 넘어와야 함
  describe("게스트 → 카카오 계정 병합", () => {
    it("게스트로 등록한 실이 카카오 로그인 후 새 계정으로 이관된다", async () => {
      const guestRes = await request(app.getHttpServer()).post("/api/auth/guest").expect(201);
      const guestToken = guestRes.body.accessToken;

      await request(app.getHttpServer())
        .post("/api/yarns")
        .set("Authorization", `Bearer ${guestToken}`)
        .send({ brand: "게스트가 등록한 실", batches: [] })
        .expect(201);

      const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async (input: any) => {
        const url = String(input);
        if (url.includes("kauth.kakao.com/oauth/token")) {
          return new Response(JSON.stringify({ access_token: "fake-kakao-access-token" }), { status: 200 });
        }
        if (url.includes("kapi.kakao.com/v2/user/me")) {
          return new Response(JSON.stringify({ id: 424242, kakao_account: { profile: { nickname: "테스트유저" } } }), {
            status: 200,
          });
        }
        throw new Error(`unexpected fetch: ${url}`);
      });

      try {
        const kakaoRes = await request(app.getHttpServer())
          .post("/api/auth/kakao")
          .set("Authorization", `Bearer ${guestToken}`)
          .send({ code: "dummy-code" })
          .expect(201);

        const newToken = kakaoRes.body.accessToken;
        expect(newToken).toBeTruthy();
        expect(newToken).not.toBe(guestToken);

        const meRes = await request(app.getHttpServer())
          .get("/api/auth/me")
          .set("Authorization", `Bearer ${newToken}`)
          .expect(200);
        expect(meRes.body.provider).toBe("KAKAO");
        expect(meRes.body.nickname).toBe("테스트유저");

        const yarnsRes = await request(app.getHttpServer())
          .get("/api/yarns")
          .set("Authorization", `Bearer ${newToken}`)
          .expect(200);
        expect(yarnsRes.body.some((y: { brand: string }) => y.brand === "게스트가 등록한 실")).toBe(true);
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  // 3. 도안 삭제 제약 조건: 연결된 프로젝트가 있으면 삭제 거부
  describe("도안 삭제 제약 조건", () => {
    it("연결된 프로젝트가 있는 도안은 삭제할 수 없다", async () => {
      const token = await createLoggedInUser();

      const patternRes = await request(app.getHttpServer())
        .post("/api/patterns")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "테스트 도안",
          craftType: "KNITTING",
          weightCategory: "DK",
          requiredMinM: 300,
          requiredUnit: "METRIC",
          sourceType: "USER",
        })
        .expect(201);
      const patternId = patternRes.body.id;

      const checkBeforeRes = await request(app.getHttpServer())
        .get(`/api/patterns/${patternId}/delete-check`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(checkBeforeRes.body.canDelete).toBe(true);

      await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId })
        .expect(201);

      const checkAfterRes = await request(app.getHttpServer())
        .get(`/api/patterns/${patternId}/delete-check`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(checkAfterRes.body).toEqual({ canDelete: false, reason: "HAS_PROJECT" });

      await request(app.getHttpServer())
        .delete(`/api/patterns/${patternId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });

  // 4. 프로젝트 ↔ 재고 연동: 프로젝트가 실을 잡으면 가용량이 줄고, 완료하면 실사용량으로 확정되며,
  //    프로젝트를 지우면 그대로 복구된다. 배치(YarnBatch)는 이 과정에서 한 번도 변하지 않아야 한다
  describe("프로젝트 실 사용량 ↔ 재고 차감", () => {
    async function setup() {
      const token = await createLoggedInUser();

      const yarnRes = await request(app.getHttpServer())
        .post("/api/yarns")
        .set("Authorization", `Bearer ${token}`)
        .send({
          brand: "재고 테스트 실",
          weightCategory: "DK",
          batches: [{ skeinCount: 2, weightPerSkeinG: 100, lengthPerSkeinM: 200, inputUnit: "METRIC" }], // 400m
        })
        .expect(201);

      const patternRes = await request(app.getHttpServer())
        .post("/api/patterns")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "재고 테스트 도안",
          craftType: "KNITTING",
          weightCategory: "DK",
          requiredMinM: 300,
          requiredUnit: "METRIC",
          sourceType: "USER",
        })
        .expect(201);

      return { token, yarnId: yarnRes.body.id as string, patternId: patternRes.body.id as string };
    }

    function getYarn(token: string, yarnId: string) {
      return request(app.getHttpServer())
        .get(`/api/yarns/${yarnId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    }

    it("프로젝트를 시작하면 도안 필요량만큼 예약되어 가용량에서 빠진다", async () => {
      const { token, yarnId, patternId } = await setup();

      const before = await getYarn(token, yarnId);
      expect(before.body).toMatchObject({ totalM: 400, committedM: 0, availableM: 400 });

      await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId, yarnId })
        .expect(201);

      const after = await getYarn(token, yarnId);
      expect(after.body).toMatchObject({ totalM: 400, committedM: 300, availableM: 100 });
      // 배치는 그대로 - 재고 차감은 사용량 레코드로만 표현된다 (비파괴적)
      expect(after.body.batches[0].skeinCount).toBe(2);
    });

    it("예약된 실은 다른 도안 매칭에서 가용량 기준으로 평가된다", async () => {
      const { token, yarnId, patternId } = await setup();

      const beforeMatches = await request(app.getHttpServer())
        .get(`/api/yarns/${yarnId}/pattern-matches`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(beforeMatches.body[0]).toMatchObject({ label: "AMPLE" }); // 400/300 = 133%

      await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId, yarnId })
        .expect(201);

      const afterMatches = await request(app.getHttpServer())
        .get(`/api/yarns/${yarnId}/pattern-matches`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(afterMatches.body[0]).toMatchObject({ label: "INSUFFICIENT" }); // 100/300 = 33%
    });

    it("완료 시 확정한 실사용량이 예약량을 대체한다", async () => {
      const { token, yarnId, patternId } = await setup();

      const projectRes = await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId, yarnId })
        .expect(201);

      // 300m 잡아뒀지만 실제로는 250m만 씀 → 50m가 재고로 돌아와야 함
      await request(app.getHttpServer())
        .patch(`/api/projects/${projectRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "COMPLETED", confirmUsages: [{ yarnId, usedM: 250 }] })
        .expect(200);

      const after = await getYarn(token, yarnId);
      expect(after.body).toMatchObject({ totalM: 400, committedM: 250, availableM: 150 });
    });

    it("프로젝트를 삭제하면 잡고 있던 실이 재고로 돌아온다", async () => {
      const { token, yarnId, patternId } = await setup();

      const projectRes = await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId, yarnId })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/projects/${projectRes.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const after = await getYarn(token, yarnId);
      expect(after.body).toMatchObject({ totalM: 400, committedM: 0, availableM: 400 });
    });

    it("연결을 해제하면 예약이 즉시 풀린다", async () => {
      const { token, yarnId, patternId } = await setup();

      const projectRes = await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId, yarnId })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/projects/${projectRes.body.id}/yarns/${yarnId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const after = await getYarn(token, yarnId);
      expect(after.body).toMatchObject({ committedM: 0, availableM: 400 });
    });

    it("남의 실을 프로젝트에 묶으려 하면 거부된다 (실은 완전한 개인 데이터)", async () => {
      const { token, patternId } = await setup();
      const other = await setup(); // 다른 계정의 실

      const projectRes = await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/projects/${projectRes.body.id}/yarns`)
        .set("Authorization", `Bearer ${token}`)
        .send({ yarnId: other.yarnId })
        .expect(404);
    });
  });

  // 5. 홈 대시보드: 재고 집계와 "지금 뜰 수 있는 도안"이 프로젝트 예약을 반영하는지
  describe("홈 대시보드 집계", () => {
    it("프로젝트가 실을 잡으면 집계와 뜰 수 있는 도안이 함께 줄어든다", async () => {
      const token = await createLoggedInUser();

      const yarnRes = await request(app.getHttpServer())
        .post("/api/yarns")
        .set("Authorization", `Bearer ${token}`)
        .send({
          brand: "대시보드 테스트 실",
          weightCategory: "DK",
          batches: [{ skeinCount: 2, weightPerSkeinG: 100, lengthPerSkeinM: 200, inputUnit: "METRIC" }], // 400m
        })
        .expect(201);

      const patternRes = await request(app.getHttpServer())
        .post("/api/patterns")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "대시보드 테스트 도안",
          craftType: "KNITTING",
          weightCategory: "DK",
          requiredMinM: 300,
          requiredUnit: "METRIC",
          sourceType: "USER",
        })
        .expect(201);

      const before = await request(app.getHttpServer())
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(before.body.stash).toMatchObject({ yarnCount: 1, totalM: 400, committedM: 0, availableM: 400 });
      expect(before.body.weightDistribution).toEqual([
        { weightCategory: "DK", yarnCount: 1, totalM: 400, availableM: 400 },
      ]);
      expect(before.body.readyToKnit.count).toBe(1);

      await request(app.getHttpServer())
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ patternId: patternRes.body.id, yarnId: yarnRes.body.id })
        .expect(201);

      const after = await request(app.getHttpServer())
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(after.body.stash).toMatchObject({ totalM: 400, committedM: 300, availableM: 100 });
      expect(after.body.projects).toMatchObject({ IN_PROGRESS: 1 });
      // 100m만 남았으므로 300m짜리 도안은 더 이상 "바로 뜰 수 있는" 목록에 없다
      expect(after.body.readyToKnit.count).toBe(0);
    });

    it("토큰 없이 조회하면 401", async () => {
      await request(app.getHttpServer()).get("/api/dashboard").expect(401);
    });
  });
});
