import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CatalogSource } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RavelryService } from "../ravelry/ravelry.service";

@Injectable()
export class YarnCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ravelry: RavelryService,
  ) {}

  // 화면설계서 2번(실 등록) 자동완성 - 우리 DB 우선 조회, 결과가 적으면 Ravelry 검색 결과를 병합(출처 라벨 포함)
  async search(query: string) {
    if (!query?.trim()) return [];

    const local = await this.prisma.yarnCatalog.findMany({
      where: {
        OR: [
          { brand: { contains: query, mode: "insensitive" } },
          { lineName: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    });
    const localResults = local.map((c) => ({ source: "LOCAL" as const, ...c }));
    if (local.length >= 20) return localResults;

    const cachedRavelryIds = new Set(local.map((c) => c.ravelryId).filter((id): id is number => id != null));
    const ravelryResults = (await this.ravelry.searchYarns(query))
      .filter((r) => !cachedRavelryIds.has(r.ravelryId))
      .map((r) => ({ source: "RAVELRY" as const, ...r }));

    return [...localResults, ...ravelryResults];
  }

  // 검색 결과 중 사용자가 실제로 클릭한 Ravelry 항목만 최소 메타데이터로 캐싱 (기획서 2.1/2.9)
  // 이미 로컬에 캐싱돼 있으면(다른 사람이 먼저 골랐어도) 그대로 반환 - 게스트도 조회는 가능
  // 아직 캐싱된 적 없는 새 항목을 처음 캐싱(=공유 데이터 신규 등록)하는 건 게스트 불가
  async resolveRavelryYarn(userId: string, provider: string, ravelryId: number) {
    const existing = await this.prisma.yarnCatalog.findUnique({ where: { ravelryId } });
    if (existing) return existing;

    if (provider === "GUEST") {
      throw new ForbiddenException("아직 등록되지 않은 실이에요. 로그인 후 추가할 수 있어요");
    }

    const detail = await this.ravelry.getYarnDetail(ravelryId);
    if (!detail) throw new NotFoundException("Ravelry에서 해당 실 정보를 찾을 수 없어요");

    return this.prisma.yarnCatalog.create({
      data: {
        createdByUserId: userId,
        brand: detail.brand,
        lineName: detail.lineName,
        fiber: detail.fiber,
        weightCategory: detail.weightCategory,
        thumbnailUrl: detail.thumbnailUrl,
        sourceType: CatalogSource.RAVELRY,
        ravelryId,
      },
    });
  }
}
