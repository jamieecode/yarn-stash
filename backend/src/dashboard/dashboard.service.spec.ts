import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  let service: DashboardService;
  let prisma: {
    yarn: { findMany: jest.Mock };
    project: { groupBy: jest.Mock };
    patternBookmark: { count: jest.Mock };
    pattern: { findMany: jest.Mock };
  };

  function yarn(overrides: Record<string, unknown> = {}) {
    return {
      id: "yarn-1",
      brand: "브랜드",
      lineName: "라인",
      weightCategory: "DK",
      batches: [{ dyeLot: null, skeinCount: 2, lengthPerSkeinM: 200, weightPerSkeinG: 100 }], // 400m / 200g
      usages: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    prisma = {
      yarn: { findMany: jest.fn().mockResolvedValue([]) },
      project: { groupBy: jest.fn().mockResolvedValue([]) },
      patternBookmark: { count: jest.fn().mockResolvedValue(0) },
      pattern: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  describe("stash 합계", () => {
    it("보유량과 가용량을 나눠서 집계한다", async () => {
      prisma.yarn.findMany.mockResolvedValue([
        yarn({ id: "a", usages: [{ reservedM: 300, usedM: null, project: { status: "IN_PROGRESS" } }] }),
        yarn({ id: "b" }),
      ]);

      const result = await service.getSummary("user-1");

      expect(result.stash).toEqual({
        yarnCount: 2,
        skeinCount: 4,
        totalM: 800,
        committedM: 300,
        availableM: 500,
        totalG: 400,
      });
    });

    it("소진 처리된 실은 아예 조회하지 않는다", async () => {
      await service.getSummary("user-1");

      expect(prisma.yarn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1", consumed: false } }),
      );
    });

    it("실이 하나도 없어도 0으로 채운 요약을 돌려준다", async () => {
      const result = await service.getSummary("user-1");

      expect(result.stash.yarnCount).toBe(0);
      expect(result.stash.totalM).toBe(0);
      expect(result.weightDistribution).toEqual([]);
      expect(result.readyToKnit).toEqual({ count: 0, samples: [] });
    });
  });

  describe("weightDistribution", () => {
    it("무게 카테고리별로 묶고 보유량 많은 순으로 정렬한다", async () => {
      prisma.yarn.findMany.mockResolvedValue([
        yarn({ id: "a", weightCategory: "DK" }),
        yarn({ id: "b", weightCategory: "WORSTED", batches: [{ dyeLot: null, skeinCount: 5, lengthPerSkeinM: 200, weightPerSkeinG: 100 }] }),
        yarn({ id: "c", weightCategory: "DK" }),
      ]);

      const result = await service.getSummary("user-1");

      expect(result.weightDistribution).toEqual([
        { weightCategory: "WORSTED", yarnCount: 1, totalM: 1000, availableM: 1000 },
        { weightCategory: "DK", yarnCount: 2, totalM: 800, availableM: 800 },
      ]);
    });

    // 카테고리 미입력 실은 매칭에선 빠지지만 재고에는 있으므로 분포에서 사라지면 안 됨
    it("무게 카테고리가 없는 실을 null 그룹으로 남긴다", async () => {
      prisma.yarn.findMany.mockResolvedValue([yarn({ weightCategory: null })]);

      const result = await service.getSummary("user-1");

      expect(result.weightDistribution).toEqual([
        { weightCategory: null, yarnCount: 1, totalM: 400, availableM: 400 },
      ]);
    });
  });

  describe("readyToKnit", () => {
    it("가용량으로 커버되는 도안만 센다", async () => {
      prisma.yarn.findMany.mockResolvedValue([yarn()]); // DK 400m 가용
      prisma.pattern.findMany.mockResolvedValue([
        { id: "fits", name: "맞는 도안", weightCategory: "DK", requiredMinM: 300 },
        { id: "too-big", name: "부족한 도안", weightCategory: "DK", requiredMinM: 900 },
      ]);

      const result = await service.getSummary("user-1");

      expect(result.readyToKnit.count).toBe(1);
      expect(result.readyToKnit.samples[0]).toMatchObject({ id: "fits" });
    });

    // 이 기능의 핵심 - 프로젝트가 잡아둔 실로는 새로 시작할 수 없으므로 "뜰 수 있는 도안"에서 빠져야 함
    it("다른 프로젝트가 잡고 있는 실은 뜰 수 있는 도안으로 세지 않는다", async () => {
      prisma.yarn.findMany.mockResolvedValue([
        yarn({ usages: [{ reservedM: 350, usedM: null, project: { status: "IN_PROGRESS" } }] }), // 50m만 남음
      ]);
      prisma.pattern.findMany.mockResolvedValue([
        { id: "fits", name: "맞는 도안", weightCategory: "DK", requiredMinM: 300 },
      ]);

      const result = await service.getSummary("user-1");

      expect(result.readyToKnit.count).toBe(0);
    });

    it("실 하나로 커버되는 것만 세고, 여러 실을 합쳐야 하는 경우는 제외한다", async () => {
      prisma.yarn.findMany.mockResolvedValue([
        yarn({ id: "a", batches: [{ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 200, weightPerSkeinG: 100 }] }),
        yarn({ id: "b", batches: [{ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 200, weightPerSkeinG: 100 }] }),
      ]);
      prisma.pattern.findMany.mockResolvedValue([
        { id: "needs-both", name: "합쳐야 되는 도안", weightCategory: "DK", requiredMinM: 350 },
      ]);

      const result = await service.getSummary("user-1");

      // 합치면 400m라 되지만, 실 하나로는 200m뿐이라 세지 않는다
      expect(result.readyToKnit.count).toBe(0);
    });

    it("여유가 큰 순으로 정렬해 최대 3개만 샘플로 준다", async () => {
      prisma.yarn.findMany.mockResolvedValue([yarn()]); // DK 400m
      prisma.pattern.findMany.mockResolvedValue([
        { id: "p1", name: "1", weightCategory: "DK", requiredMinM: 400 }, // 100%
        { id: "p2", name: "2", weightCategory: "DK", requiredMinM: 100 }, // 400%
        { id: "p3", name: "3", weightCategory: "DK", requiredMinM: 200 }, // 200%
        { id: "p4", name: "4", weightCategory: "DK", requiredMinM: 300 }, // 133%
      ]);

      const result = await service.getSummary("user-1");

      expect(result.readyToKnit.count).toBe(4);
      expect(result.readyToKnit.samples.map((s) => s.id)).toEqual(["p2", "p3", "p4"]);
    });

    it("보유한 무게 카테고리의 도안만 조회한다", async () => {
      prisma.yarn.findMany.mockResolvedValue([yarn({ weightCategory: "DK" }), yarn({ id: "b", weightCategory: null })]);

      await service.getSummary("user-1");

      expect(prisma.pattern.findMany).toHaveBeenCalledWith({ where: { weightCategory: { in: ["DK"] } } });
    });
  });

  describe("프로젝트/찜 개수", () => {
    it("상태별 프로젝트 개수를 채우고 없는 상태는 0으로 둔다", async () => {
      prisma.project.groupBy.mockResolvedValue([
        { status: "IN_PROGRESS", _count: 2 },
        { status: "COMPLETED", _count: 5 },
      ]);
      prisma.patternBookmark.count.mockResolvedValue(7);

      const result = await service.getSummary("user-1");

      expect(result.projects).toEqual({ IN_PROGRESS: 2, COMPLETED: 5, ON_HOLD: 0 });
      expect(result.bookmarkCount).toBe(7);
    });
  });
});
