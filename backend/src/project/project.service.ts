import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProjectDto } from "./dto/update-project.dto";

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  // 화면설계서 7번(프로젝트 목록) - 카드에 도안명·연결된 실이 필요해 pattern/yarn을 함께 include.
  // patternId로도 필터 가능 - 도안 상세에서 "이미 진행 중인 프로젝트가 있는지"(본인 소유 범위 내에서) 확인할 때 재사용 (화면설계서 6번)
  async findAll(userId: string, status?: string, patternId?: string) {
    return this.prisma.project.findMany({
      where: { userId, status: status as any, patternId },
      include: { pattern: true, yarn: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { photos: true, pattern: true, yarn: true },
    });
    if (!project) throw new NotFoundException("프로젝트를 찾을 수 없어요");
    return project;
  }

  // 화면설계서 6-2(프로젝트 시작). Project는 userId+patternId 유니크 제약이 없으므로
  // "이미 진행 중인 프로젝트가 있으면 새로 안 만들고 기존으로 이동"은 여기서 애플리케이션 레벨로 체크
  // (기획서 설계 메모, 정합성 점검에서 확정한 방식)
  async startOrResume(userId: string, patternId: string, yarnId?: string) {
    const existing = await this.prisma.project.findFirst({
      where: { userId, patternId, status: "IN_PROGRESS" },
    });
    if (existing) return existing;

    return this.prisma.project.create({
      data: { userId, patternId, yarnId, status: "IN_PROGRESS", currentRow: 0 },
    });
  }

  // 화면설계서 7-1 - status/currentRow/memo/사진/yarnId 연결 부분 수정.
  // 단수는 프론트가 +1/-1/리셋을 반영한 최종 값을 계산해서 보내는 방식(절대값 patch)
  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    await this.assertOwnership(userId, projectId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: dto.status as any,
        currentRow: dto.currentRow,
        memo: dto.memo,
        yarnId: dto.yarnId,
        photos: dto.photos
          ? { deleteMany: {}, create: dto.photos.map((p) => ({ url: p.url, publicId: p.publicId })) }
          : undefined,
      },
      include: { photos: true, pattern: true, yarn: true },
    });
  }

  // 소유자 검증 후 삭제 (사진은 onDelete: Cascade라 자동 정리)
  async remove(userId: string, projectId: string) {
    await this.assertOwnership(userId, projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }

  private async assertOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException("프로젝트를 찾을 수 없어요");
    return project;
  }
}
