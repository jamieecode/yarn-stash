import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { availableMeters, committedMeters, totalMeters } from "../common/matching.util";

// 홈 화면 집계. 개인용 앱이라 한 사용자의 데이터 규모가 작으므로 실/프로젝트를 한 번씩 읽어
// 메모리에서 계산한다 (재고는 배치와 사용량을 함께 봐야 나오는 값이라 SQL 집계로는 한 번에 안 떨어짐)
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [yarns, projectCounts, bookmarkCount] = await Promise.all([
      this.prisma.yarn.findMany({
        where: { userId, consumed: false },
        include: { batches: true, usages: { include: { project: { select: { status: true } } } } },
      }),
      this.prisma.project.groupBy({ by: ["status"], where: { userId }, _count: true }),
      this.prisma.patternBookmark.count({ where: { userId } }),
    ]);

    const stocks = yarns.map((yarn) => ({
      yarn,
      totalM: totalMeters(yarn.batches),
      committedM: committedMeters(yarn.usages),
      availableM: availableMeters(yarn.batches, yarn.usages),
      totalG: yarn.batches.reduce((sum, b) => sum + b.skeinCount * b.weightPerSkeinG, 0),
      skeins: yarn.batches.reduce((sum, b) => sum + b.skeinCount, 0),
    }));

    return {
      stash: {
        yarnCount: stocks.length,
        skeinCount: round(stocks.reduce((s, x) => s + x.skeins, 0)),
        totalM: round(stocks.reduce((s, x) => s + x.totalM, 0)),
        committedM: round(stocks.reduce((s, x) => s + x.committedM, 0)),
        availableM: round(stocks.reduce((s, x) => s + x.availableM, 0)),
        totalG: round(stocks.reduce((s, x) => s + x.totalG, 0)),
      },
      weightDistribution: this.buildWeightDistribution(stocks),
      projects: {
        IN_PROGRESS: countOf(projectCounts, "IN_PROGRESS"),
        COMPLETED: countOf(projectCounts, "COMPLETED"),
        ON_HOLD: countOf(projectCounts, "ON_HOLD"),
      },
      bookmarkCount,
      readyToKnit: await this.findReadyToKnit(stocks),
    };
  }

  // 무게 카테고리별 보유 분포. 카테고리를 안 정한 실은 매칭 대상이 아니지만 재고에는 분명히 있으므로
  // null 그룹으로 따로 보여준다 ("등록은 했는데 왜 아무 도안도 안 뜨지"의 답이 되는 자리)
  private buildWeightDistribution(stocks: StockRow[]) {
    const groups = new Map<string, { weightCategory: string | null; yarnCount: number; totalM: number; availableM: number }>();

    for (const stock of stocks) {
      const key = stock.yarn.weightCategory ?? "__NONE__";
      const group = groups.get(key) ?? {
        weightCategory: stock.yarn.weightCategory,
        yarnCount: 0,
        totalM: 0,
        availableM: 0,
      };
      group.yarnCount += 1;
      group.totalM += stock.totalM;
      group.availableM += stock.availableM;
      groups.set(key, group);
    }

    return [...groups.values()]
      .map((g) => ({ ...g, totalM: round(g.totalM), availableM: round(g.availableM) }))
      .sort((a, b) => b.totalM - a.totalM);
  }

  // "지금 바로 뜰 수 있는 도안" - 무게 카테고리가 맞고, 그 카테고리에서 가장 여유 있는 실 하나만으로
  // 필요량이 커버되는 도안. 실을 합쳐 쓰는 경우는 세지 않는다 (로트가 다르면 실제로 못 뜨는 경우가 많음)
  private async findReadyToKnit(stocks: StockRow[]) {
    const bestByCategory = new Map<string, StockRow>();
    for (const stock of stocks) {
      const category = stock.yarn.weightCategory;
      if (!category) continue;
      const current = bestByCategory.get(category);
      if (!current || stock.availableM > current.availableM) bestByCategory.set(category, stock);
    }

    if (bestByCategory.size === 0) return { count: 0, samples: [] };

    const patterns = await this.prisma.pattern.findMany({
      where: { weightCategory: { in: [...bestByCategory.keys()] as any } },
    });

    const matched = patterns
      .map((pattern) => ({ pattern, stock: bestByCategory.get(pattern.weightCategory)! }))
      .filter(({ pattern, stock }) => stock.availableM >= pattern.requiredMinM)
      // 여유가 많은 순 - 홈에서는 "가장 편하게 시작할 수 있는 것"부터 보여주는 게 유용함
      .sort((a, b) => b.stock.availableM / b.pattern.requiredMinM - a.stock.availableM / a.pattern.requiredMinM);

    return {
      count: matched.length,
      samples: matched.slice(0, 3).map(({ pattern, stock }) => ({
        id: pattern.id,
        name: pattern.name,
        designer: pattern.designer,
        thumbnailUrl: pattern.thumbnailUrl,
        craftType: pattern.craftType,
        weightCategory: pattern.weightCategory,
        requiredMinM: pattern.requiredMinM,
        yarn: {
          id: stock.yarn.id,
          brand: stock.yarn.brand,
          lineName: stock.yarn.lineName,
          availableM: round(stock.availableM),
        },
      })),
    };
  }
}

interface StockRow {
  yarn: { id: string; brand: string; lineName: string | null; weightCategory: string | null };
  totalM: number;
  committedM: number;
  availableM: number;
  totalG: number;
  skeins: number;
}

// 배치 길이가 소수점을 갖는 경우(야드 → m 변환) 합계에 부동소수 꼬리가 붙어서 정리
function round(value: number) {
  return Math.round(value * 10) / 10;
}

function countOf(groups: { status: string; _count: number }[], status: string) {
  return groups.find((g) => g.status === status)?._count ?? 0;
}
