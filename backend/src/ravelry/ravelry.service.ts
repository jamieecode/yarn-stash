import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WeightCategory } from "@prisma/client";
import { YD_TO_M } from "../common/units.util";

// read-only Basic Auth 크리덴셜로 라이브 응답을 검증 완료 (2026-08-04).
// 검색(search) 응답과 상세(detail) 응답은 썸네일 필드 모양이 다르다: 검색은 first_photo(단일 객체),
// 상세는 photos(배열)를 준다. 브랜드명/fiber/디자이너명도 검색과 상세에서 위치가 다르므로 섞어 쓰지 말 것.
const RAVELRY_BASE_URL = "https://api.ravelry.com";

// Ravelry yarn_weight.name -> 우리 WeightCategory enum 매핑.
// "Light Fingering"은 Fingering으로 합치고, 대응 카테고리가 없는 "Jumbo"는 SUPER_BULKY로 근사 - 실제 데이터로 검증 필요
const RAVELRY_WEIGHT_MAP: Record<string, WeightCategory> = {
  Lace: WeightCategory.LACE,
  "Light Fingering": WeightCategory.FINGERING,
  Fingering: WeightCategory.FINGERING,
  Sport: WeightCategory.SPORT,
  DK: WeightCategory.DK,
  Worsted: WeightCategory.WORSTED,
  Aran: WeightCategory.ARAN,
  Bulky: WeightCategory.BULKY,
  "Super Bulky": WeightCategory.SUPER_BULKY,
  Jumbo: WeightCategory.SUPER_BULKY,
};

export interface RavelrySearchYarn {
  ravelryId: number;
  brand: string;
  lineName: string;
  thumbnailUrl?: string;
}

export interface RavelryYarnDetail extends RavelrySearchYarn {
  fiber?: string;
  weightCategory?: WeightCategory;
}

export interface RavelrySearchPattern {
  ravelryId: number;
  name: string;
  designer?: string;
  thumbnailUrl?: string;
}

export interface RavelryPatternDetail extends RavelrySearchPattern {
  craftType?: "KNITTING" | "CROCHET" | "BOTH";
  weightCategory?: WeightCategory;
  requiredMinM?: number;
  requiredMaxM?: number;
  gaugeStitches?: number;
  sourceUrl?: string;
}

@Injectable()
export class RavelryService {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>("RAVELRY_API_KEY") && this.config.get<string>("RAVELRY_API_SECRET"));
  }

  // 실 검색 폴백 (화면설계서 2번) - 로컬 DB가 부족할 때만 호출
  async searchYarns(query: string): Promise<RavelrySearchYarn[]> {
    if (!this.isConfigured() || !query?.trim()) return [];

    const res = await this.get(`/yarns/search.json?query=${encodeURIComponent(query)}`);
    if (!res) return [];

    const data = res as {
      yarns?: Array<{
        id: number;
        name: string;
        yarn_company_name: string;
        first_photo?: { small_url?: string };
      }>;
    };
    return (data.yarns ?? []).map((y) => ({
      ravelryId: y.id,
      brand: y.yarn_company_name,
      lineName: y.name,
      thumbnailUrl: y.first_photo?.small_url,
    }));
  }

  // 검색 결과 중 사용자가 실제로 선택한 항목만 상세 조회 - 검색 결과 자체는 캐싱하지 않음 (기획서 원칙)
  async getYarnDetail(ravelryId: number): Promise<RavelryYarnDetail | null> {
    if (!this.isConfigured()) return null;

    const res = await this.get(`/yarns/${ravelryId}.json`);
    if (!res) return null;

    const data = res as {
      yarn?: {
        id: number;
        name: string;
        yarn_company?: { name?: string };
        yarn_fibers?: Array<{ percentage?: number; fiber_type?: { name?: string } }>;
        yarn_weight?: { name?: string };
        photos?: Array<{ small_url?: string }>;
      };
    };
    const y = data.yarn;
    if (!y) return null;

    return {
      ravelryId: y.id,
      brand: y.yarn_company?.name ?? "",
      lineName: y.name,
      fiber: formatFiberDescription(y.yarn_fibers),
      weightCategory: y.yarn_weight?.name ? RAVELRY_WEIGHT_MAP[y.yarn_weight.name] : undefined,
      thumbnailUrl: y.photos?.[0]?.small_url,
    };
  }

  // 도안 검색 폴백 (화면설계서 5번)
  async searchPatterns(query: string): Promise<RavelrySearchPattern[]> {
    if (!this.isConfigured() || !query?.trim()) return [];

    const res = await this.get(`/patterns/search.json?query=${encodeURIComponent(query)}`);
    if (!res) return [];

    const data = res as {
      patterns?: Array<{
        id: number;
        name: string;
        designer?: { name?: string };
        first_photo?: { small_url?: string };
      }>;
    };
    return (data.patterns ?? []).map((p) => ({
      ravelryId: p.id,
      name: p.name,
      designer: p.designer?.name,
      thumbnailUrl: p.first_photo?.small_url,
    }));
  }

  // 등록 폼 자동 채움용 상세 조회 (화면설계서 5번) - yardage는 yd 단위로 오므로 m로 정규화
  async getPatternDetail(ravelryId: number): Promise<RavelryPatternDetail | null> {
    if (!this.isConfigured()) return null;

    const res = await this.get(`/patterns/${ravelryId}.json`);
    if (!res) return null;

    const data = res as {
      pattern?: {
        id: number;
        name: string;
        pattern_author?: { name?: string };
        craft?: { name?: string };
        yardage?: number;
        yardage_max?: number;
        yarn_weight?: { name?: string };
        gauge?: number;
        permalink?: string;
        photos?: Array<{ small_url?: string }>;
      };
    };
    const p = data.pattern;
    if (!p) return null;

    return {
      ravelryId: p.id,
      name: p.name,
      designer: p.pattern_author?.name,
      craftType: mapCraftType(p.craft?.name),
      weightCategory: p.yarn_weight?.name ? RAVELRY_WEIGHT_MAP[p.yarn_weight.name] : undefined,
      requiredMinM: p.yardage != null ? +(p.yardage * YD_TO_M).toFixed(1) : undefined,
      requiredMaxM: p.yardage_max != null ? +(p.yardage_max * YD_TO_M).toFixed(1) : undefined,
      gaugeStitches: p.gauge,
      sourceUrl: p.permalink ? `https://www.ravelry.com/patterns/library/${p.permalink}` : undefined,
      thumbnailUrl: p.photos?.[0]?.small_url,
    };
  }

  private async get(path: string): Promise<unknown | null> {
    const key = this.config.get<string>("RAVELRY_API_KEY") ?? "";
    const secret = this.config.get<string>("RAVELRY_API_SECRET") ?? "";
    const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");

    try {
      const res = await fetch(`${RAVELRY_BASE_URL}${path}`, { headers: { Authorization: auth } });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      // Ravelry 장애/네트워크 오류가 우리 서비스 전체를 막으면 안 됨 - 폴백 실패로 취급
      return null;
    }
  }
}

function mapCraftType(name?: string): "KNITTING" | "CROCHET" | "BOTH" | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  if (lower.includes("knit")) return "KNITTING";
  if (lower.includes("crochet")) return "CROCHET";
  return undefined;
}

// Ravelry는 fiber_content_description 같은 완성 문자열을 안 주고 yarn_fibers 배열(비율+섬유명)로만 준다.
// "100% Merino" 형태로 직접 조합한다.
function formatFiberDescription(fibers?: Array<{ percentage?: number; fiber_type?: { name?: string } }>): string | undefined {
  if (!fibers?.length) return undefined;
  const parts = fibers
    .filter((f) => f.fiber_type?.name)
    .map((f) => (f.percentage != null ? `${f.percentage}% ${f.fiber_type!.name}` : f.fiber_type!.name!));
  return parts.length ? parts.join(", ") : undefined;
}
