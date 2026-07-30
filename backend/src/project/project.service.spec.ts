import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectService } from "./project.service";

describe("ProjectService", () => {
  let service: ProjectService;
  let prisma: {
    project: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      project: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ProjectService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ProjectService);
  });

  describe("startOrResume", () => {
    it("resumes the existing IN_PROGRESS project instead of creating a duplicate", async () => {
      const existing = { id: "project-1", userId: "user-1", patternId: "pattern-1", status: "IN_PROGRESS" };
      prisma.project.findFirst.mockResolvedValue(existing);

      const result = await service.startOrResume("user-1", "pattern-1", "yarn-1");

      expect(result).toBe(existing);
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1", patternId: "pattern-1", status: "IN_PROGRESS" },
      });
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it("creates a fresh project (currentRow 0) when there's no in-progress project for this pattern", async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue({ id: "project-2" });

      await service.startOrResume("user-1", "pattern-1", "yarn-1");

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { userId: "user-1", patternId: "pattern-1", yarnId: "yarn-1", status: "IN_PROGRESS", currentRow: 0 },
      });
    });

    it("allows starting a new project even if a COMPLETED one exists for the same pattern (재작업 허용, 기획서 2.14)", async () => {
      // findFirst is scoped to status: IN_PROGRESS, so a completed one won't be picked up here
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue({ id: "project-3" });

      await service.startOrResume("user-1", "pattern-1");

      expect(prisma.project.create).toHaveBeenCalled();
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
      prisma.project.update.mockResolvedValue({ id: "project-1", currentRow: 5 });

      await service.update("user-1", "project-1", { currentRow: 5 });

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "project-1" }, data: expect.objectContaining({ currentRow: 5 }) }),
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
