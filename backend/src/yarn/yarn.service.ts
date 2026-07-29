import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toGrams, toMeters } from "../common/units.util";
import { gaugeChip, needsLotMixing, totalMeters, yardageLabel, yardageRatioPercent } from "../common/matching.util";
import { CreateYarnDto, CreateBatchDto } from "./dto/create-yarn.dto";
import { UpdateYarnDto } from "./dto/update-yarn.dto";
import { UpdateBatchDto } from "./dto/update-batch.dto";

@Injectable()
export class YarnService {
  constructor(private readonly prisma: PrismaService) {}

  // 화면설계서 1번(실 목록) - 검색/무게필터/정렬/소진됨 토글 반영
  async findAll(
    userId: string,
    params: { q?: string; weightCategory?: string; sort?: string; includeConsumed?: boolean },
  ) {
    return this.prisma.yarn.findMany({
      where: {
        userId,
        consumed: params.includeConsumed ? undefined : false,
        weightCategory: params.weightCategory as any,
        ...(params.q && {
          OR: [
            { brand: { contains: params.q, mode: "insensitive" } },
            { lineName: { contains: params.q, mode: "insensitive" } },
            { colorName: { contains: params.q, mode: "insensitive" } },
          ],
        }),
      },
      include: { batches: true, photos: true },
      orderBy: params.sort === "NAME" ? { brand: "asc" } : { createdAt: "desc" },
    });
  }

  async findOne(userId: string, yarnId: string) {
    const yarn = await this.prisma.yarn.findFirst({
      where: { id: yarnId, userId },
      include: { batches: true, photos: true },
    });
    if (!yarn) throw new NotFoundException("실을 찾을 수 없어요");
    return yarn;
  }

  // 화면설계서 2번(실 등록) - 마스터 정보 + 최초 배치 1개 이상을 한 번에 생성.
  // 단위는 사용자가 입력한 대로 받되, g·m 기준으로 정규화해서 저장 (기획서 2.1 원칙)
  async create(userId: string, dto: CreateYarnDto) {
    return this.prisma.yarn.create({
      data: {
        userId,
        catalogId: dto.catalogId,
        brand: dto.brand,
        lineName: dto.lineName,
        colorName: dto.colorName,
        fiber: dto.fiber,
        weightCategory: dto.weightCategory as any,
        needleSize: dto.needleSize,
        gaugeStitches: dto.gaugeStitches,
        memo: dto.memo,
        photos: dto.photos?.length
          ? { create: dto.photos.map((p) => ({ url: p.url, publicId: p.publicId })) }
          : undefined,
        batches: { create: dto.batches.map((b) => this.normalizeBatch(b)) },
      },
      include: { batches: true, photos: true },
    });
  }

  // 화면설계서 3-1(실 수정) - 마스터 정보 + consumed 토글 + 사진 목록.
  // 사진은 프론트가 최종적으로 남기고 싶은 목록 전체를 보내는 방식(교체)으로 처리 - 개별 삭제는 그 목록에서 빠진 걸로 표현됨
  async update(userId: string, yarnId: string, dto: UpdateYarnDto) {
    await this.assertOwnership(userId, yarnId);
    return this.prisma.yarn.update({
      where: { id: yarnId },
      data: {
        brand: dto.brand,
        lineName: dto.lineName,
        colorName: dto.colorName,
        fiber: dto.fiber,
        weightCategory: dto.weightCategory as any,
        needleSize: dto.needleSize,
        gaugeStitches: dto.gaugeStitches,
        memo: dto.memo,
        consumed: dto.consumed,
        photos: dto.photos
          ? {
              deleteMany: {},
              create: dto.photos.map((p) => ({ url: p.url, publicId: p.publicId })),
            }
          : undefined,
      },
      include: { batches: true, photos: true },
    });
  }

  // 소유자 검증 후 삭제 - 배치·사진은 onDelete: Cascade로 자동 정리, 연결된 Project는 onDelete: SetNull로 연결만 해제
  async remove(userId: string, yarnId: string) {
    await this.assertOwnership(userId, yarnId);
    await this.prisma.yarn.delete({ where: { id: yarnId } });
    return { success: true };
  }

  // 화면설계서 3번 "+ 배치 추가" - 같은 실을 새로 구매했을 때 기록 추가
  async addBatch(userId: string, yarnId: string, dto: CreateBatchDto) {
    await this.assertOwnership(userId, yarnId);
    return this.prisma.yarnBatch.create({
      data: { yarnId, ...this.normalizeBatch(dto) },
    });
  }

  // 화면설계서 3번 "배치 카드 탭 시 인라인 수정 모드"
  async updateBatch(userId: string, yarnId: string, batchId: string, dto: UpdateBatchDto) {
    await this.assertOwnership(userId, yarnId);
    await this.assertBatchBelongsToYarn(yarnId, batchId);

    const data: Record<string, unknown> = { dyeLot: dto.dyeLot };
    if (dto.purchasedAt !== undefined) data.purchasedAt = new Date(dto.purchasedAt);
    if (dto.skeinCount !== undefined) data.skeinCount = dto.skeinCount;
    if (dto.inputUnit !== undefined) data.inputUnit = dto.inputUnit;
    if (dto.weightPerSkeinG !== undefined) {
      data.weightPerSkeinG = toGrams(dto.weightPerSkeinG, dto.inputUnit ?? "METRIC");
    }
    if (dto.lengthPerSkeinM !== undefined) {
      data.lengthPerSkeinM = toMeters(dto.lengthPerSkeinM, dto.inputUnit ?? "METRIC");
    }

    return this.prisma.yarnBatch.update({ where: { id: batchId }, data });
  }

  // 화면설계서 3번 "별도 삭제 버튼" - 배치별 삭제 (실 자체 삭제와는 별개)
  async removeBatch(userId: string, yarnId: string, batchId: string) {
    await this.assertOwnership(userId, yarnId);
    await this.assertBatchBelongsToYarn(yarnId, batchId);
    await this.prisma.yarnBatch.delete({ where: { id: batchId } });
    return { success: true };
  }

  // 화면설계서 3번(이 실로 뜰 수 있는 도안) - 무게 카테고리 일치 + 여유분 비율 + 게이지/로트 보조 칩
  // 소진 처리된 실은 매칭 자체를 실행하지 않고(기획서 2.3), 무게 카테고리가 없으면 매칭 대상이 아니라 빈 배열
  async findPatternMatches(userId: string, yarnId: string) {
    const yarn = await this.findOne(userId, yarnId);
    if (yarn.consumed || !yarn.weightCategory) return [];

    const patterns = await this.prisma.pattern.findMany({
      where: { weightCategory: yarn.weightCategory },
    });
    const totalM = totalMeters(yarn.batches);

    return patterns
      .map((pattern) => {
        const ratioPercent = yardageRatioPercent(totalM, pattern.requiredMinM);
        return {
          pattern,
          ratioPercent,
          label: yardageLabel(ratioPercent),
          gaugeChip: gaugeChip(yarn.gaugeStitches, pattern.gaugeStitches),
          needsLotMixing: needsLotMixing(yarn.batches, pattern.requiredMinM),
        };
      })
      .sort((a, b) => b.ratioPercent - a.ratioPercent);
  }

  private normalizeBatch(b: CreateBatchDto) {
    return {
      dyeLot: b.dyeLot,
      skeinCount: b.skeinCount,
      inputUnit: b.inputUnit,
      weightPerSkeinG: toGrams(b.weightPerSkeinG, b.inputUnit),
      lengthPerSkeinM: toMeters(b.lengthPerSkeinM, b.inputUnit),
      purchasedAt: b.purchasedAt ? new Date(b.purchasedAt) : undefined,
    };
  }

  private async assertOwnership(userId: string, yarnId: string) {
    const yarn = await this.prisma.yarn.findFirst({ where: { id: yarnId, userId } });
    if (!yarn) throw new NotFoundException("실을 찾을 수 없어요");
    return yarn;
  }

  private async assertBatchBelongsToYarn(yarnId: string, batchId: string) {
    const batch = await this.prisma.yarnBatch.findFirst({ where: { id: batchId, yarnId } });
    if (!batch) throw new NotFoundException("배치를 찾을 수 없어요");
    return batch;
  }
}
