import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectService } from "./project.service";

describe("ProjectService", () => {
  let service: ProjectService;
  let prisma: {
    project: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    projectYarnUsage: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
    };
    yarn: { findFirst: jest.Mock };
    pattern: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      project: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      projectYarnUsage: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      yarn: { findFirst: jest.fn() },
      pattern: { findUnique: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ProjectService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ProjectService);
  });

  describe("startOrResume", () => {
    it("resumes the existing IN_PROGRESS project instead of creating a duplicate", async () => {
      const existing = { id: "project-1", userId: "user-1", patternId: "pattern-1", status: "IN_PROGRESS", yarnUsages: [] };
      prisma.project.findFirst.mockResolvedValue(existing);
      prisma.yarn.findFirst.mockResolvedValue({ id: "yarn-1", userId: "user-1" });
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", requiredMinM: 400 });

      const result = await service.startOrResume("user-1", "pattern-1", "yarn-1");

      expect(result).toEqual(existing);
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1", patternId: "pattern-1", status: "IN_PROGRESS" },
      });
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it("creates a fresh project (currentRow 0) when there's no in-progress project for this pattern", async () => {
      prisma.project.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ id: "project-2", userId: "user-1", patternId: "pattern-1", yarnUsages: [] });
      prisma.project.create.mockResolvedValue({ id: "project-2", patternId: "pattern-1" });
      prisma.yarn.findFirst.mockResolvedValue({ id: "yarn-1", userId: "user-1" });
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", requiredMinM: 400 });

      await service.startOrResume("user-1", "pattern-1", "yarn-1");

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { userId: "user-1", patternId: "pattern-1", status: "IN_PROGRESS", currentRow: 0 },
      });
    });

    // 실 선택은 이제 Project 컬럼이 아니라 ProjectYarnUsage 레코드로 표현되고, 예약량이 함께 잡힌다
    it("links the picked yarn as a usage reserving the pattern's requiredMinM", async () => {
      prisma.project.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ id: "project-2", userId: "user-1", patternId: "pattern-1", yarnUsages: [] });
      prisma.project.create.mockResolvedValue({ id: "project-2", patternId: "pattern-1" });
      prisma.yarn.findFirst.mockResolvedValue({ id: "yarn-1", userId: "user-1" });
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", requiredMinM: 400 });

      await service.startOrResume("user-1", "pattern-1", "yarn-1");

      expect(prisma.projectYarnUsage.create).toHaveBeenCalledWith({
        data: { projectId: "project-2", yarnId: "yarn-1", reservedM: 400 },
      });
    });

    it("starts without touching yarn stock when no yarn was picked", async () => {
      prisma.project.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ id: "project-3", userId: "user-1", yarnUsages: [] });
      prisma.project.create.mockResolvedValue({ id: "project-3" });

      await service.startOrResume("user-1", "pattern-1");

      expect(prisma.projectYarnUsage.create).not.toHaveBeenCalled();
    });

    it("allows starting a new project even if a COMPLETED one exists for the same pattern (재작업 허용, 기획서 2.14)", async () => {
      // findFirst is scoped to status: IN_PROGRESS, so a completed one won't be picked up here
      prisma.project.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ id: "project-3", userId: "user-1", yarnUsages: [] });
      prisma.project.create.mockResolvedValue({ id: "project-3" });

      await service.startOrResume("user-1", "pattern-1");

      expect(prisma.project.create).toHaveBeenCalled();
    });
  });

  describe("addYarn", () => {
    beforeEach(() => {
      prisma.project.findFirst.mockResolvedValue({ id: "project-1", userId: "user-1", patternId: "pattern-1" });
      prisma.yarn.findFirst.mockResolvedValue({ id: "yarn-1", userId: "user-1" });
      prisma.pattern.findUnique.mockResolvedValue({ id: "pattern-1", requiredMinM: 400 });
    });

    it("rejects linking a yarn the user doesn't own (실은 완전한 개인 데이터, 기획서 2.9)", async () => {
      prisma.yarn.findFirst.mockResolvedValue(null);

      await expect(service.addYarn("user-1", "project-1", { yarnId: "someone-elses" })).rejects.toThrow(NotFoundException);
      expect(prisma.projectYarnUsage.create).not.toHaveBeenCalled();
    });

    it("is idempotent - linking the same yarn twice returns the existing usage without a second reservation", async () => {
      const existing = { id: "usage-1", projectId: "project-1", yarnId: "yarn-1", reservedM: 400 };
      prisma.projectYarnUsage.findUnique.mockResolvedValue(existing);

      const result = await service.addYarn("user-1", "project-1", { yarnId: "yarn-1" });

      expect(result).toBe(existing);
      expect(prisma.projectYarnUsage.create).not.toHaveBeenCalled();
    });

    // 배색처럼 실을 나눠 쓰는 경우 추가 실까지 requiredMinM으로 잡으면 재고가 두 배로 묶여버림
    it("defaults the second yarn's reservation to 0 instead of the full requirement", async () => {
      prisma.projectYarnUsage.findUnique.mockResolvedValue(null);
      prisma.projectYarnUsage.count.mockResolvedValue(1);

      await service.addYarn("user-1", "project-1", { yarnId: "yarn-2" });

      expect(prisma.projectYarnUsage.create).toHaveBeenCalledWith({
        data: { projectId: "project-1", yarnId: "yarn-2", reservedM: 0 },
      });
    });

    it("normalizes an explicitly given reservation from the user's input unit to meters", async () => {
      prisma.projectYarnUsage.findUnique.mockResolvedValue(null);

      await service.addYarn("user-1", "project-1", { yarnId: "yarn-1", reservedM: 100, inputUnit: "IMPERIAL" });

      expect(prisma.projectYarnUsage.create).toHaveBeenCalledWith({
        data: { projectId: "project-1", yarnId: "yarn-1", reservedM: 91.4 }, // 100yd
      });
    });
  });

  describe("updateYarn / removeYarn", () => {
    beforeEach(() => {
      prisma.project.findFirst.mockResolvedValue({ id: "project-1", userId: "user-1" });
    });

    it("throws when the yarn isn't linked to this project", async () => {
      prisma.projectYarnUsage.findUnique.mockResolvedValue(null);
      await expect(service.updateYarn("user-1", "project-1", "yarn-9", { usedM: 100 })).rejects.toThrow(NotFoundException);
    });

    it("records the confirmed usage in meters", async () => {
      prisma.projectYarnUsage.findUnique.mockResolvedValue({ id: "usage-1" });

      await service.updateYarn("user-1", "project-1", "yarn-1", { usedM: 100, inputUnit: "IMPERIAL" });

      expect(prisma.projectYarnUsage.update).toHaveBeenCalledWith({
        where: { id: "usage-1" },
        data: { reservedM: undefined, usedM: 91.4 },
      });
    });

    it("unlinking gives the reserved yarn back to the stash", async () => {
      prisma.projectYarnUsage.deleteMany.mockResolvedValue({ count: 1 });

      await expect(service.removeYarn("user-1", "project-1", "yarn-1")).resolves.toEqual({ success: true });
      expect(prisma.projectYarnUsage.deleteMany).toHaveBeenCalledWith({ where: { projectId: "project-1", yarnId: "yarn-1" } });
    });

    it("throws instead of silently succeeding when there was nothing to unlink", async () => {
      prisma.projectYarnUsage.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.removeYarn("user-1", "project-1", "yarn-1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("throws NotFoundException instead of writing when the user doesn't own the project", async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.update("user-1", "project-1", { currentRow: 5 })).rejects.toThrow(NotFoundException);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it("updates the project once ownership is confirmed", async () => {
      prisma.project.findFirst.mockResolvedValue({ id: "project-1", userId: "user-1" });
      prisma.project.update.mockResolvedValue({ id: "project-1", currentRow: 5, yarnUsages: [] });

      await service.update("user-1", "project-1", { currentRow: 5 });

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "project-1" }, data: expect.objectContaining({ currentRow: 5 }) }),
      );
    });

    // 완료 처리와 실사용량 확정이 한 요청 안에서 끝나야 "완료했는데 재고는 그대로"인 중간 상태가 안 생김
    it("confirms the actual yarn usage in the same request that completes the project", async () => {
      prisma.project.findFirst.mockResolvedValue({ id: "project-1", userId: "user-1" });
      prisma.project.update.mockResolvedValue({ id: "project-1", status: "COMPLETED", yarnUsages: [] });

      await service.update("user-1", "project-1", {
        status: "COMPLETED",
        confirmUsages: [{ yarnId: "yarn-1", usedM: 320 }],
      });

      expect(prisma.projectYarnUsage.updateMany).toHaveBeenCalledWith({
        where: { projectId: "project-1", yarnId: "yarn-1" },
        data: { usedM: 320 },
      });
      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) }),
      );
    });
  });

  describe("remove", () => {
    it("throws NotFoundException instead of deleting when the user doesn't own the project", async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(service.remove("user-1", "project-1")).rejects.toThrow(NotFoundException);
      expect(prisma.project.delete).not.toHaveBeenCalled();
    });

    it("deletes the project once ownership is confirmed", async () => {
      prisma.project.findFirst.mockResolvedValue({ id: "project-1", userId: "user-1" });
      prisma.project.delete.mockResolvedValue({});

      const result = await service.remove("user-1", "project-1");

      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: "project-1" } });
      expect(result).toEqual({ success: true });
    });
  });
});
