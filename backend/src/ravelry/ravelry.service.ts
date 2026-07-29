import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WeightCategory } from "@prisma/client";
import { YD_TO_M } from "../common/units.util";

// Ravelry 공식 API 문서(https://www.ravelry.com/api, 개발자 로그인 필요)는 자격증명이 아직 없어
// 이번 세션에서 라이브 호출로 재검증하지 못했다. 아래 엔드포인트/필드명은 Ravelry가 오랫동안 유지해온
// 공개 REST 스펙으로, 여러 독립적인 커뮤니티 라이브러리(R ravelRy, Ruby gem 등)가 공통으로 참조하는 값이다.
// RAVELRY_API_KEY/SECRET이 채워지는 대로 실제 응답으로 필드명을 한 번 더 대조할 것.
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
      yarns?: Array<{ id: number; name: string; yarn_company_name: string; photos?: Array<{ small_url?: string }> }>;
    };
    return (data.yarns ?? []).map((y) => ({
      ravelryId: y.id,
      brand: y.yarn_company_name,
      lineName: y.name,
      thumbnailUrl: y.photos?.[0]?.small_url,
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
        yarn_company_name: string;
        fiber_content_description?: string;
        yarn_weight?: { name?: string };
        photos?: Array<{ small_url?: string }>;
      };
    };
    const y = data.yarn;
    if (!y) return null;

    return {
      ravelryId: y.id,
      brand: y.yarn_company_name,
      lineName: y.name,
      fiber: y.fiber_content_description,
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
      patterns?: Array<{ id: number; name: string; designer?: { name?: string }; photos?: Array<{ small_url?: string }> }>;
    };
    return (data.patterns ?? []).map((p) => ({
      ravelryId: p.id,
      name: p.name,
      designer: p.designer?.name,
      thumbnailUrl: p.photos?.[0]?.small_url,
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
        designer?: { name?: string };
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
      designer: p.designer?.name,
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
