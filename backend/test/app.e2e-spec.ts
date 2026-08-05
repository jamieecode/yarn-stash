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

  beforeEach(async () => {
    // FK 자식 테이블부터 순서대로 정리
    await prisma.projectPhoto.deleteMany();
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
    async function createLoggedInUser() {
      // 도안 등록은 게스트 불가(코드가 provider !== GUEST를 체크) → 카카오 로그인으로 실제 계정 발급
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
});
