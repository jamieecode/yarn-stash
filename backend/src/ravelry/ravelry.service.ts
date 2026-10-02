import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
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

// Ravelry가 응답 없이 매달리면 검색 화면 전체가 같이 멈추므로 상한을 둔다
const REQUEST_TIMEOUT_MS = 8000;

// Ravelry 호출 자체가 실패한 경우(인증/한도/5xx/네트워크/타임아웃). "결과 없음"과 구분하기 위해 던진다.
// 상세 조회 엔드포인트에서는 그대로 503으로 나가고, 검색은 호출부에서 잡아 로컬 결과 + ravelryUnavailable 플래그로 응답한다
export class RavelryUnavailableError extends ServiceUnavailableException {
  constructor() {
    super("Ravelry에 일시적으로 연결할 수 없어요. 잠시 후 다시 시도해 주세요");
  }
}

@Injectable()
export class RavelryService implements OnModuleInit {
  private readonly logger = new Logger(RavelryService.name);

  constructor(private readonly config: ConfigService) {}

  // 키가 비어 있으면 모든 Ravelry 호출이 조용히 건너뛰어지므로, 배포 환경변수 누락을 기동 시점에 한 번 알린다
  onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn("RAVELRY_API_KEY/RAVELRY_API_SECRET이 설정되지 않아 Ravelry 검색 폴백이 비활성화됩니다");
    }
  }

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

  // 404(삭제/비공개 항목)만 null로 돌려주고, 나머지 실패는 원인별로 로그를 남긴 뒤 RavelryUnavailableError를 던진다.
  // 크리덴셜 만료/장애가 "결과 없음"으로 묻히지 않게 하려는 것 - 서비스 전체를 막지 않는 건 호출부(검색 폴백)가 책임진다
  private async get(path: string): Promise<unknown | null> {
    const key = this.config.get<string>("RAVELRY_API_KEY") ?? "";
    const secret = this.config.get<string>("RAVELRY_API_SECRET") ?? "";
    const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
    // 검색어는 사용자 입력이라 로그에는 경로만 남긴다
    const endpoint = path.split("?")[0];

    let res: Response;
    try {
      res = await fetch(`${RAVELRY_BASE_URL}${path}`, {
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const reason = err instanceof Error && err.name === "TimeoutError" ? `${REQUEST_TIMEOUT_MS}ms 타임아웃` : String(err);
      this.logger.warn(`Ravelry 요청 실패 (${endpoint}): ${reason}`);
      throw new RavelryUnavailableError();
    }

    // 상세 조회에서 삭제/비공개된 항목은 정상적으로 일어나는 일이라 로그 없이 "없음"으로 처리
    if (res.status === 404) return null;
    if (!res.ok) {
      this.logFailedResponse(endpoint, res.status);
      throw new RavelryUnavailableError();
    }
    try {
      return await res.json();
    } catch {
      this.logger.warn(`Ravelry 응답 파싱 실패 (${endpoint})`);
      throw new RavelryUnavailableError();
    }
  }

  private logFailedResponse(endpoint: string, status: number) {
    if (status === 401 || status === 403) {
      this.logger.error(`Ravelry 인증 실패 ${status} (${endpoint}) - RAVELRY_API_KEY/SECRET 만료 또는 권한 확인 필요`);
    } else if (status === 429) {
      this.logger.warn(`Ravelry 요청 한도 초과 429 (${endpoint})`);
    } else {
      this.logger.warn(`Ravelry 응답 오류 ${status} (${endpoint})`);
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
