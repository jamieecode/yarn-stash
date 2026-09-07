import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { RavelryService } from "../ravelry/ravelry.service";
import { PatternService } from "./pattern.service";

describe("PatternService", () => {
  let service: PatternService;
  let prisma: {
    pattern: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    patternBookmark: { count: jest.Mock; upsert: jest.Mock; deleteMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    project: { count: jest.Mock };
    yarn: { findMany: jest.Mock };
  };
  let ravelry: { searchPatterns: jest.Mock; getPatternDetail: jest.Mock };

  beforeEach(async () => {
    prisma = {
      pattern: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      patternBookmark: {
        count: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      project: { count: jest.fn() },
      yarn: { findMany: jest.fn() },
    };
    ravelry = { searchPatterns: jest.fn(), getPatternDetail: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PatternService,
        { provide: PrismaService, useValue: prisma },
        { provide: RavelryService, useValue: ravelry },
      ],
    }).compile();

    service = moduleRef.get(PatternService);
  });

  describe("create", () => {
    it("rejects guests (공유 데이터 등록은 로그인 필요, 기획서 2.9)", async () => {
      await expect(
        service.create("user-1", "GUEST", {
          name: "Test",
          craftType: "KNITTING",
          weightCategory: "WORSTED",
          requiredMinM: 900,
          requiredUnit: "METRIC",
          sourceType: "USER",
        } as any),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.pattern.create).not.toHaveBeenCalled();
    });

    it("normalizes yardage to meters before saving", async () => {
      prisma.pattern.create.mockResolvedValue({ id: "pattern-1" });

      await service.create("user-1", "KAKAO", {
        name: "Test",
        craftType: "KNITTING",
        weightCategory: "WORSTED",
        requiredMinM: 100,
        requiredUnit: "IMPERIAL",
        sourceType: "USER",
      } as any);

      expect(prisma.pattern.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ requiredMinM: 91.4 }) }),
      );
    });
  });

  describe("remove", () => {
    beforeEach(() => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", createdByUserId: "owner-1" });
    });

    it("refuses to delete when someone else has bookmarked it", async () => {
      prisma.patternBookmark.count.mockResolvedValue(1);
      prisma.project.count.mockResolvedValue(0);

      await expect(service.remove("owner-1", "pattern-1")).rejects.toThrow(ForbiddenException);
      expect(prisma.pattern.delete).not.toHaveBeenCalled();
    });

    it("refuses to delete when a project references it", async () => {
      prisma.patternBookmark.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(1);

      await expect(service.remove("owner-1", "pattern-1")).rejects.toThrow(ForbiddenException);
      expect(prisma.pattern.delete).not.toHaveBeenCalled();
    });

    it("refuses to delete when the caller isn't the owner", async () => {
      await expect(service.remove("someone-else", "pattern-1")).rejects.toThrow(ForbiddenException);
      expect(prisma.pattern.delete).not.toHaveBeenCalled();
    });

    it("deletes when the caller owns it, nobody else bookmarked it, and no project references it", async () => {
      prisma.patternBookmark.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);
      prisma.pattern.delete.mockResolvedValue({});

      const result = await service.remove("owner-1", "pattern-1");

      expect(prisma.pattern.delete).toHaveBeenCalledWith({ where: { id: "pattern-1" } });
      expect(result).toEqual({ success: true });
    });
  });

  describe("getDeleteEligibility", () => {
    it("returns NOT_OWNER when the caller didn't create the pattern", async () => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", createdByUserId: "owner-1" });

      await expect(service.getDeleteEligibility("someone-else", "pattern-1")).resolves.toEqual({
        canDelete: false,
        reason: "NOT_OWNER",
      });
    });

    it("returns BOOKMARKED_BY_OTHERS when someone else has bookmarked it", async () => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", createdByUserId: "owner-1" });
      prisma.patternBookmark.count.mockResolvedValue(1);
      prisma.project.count.mockResolvedValue(0);

      await expect(service.getDeleteEligibility("owner-1", "pattern-1")).resolves.toEqual({
        canDelete: false,
        reason: "BOOKMARKED_BY_OTHERS",
      });
    });

    it("returns HAS_PROJECT when a project references it", async () => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", createdByUserId: "owner-1" });
      prisma.patternBookmark.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(1);

      await expect(service.getDeleteEligibility("owner-1", "pattern-1")).resolves.toEqual({
        canDelete: false,
        reason: "HAS_PROJECT",
      });
    });

    it("returns canDelete true when there are no blockers", async () => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", createdByUserId: "owner-1" });
      prisma.patternBookmark.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);

      await expect(service.getDeleteEligibility("owner-1", "pattern-1")).resolves.toEqual({ canDelete: true });
    });
  });

  describe("findYarnMatches", () => {
    it("only matches consumed=false yarns of the same weight category, sorted by ratio descending", async () => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", weightCategory: "WORSTED", requiredMinM: 100 });
      prisma.yarn.findMany.mockResolvedValue([
        { id: "yarn-tight", gaugeStitches: null, batches: [{ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 105 }], usages: [] },
        { id: "yarn-ample", gaugeStitches: null, batches: [{ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 300 }], usages: [] },
      ]);

      const result = await service.findYarnMatches("user-1", "pattern-1");

      expect(prisma.yarn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1", weightCategory: "WORSTED", consumed: false } }),
      );
      expect(result.map((r) => r.yarn.id)).toEqual(["yarn-ample", "yarn-tight"]);
    });

    // 도안→실 방향도 실→도안 방향과 같은 기준이어야 함 - 한쪽만 총 보유량을 쓰면 두 화면이 서로 다른 답을 냄
    it("ranks by the available amount so a yarn another project is holding drops down the list", async () => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", weightCategory: "WORSTED", requiredMinM: 100 });
      prisma.yarn.findMany.mockResolvedValue([
        {
          id: "yarn-reserved",
          gaugeStitches: null,
          batches: [{ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 300 }], // 300m held, but 280m is spoken for
          usages: [{ reservedM: 280, usedM: null, project: { status: "IN_PROGRESS" } }],
        },
        {
          id: "yarn-free",
          gaugeStitches: null,
          batches: [{ dyeLot: null, skeinCount: 1, lengthPerSkeinM: 150 }],
          usages: [],
        },
      ]);

      const result = await service.findYarnMatches("user-1", "pattern-1");

      expect(result.map((r) => r.yarn.id)).toEqual(["yarn-free", "yarn-reserved"]);
      expect(result[0].yarn.availableM).toBe(150);
      expect(result[1].yarn.availableM).toBe(20);
      expect(result[1].label).toBe("INSUFFICIENT");
    });
  });

  describe("addBookmark / removeBookmark / updateBookmarkMemo", () => {
    it("upserts a bookmark so toggling twice doesn't create duplicates", async () => {
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1" });
      prisma.patternBookmark.upsert.mockResolvedValue({ userId: "user-1", patternId: "pattern-1" });

      await service.addBookmark("user-1", "pattern-1");

      expect(prisma.patternBookmark.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId_patternId: { userId: "user-1", patternId: "pattern-1" } } }),
      );
    });

    it("rejects a memo update when there's no bookmark yet (기획서 2.4 - 메모는 찜 상태에서만 의미 있음)", async () => {
      prisma.patternBookmark.findUnique.mockResolvedValue(null);

      await expect(service.updateBookmarkMemo("user-1", "pattern-1", "5.5mm로")).rejects.toThrow(NotFoundException);
      expect(prisma.patternBookmark.update).not.toHaveBeenCalled();
    });
  });
});
