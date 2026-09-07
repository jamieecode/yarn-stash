import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { YarnService } from "./yarn.service";

describe("YarnService", () => {
  let service: YarnService;
  let prisma: {
    yarn: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    yarnBatch: { create: jest.Mock; update: jest.Mock; delete: jest.Mock; findFirst: jest.Mock };
    pattern: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      yarn: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      yarnBatch: { create: jest.fn(), update: jest.fn(), delete: jest.fn(), findFirst: jest.fn() },
      pattern: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [YarnService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(YarnService);
  });

  describe("findOne", () => {
    it("throws NotFoundException when the yarn doesn't exist (or isn't owned by this user)", async () => {
      prisma.yarn.findFirst.mockResolvedValue(null);
      await expect(service.findOne("user-1", "yarn-1")).rejects.toThrow(NotFoundException);
    });

    it("returns the yarn including batches/photos when found", async () => {
      const yarn = { id: "yarn-1", userId: "user-1", batches: [], photos: [], usages: [] };
      prisma.yarn.findFirst.mockResolvedValue(yarn);
      await expect(service.findOne("user-1", "yarn-1")).resolves.toMatchObject({ id: "yarn-1", batches: [], photos: [] });
    });

    it("reports total/committed/available stock so the list and detail don't have to recompute it", async () => {
      prisma.yarn.findFirst.mockResolvedValue({
        id: "yarn-1",
        userId: "user-1",
        batches: [{ dyeLot: null, skeinCount: 5, lengthPerSkeinM: 100 }], // 500m held
        photos: [],
        usages: [{ reservedM: 200, usedM: null, project: { status: "IN_PROGRESS" } }],
      });

      await expect(service.findOne("user-1", "yarn-1")).resolves.toMatchObject({
        totalM: 500,
        committedM: 200,
        availableM: 300,
      });
    });
  });

  describe("update", () => {
    it("throws NotFoundException before writing if the user doesn't own the yarn", async () => {
      prisma.yarn.findFirst.mockResolvedValue(null);
      await expect(service.update("user-1", "yarn-1", { consumed: true })).rejects.toThrow(NotFoundException);
      expect(prisma.yarn.update).not.toHaveBeenCalled();
    });

    it("updates the yarn once ownership is confirmed", async () => {
      prisma.yarn.findFirst.mockResolvedValue({ id: "yarn-1", userId: "user-1" });
      prisma.yarn.update.mockResolvedValue({ id: "yarn-1", consumed: true });

      await service.update("user-1", "yarn-1", { consumed: true });

      expect(prisma.yarn.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "yarn-1" }, data: expect.objectContaining({ consumed: true }) }),
      );
    });
  });

  describe("remove", () => {
    it("throws NotFoundException instead of deleting when the user doesn't own the yarn", async () => {
      prisma.yarn.findFirst.mockResolvedValue(null);
      await expect(service.remove("user-1", "yarn-1")).rejects.toThrow(NotFoundException);
      expect(prisma.yarn.delete).not.toHaveBeenCalled();
    });

    it("deletes the yarn once ownership is confirmed", async () => {
      prisma.yarn.findFirst.mockResolvedValue({ id: "yarn-1", userId: "user-1" });
      prisma.yarn.delete.mockResolvedValue({});

      const result = await service.remove("user-1", "yarn-1");

      expect(prisma.yarn.delete).toHaveBeenCalledWith({ where: { id: "yarn-1" } });
      expect(result).toEqual({ success: true });
    });
  });

  describe("findPatternMatches", () => {
    it("returns an empty list without querying patterns when the yarn is consumed (기획서 2.3)", async () => {
      prisma.yarn.findFirst.mockResolvedValue({
        id: "yarn-1",
        userId: "user-1",
        consumed: true,
        weightCategory: "WORSTED",
        batches: [],
        usages: [],
      });

      const result = await service.findPatternMatches("user-1", "yarn-1");

      expect(result).toEqual([]);
      expect(prisma.pattern.findMany).not.toHaveBeenCalled();
    });

    it("returns an empty list when the yarn has no weight category set", async () => {
      prisma.yarn.findFirst.mockResolvedValue({
        id: "yarn-1",
        userId: "user-1",
        consumed: false,
        weightCategory: null,
        batches: [],
        usages: [],
      });

      const result = await service.findPatternMatches("user-1", "yarn-1");

      expect(result).toEqual([]);
      expect(prisma.pattern.findMany).not.toHaveBeenCalled();
    });

    it("matches against same-weight patterns and sorts by ratio percent descending", async () => {
      prisma.yarn.findFirst.mockResolvedValue({
        id: "yarn-1",
        userId: "user-1",
        consumed: false,
        weightCategory: "WORSTED",
        gaugeStitches: 18,
        batches: [{ dyeLot: null, skeinCount: 2, lengthPerSkeinM: 100 }], // 200m held
        usages: [],
      });
      prisma.pattern.findMany.mockResolvedValue([
        { id: "pattern-tight", requiredMinM: 190, gaugeStitches: 18 }, // ~105% -> TIGHT
        { id: "pattern-ample", requiredMinM: 100, gaugeStitches: 19 }, // 200% -> AMPLE
      ]);

      const result = await service.findPatternMatches("user-1", "yarn-1");

      expect(result.map((r) => r.pattern.id)).toEqual(["pattern-ample", "pattern-tight"]);
      expect(result[0].label).toBe("AMPLE");
      expect(result[0].gaugeChip).toBe("MATCH");
      expect(result[1].label).toBe("TIGHT");
      expect(prisma.pattern.findMany).toHaveBeenCalledWith({ where: { weightCategory: "WORSTED" } });
    });

    // 이 기능의 핵심 - 다른 프로젝트가 잡아둔 실은 그만큼 빼고 매칭해야 "충분함"이 거짓말이 되지 않음
    it("matches on the available amount, not the total held, when another project already reserved the yarn", async () => {
      prisma.yarn.findFirst.mockResolvedValue({
        id: "yarn-1",
        userId: "user-1",
        consumed: false,
        weightCategory: "WORSTED",
        gaugeStitches: null,
        batches: [{ dyeLot: null, skeinCount: 2, lengthPerSkeinM: 100 }], // 200m held
        usages: [{ reservedM: 150, usedM: null, project: { status: "IN_PROGRESS" } }], // 50m actually free
      });
      prisma.pattern.findMany.mockResolvedValue([{ id: "pattern-1", requiredMinM: 100, gaugeStitches: null }]);

      const result = await service.findPatternMatches("user-1", "yarn-1");

      // 총 보유량(200m) 기준이면 200% AMPLE로 떴을 상황
      expect(result[0].ratioPercent).toBe(50);
      expect(result[0].label).toBe("INSUFFICIENT");
    });

    it("frees the reservation back up once the holding project is deleted (usages disappear with it)", async () => {
      prisma.yarn.findFirst.mockResolvedValue({
        id: "yarn-1",
        userId: "user-1",
        consumed: false,
        weightCategory: "WORSTED",
        gaugeStitches: null,
        batches: [{ dyeLot: null, skeinCount: 2, lengthPerSkeinM: 100 }],
        usages: [],
      });
      prisma.pattern.findMany.mockResolvedValue([{ id: "pattern-1", requiredMinM: 100, gaugeStitches: null }]);

      const result = await service.findPatternMatches("user-1", "yarn-1");

      expect(result[0].ratioPercent).toBe(200);
      expect(result[0].label).toBe("AMPLE");
    });
  });
});
