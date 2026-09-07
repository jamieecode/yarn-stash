import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toMeters } from "../common/units.util";
import {
  availableMeters,
  committedMeters,
  gaugeChip,
  needsLotMixing,
  scaleBatchesToAvailable,
  totalMeters,
  yardageLabel,
  yardageRatioPercent,
} from "../common/matching.util";
import { RavelryService } from "../ravelry/ravelry.service";
import { CreatePatternDto } from "./dto/create-pattern.dto";
import { UpdatePatternDto } from "./dto/update-pattern.dto";

@Injectable()
export class PatternService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ravelry: RavelryService,
  ) {}

  // 화면설계서 4번(도안 목록) - 게스트도 조회 가능
  async findAll(params: { craftType?: string; weightCategory?: string; bookmarkedBy?: string }) {
    return this.prisma.pattern.findMany({
      where: {
        craftType: params.craftType as any,
        weightCategory: params.weightCategory as any,
        ...(params.bookmarkedBy && { bookmarks: { some: { userId: params.bookmarkedBy } } }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // 화면설계서 5번 - 로컬 우선 + Ravelry 병합 검색 (결과가 적을 때만 Ravelry 폴백 호출)
  async search(query: string) {
    if (!query?.trim()) return [];

    const local = await this.prisma.pattern.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { designer: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    });
    const localResults = local.map((p) => ({ source: "LOCAL" as const, ...p }));
    if (local.length >= 20) return localResults;

    const cachedRavelryIds = new Set(local.map((p) => p.ravelryId).filter((id): id is number => id != null));
    const ravelryResults = (await this.ravelry.searchPatterns(query))
      .filter((r) => !cachedRavelryIds.has(r.ravelryId))
      .map((r) => ({ source: "RAVELRY" as const, ...r }));

    return [...localResults, ...ravelryResults];
  }

  // 화면설계서 5번 - Ravelry 검색 결과 클릭 시 등록 폼 자동 채움용 상세 조회 (DB에 쓰지 않는 순수 조회)
  async getRavelryPatternDetail(ravelryId: number) {
    const detail = await this.ravelry.getPatternDetail(ravelryId);
    if (!detail) throw new NotFoundException("Ravelry에서 해당 도안 정보를 찾을 수 없어요");
    return detail;
  }

  // userId가 있으면 내 찜 여부/메모를 myBookmark로 함께 반환 (화면설계서 6번 하트 상태·내 메모 표시용)
  async findOne(patternId: string, userId?: string) {
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: patternId },
      include: userId ? { bookmarks: { where: { userId } } } : undefined,
    });
    if (!pattern) throw new NotFoundException("도안을 찾을 수 없어요");

    if (userId) {
      const { bookmarks, ...rest } = pattern as typeof pattern & { bookmarks: { memo: string | null }[] };
      return { ...rest, myBookmark: bookmarks[0] ?? null };
    }
    return pattern;
  }

  // 공유 데이터 등록은 게스트 불가 (기획서 2.9 "공유 데이터 쓰기 게이팅")
  // 필요량은 입력 단위와 무관하게 항상 m 기준으로 정규화해서 저장 (기획서 2.5, 실 배치 등록과 동일한 원칙)
  async create(userId: string, provider: string, dto: CreatePatternDto) {
    this.assertNotGuest(provider);
    return this.prisma.pattern.create({
      data: {
        createdByUserId: userId,
        name: dto.name,
        designer: dto.designer,
        craftType: dto.craftType as any,
        weightCategory: dto.weightCategory as any,
        requiredMinM: toMeters(dto.requiredMinM, dto.requiredUnit),
        requiredMaxM: dto.requiredMaxM !== undefined ? toMeters(dto.requiredMaxM, dto.requiredUnit) : undefined,
        requiredUnit: dto.requiredUnit,
        gaugeStitches: dto.gaugeStitches,
        sourceUrl: dto.sourceUrl,
        sourceType: dto.sourceType as any,
        ravelryId: dto.ravelryId,
        originalYarnCatalogId: dto.originalYarnCatalogId,
        originalYarnBrand: dto.originalYarnBrand,
        originalYarnLine: dto.originalYarnLine,
      },
    });
  }

  // 화면설계서 6-1 - 등록한 사람(createdByUserId)만 수정 가능, ravelryId/sourceType은 불변으로 유지
  async update(userId: string, patternId: string, dto: UpdatePatternDto) {
    const pattern = await this.assertOwnership(userId, patternId);
    const unit = dto.requiredUnit ?? pattern.requiredUnit ?? "METRIC";
    return this.prisma.pattern.update({
      where: { id: patternId },
      data: {
        name: dto.name,
        designer: dto.designer,
        craftType: dto.craftType as any,
        weightCategory: dto.weightCategory as any,
        requiredMinM: dto.requiredMinM !== undefined ? toMeters(dto.requiredMinM, unit) : undefined,
        requiredMaxM: dto.requiredMaxM !== undefined ? toMeters(dto.requiredMaxM, unit) : undefined,
        requiredUnit: dto.requiredUnit,
        gaugeStitches: dto.gaugeStitches,
        sourceUrl: dto.sourceUrl,
        originalYarnCatalogId: dto.originalYarnCatalogId,
        originalYarnBrand: dto.originalYarnBrand,
        originalYarnLine: dto.originalYarnLine,
      },
    });
  }

  // 소유자 검증 + 타인 찜 0건 + 연결된 Project 0건(상태 무관) 검증 후 삭제 (기획서 2.7, 설계 메모)
  // Project.patternId는 필수 관계라 onDelete 설정이 없으면 DB 레벨에서도 Restrict로 막히므로,
  // 상태와 무관하게 하나라도 있으면 애초에 삭제 시도 자체를 막는다.
  async remove(userId: string, patternId: string) {
    await this.assertOwnership(userId, patternId);

    const [othersBookmarkCount, projectCount] = await Promise.all([
      this.prisma.patternBookmark.count({ where: { patternId, userId: { not: userId } } }),
      this.prisma.project.count({ where: { patternId } }),
    ]);
    if (othersBookmarkCount > 0) {
      throw new ForbiddenException("다른 분들이 찜한 도안이라 삭제할 수 없어요");
    }
    if (projectCount > 0) {
      throw new ForbiddenException("이 도안으로 진행한 프로젝트가 있어 삭제할 수 없어요");
    }

    await this.prisma.pattern.delete({ where: { id: patternId } });
    return { success: true };
  }

  // 화면설계서 6번(내가 가진 실 중 맞는 것) - 같은 무게 카테고리 + consumed=false, 100% 미만도 숨기지 않고
  // 여유분 비율로 정렬(실→도안 방향과 동일한 4단계 칩 체계, 기획서 2.3/2.6).
  // 실→도안 방향과 마찬가지로 총 보유량이 아니라 가용량 기준 - 다른 프로젝트가 이미 잡아둔 실은 그만큼 빠진다
  async findYarnMatches(userId: string, patternId: string) {
    const pattern = await this.findOne(patternId);
    const yarns = await this.prisma.yarn.findMany({
      where: { userId, weightCategory: pattern.weightCategory, consumed: false },
      include: { batches: true, usages: { include: { project: { select: { status: true } } } } },
    });

    return yarns
      .map((yarn) => {
        const totalM = totalMeters(yarn.batches);
        const committedM = committedMeters(yarn.usages);
        const availableM = availableMeters(yarn.batches, yarn.usages);
        const ratioPercent = yardageRatioPercent(availableM, pattern.requiredMinM);
        return {
          yarn: { ...yarn, totalM, committedM, availableM },
          ratioPercent,
          label: yardageLabel(ratioPercent),
          gaugeChip: gaugeChip(yarn.gaugeStitches, pattern.gaugeStitches),
          needsLotMixing: needsLotMixing(scaleBatchesToAvailable(yarn.batches, availableM), pattern.requiredMinM),
        };
      })
      .sort((a, b) => b.ratioPercent - a.ratioPercent);
  }

  // 화면설계서 4/6 - 찜 추가 (하트 아이콘)
  async addBookmark(userId: string, patternId: string) {
    await this.findOne(patternId);
    return this.prisma.patternBookmark.upsert({
      where: { userId_patternId: { userId, patternId } },
      update: {},
      create: { userId, patternId },
    });
  }

  // 찜 해제 - 기획서 2.4 "찜을 해제하면 메모도 함께 사라짐" (레코드 자체를 삭제하므로 자동 충족)
  async removeBookmark(userId: string, patternId: string) {
    await this.prisma.patternBookmark.deleteMany({ where: { userId, patternId } });
    return { success: true };
  }

  // 화면설계서 6번 "내 메모" - 찜한 상태에서만 의미가 있으므로 북마크가 없으면 실패
  async updateBookmarkMemo(userId: string, patternId: string, memo: string | null) {
    const bookmark = await this.prisma.patternBookmark.findUnique({
      where: { userId_patternId: { userId, patternId } },
    });
    if (!bookmark) throw new NotFoundException("찜한 도안만 메모를 남길 수 있어요");
    return this.prisma.patternBookmark.update({
      where: { userId_patternId: { userId, patternId } },
      data: { memo },
    });
  }

  // 화면설계서 6번 "GET /patterns/:id/bookmark-count?excludeSelf=true" - 삭제 가능 여부 판별용
  async getBookmarkCount(patternId: string, excludeUserId?: string) {
    const count = await this.prisma.patternBookmark.count({
      where: { patternId, ...(excludeUserId && { userId: { not: excludeUserId } }) },
    });
    return { count };
  }

  // 화면설계서 6번 - 삭제 버튼 활성화 여부를 미리 확인 (remove()와 동일한 조건을 재사용, 삭제는 실행하지 않음)
  // Project는 개인 데이터라 "다른 유저의 프로젝트 목록"을 그대로 노출하지 않고 boolean+사유만 반환
  async getDeleteEligibility(userId: string, patternId: string) {
    const pattern = await this.findOne(patternId);
    if (pattern.createdByUserId !== userId) {
      return { canDelete: false, reason: "NOT_OWNER" as const };
    }
    const [othersBookmarkCount, projectCount] = await Promise.all([
      this.prisma.patternBookmark.count({ where: { patternId, userId: { not: userId } } }),
      this.prisma.project.count({ where: { patternId } }),
    ]);
    if (othersBookmarkCount > 0) return { canDelete: false, reason: "BOOKMARKED_BY_OTHERS" as const };
    if (projectCount > 0) return { canDelete: false, reason: "HAS_PROJECT" as const };
    return { canDelete: true as const };
  }

  private async assertOwnership(userId: string, patternId: string) {
    const pattern = await this.findOne(patternId);
    if (pattern.createdByUserId !== userId) {
      throw new ForbiddenException("등록한 사람만 수정·삭제할 수 있어요");
    }
    return pattern;
  }

  private assertNotGuest(provider: string) {
    if (provider === "GUEST") {
      throw new ForbiddenException("도안 등록/수정은 로그인 후 이용할 수 있어요");
    }
  }
}
