import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toMeters } from "../common/units.util";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { CreateProjectYarnDto, UpdateProjectYarnDto } from "./dto/project-yarn.dto";

// 프로젝트 카드/상세 모두 "어떤 도안을, 어떤 실로, 얼마나 잡고" 있는지를 함께 보여주므로 include를 공유한다.
// 실 사진은 카드 썸네일에 쓰이고, 배치는 "예약량이 보유량을 넘었는지" 경고를 프론트에서 계산하는 데 쓰인다
const PROJECT_INCLUDE = {
  pattern: true,
  photos: true,
  yarnUsages: {
    include: { yarn: { include: { batches: true, photos: true } } },
    orderBy: { createdAt: "asc" },
  },
} as const;

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  // 화면설계서 7번(프로젝트 목록).
  // patternId로도 필터 가능 - 도안 상세에서 "이미 진행 중인 프로젝트가 있는지"(본인 소유 범위 내에서) 확인할 때 재사용 (화면설계서 6번)
  async findAll(userId: string, status?: string, patternId?: string) {
    return this.prisma.project.findMany({
      where: { userId, status: status as any, patternId },
      include: PROJECT_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: PROJECT_INCLUDE,
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

    // 재개하는 경우에도 시작 화면에서 실을 골랐다면 그 선택을 반영한다 (이미 연결돼 있으면 addYarn이 그대로 둠)
    if (existing) {
      if (yarnId) await this.addYarn(userId, existing.id, { yarnId });
      return this.findOne(userId, existing.id);
    }

    const created = await this.prisma.project.create({
      data: { userId, patternId, status: "IN_PROGRESS", currentRow: 0 },
    });
    if (yarnId) await this.addYarn(userId, created.id, { yarnId });
    return this.findOne(userId, created.id);
  }

  // 화면설계서 7-1 - status/currentRow/memo/사진 부분 수정.
  // 단수는 프론트가 +1/-1/리셋을 반영한 최종 값을 계산해서 보내는 방식(절대값 patch).
  // 완료 처리 시 실사용량 확정(confirmUsages)을 같은 요청에 실어 보내면 상태 변경과 재고 확정이 함께 일어난다
  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    await this.assertOwnership(userId, projectId);

    if (dto.confirmUsages?.length) {
      await this.prisma.$transaction(
        dto.confirmUsages.map((u) =>
          this.prisma.projectYarnUsage.updateMany({
            where: { projectId, yarnId: u.yarnId },
            data: { usedM: toMeters(u.usedM, u.inputUnit ?? "METRIC") },
          }),
        ),
      );
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: dto.status as any,
        currentRow: dto.currentRow,
        memo: dto.memo,
        photos: dto.photos
          ? { deleteMany: {}, create: dto.photos.map((p) => ({ url: p.url, publicId: p.publicId })) }
          : undefined,
      },
      include: PROJECT_INCLUDE,
    });
  }

  // 소유자 검증 후 삭제 (사진·실 사용량은 onDelete: Cascade라 자동 정리 - 사용량이 사라지면서 재고도 자동 복구됨)
  async remove(userId: string, projectId: string) {
    await this.assertOwnership(userId, projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }

  // 프로젝트에 실 연결. 예약량을 안 보내면 첫 실은 도안의 requiredMinM(가장 작은 사이즈 기준 필요량)을 기본값으로 쓰고,
  // 두 번째 실부터는 0으로 둔다 - 배색처럼 실을 나눠 쓰는 경우 전부 requiredMinM으로 잡으면 재고가 과하게 묶임
  async addYarn(userId: string, projectId: string, dto: CreateProjectYarnDto) {
    const project = await this.assertOwnership(userId, projectId);
    await this.assertYarnOwnership(userId, dto.yarnId);

    const existing = await this.prisma.projectYarnUsage.findUnique({
      where: { projectId_yarnId: { projectId, yarnId: dto.yarnId } },
    });
    if (existing) return existing;

    const reservedM = await this.resolveDefaultReserved(project.patternId, projectId, dto);
    return this.prisma.projectYarnUsage.create({
      data: { projectId, yarnId: dto.yarnId, reservedM },
    });
  }

  // 예약량 조정 / 완료 시 실사용량 확정
  async updateYarn(userId: string, projectId: string, yarnId: string, dto: UpdateProjectYarnDto) {
    await this.assertOwnership(userId, projectId);
    const usage = await this.prisma.projectYarnUsage.findUnique({
      where: { projectId_yarnId: { projectId, yarnId } },
    });
    if (!usage) throw new NotFoundException("연결된 실을 찾을 수 없어요");

    const unit = dto.inputUnit ?? "METRIC";
    return this.prisma.projectYarnUsage.update({
      where: { id: usage.id },
      data: {
        reservedM: dto.reservedM !== undefined ? toMeters(dto.reservedM, unit) : undefined,
        usedM: dto.usedM !== undefined ? toMeters(dto.usedM, unit) : undefined,
      },
    });
  }

  // 연결 해제 - 사용량 기록이 사라지므로 그만큼 재고가 즉시 돌아온다
  async removeYarn(userId: string, projectId: string, yarnId: string) {
    await this.assertOwnership(userId, projectId);
    const deleted = await this.prisma.projectYarnUsage.deleteMany({ where: { projectId, yarnId } });
    if (deleted.count === 0) throw new NotFoundException("연결된 실을 찾을 수 없어요");
    return { success: true };
  }

  private async resolveDefaultReserved(patternId: string, projectId: string, dto: CreateProjectYarnDto) {
    if (dto.reservedM !== undefined) return toMeters(dto.reservedM, dto.inputUnit ?? "METRIC");

    const alreadyLinked = await this.prisma.projectYarnUsage.count({ where: { projectId } });
    if (alreadyLinked > 0) return 0;

    const pattern = await this.prisma.pattern.findUnique({ where: { id: patternId } });
    return pattern?.requiredMinM ?? 0;
  }

  private async assertOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException("프로젝트를 찾을 수 없어요");
    return project;
  }

  // 남의 실 id를 넣어 재고를 묶어버리는 걸 막기 위해 실도 소유자 검증 (실은 완전한 개인 데이터, 기획서 2.9)
  private async assertYarnOwnership(userId: string, yarnId: string) {
    const yarn = await this.prisma.yarn.findFirst({ where: { id: yarnId, userId } });
    if (!yarn) throw new NotFoundException("실을 찾을 수 없어요");
    return yarn;
  }
}
