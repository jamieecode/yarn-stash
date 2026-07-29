// 백엔드(backend/prisma/schema.prisma, backend/src/**/dto)와 계약을 맞춘 타입 정의

export type WeightCategory =
  | "LACE"
  | "FINGERING"
  | "SPORT"
  | "DK"
  | "WORSTED"
  | "ARAN"
  | "BULKY"
  | "SUPER_BULKY";

export type AuthProvider = "KAKAO" | "GOOGLE" | "GUEST";
export type PatternSource = "RAVELRY" | "LINK" | "USER";
export type CatalogSource = "RAVELRY" | "USER";
export type CraftType = "KNITTING" | "CROCHET" | "BOTH";
export type UnitSystem = "METRIC" | "IMPERIAL";
export type ProjectStatus = "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";

export const WEIGHT_CATEGORY_LABEL: Record<WeightCategory, string> = {
  LACE: "레이스",
  FINGERING: "피어링",
  SPORT: "스포츠",
  DK: "DK",
  WORSTED: "워스티드",
  ARAN: "아란",
  BULKY: "벌키",
  SUPER_BULKY: "슈퍼벌키",
};
export const WEIGHT_CATEGORY_ORDER: WeightCategory[] = [
  "LACE",
  "FINGERING",
  "SPORT",
  "DK",
  "WORSTED",
  "ARAN",
  "BULKY",
  "SUPER_BULKY",
];

export const CRAFT_TYPE_LABEL: Record<CraftType, string> = {
  KNITTING: "대바늘",
  CROCHET: "코바늘",
  BOTH: "대바늘+코바늘",
};
export const CRAFT_TYPE_ORDER: CraftType[] = ["KNITTING", "CROCHET", "BOTH"];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  ON_HOLD: "보류",
};
export const PROJECT_STATUS_ORDER: ProjectStatus[] = ["IN_PROGRESS", "COMPLETED", "ON_HOLD"];

export interface User {
  id: string;
  provider: AuthProvider;
  providerId: string | null;
  nickname: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; provider: AuthProvider };
}

export interface YarnPhoto {
  id: string;
  yarnId: string;
  url: string;
  publicId: string | null;
  createdAt: string;
}

export interface YarnBatch {
  id: string;
  yarnId: string;
  dyeLot: string | null;
  skeinCount: number;
  weightPerSkeinG: number;
  lengthPerSkeinM: number;
  inputUnit: UnitSystem;
  purchasedAt: string | null;
  createdAt: string;
}

export interface Yarn {
  id: string;
  userId: string;
  catalogId: string | null;
  brand: string;
  lineName: string | null;
  colorName: string | null;
  fiber: string | null;
  weightCategory: WeightCategory | null;
  needleSize: string | null;
  gaugeStitches: number | null;
  memo: string | null;
  consumed: boolean;
  createdAt: string;
  batches: YarnBatch[];
  photos: YarnPhoto[];
}

export interface YarnCatalog {
  id: string;
  createdByUserId: string;
  brand: string;
  lineName: string;
  fiber: string | null;
  weightCategory: WeightCategory | null;
  needleSize: string | null;
  gaugeStitches: number | null;
  sourceType: CatalogSource;
  ravelryId: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

// GET /yarn-catalog/search 응답 - 로컬 결과와 Ravelry 폴백 결과가 source 라벨로 구분돼 병합됨
export type YarnCatalogSearchResult =
  | ({ source: "LOCAL" } & YarnCatalog)
  | ({ source: "RAVELRY"; ravelryId: number; brand: string; lineName: string; thumbnailUrl?: string });

export interface Pattern {
  id: string;
  createdByUserId: string;
  name: string;
  designer: string | null;
  craftType: CraftType;
  weightCategory: WeightCategory;
  requiredMinM: number;
  requiredMaxM: number | null;
  requiredUnit: UnitSystem | null;
  gaugeStitches: number | null;
  sourceUrl: string | null;
  sourceType: PatternSource;
  ravelryId: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
  originalYarnCatalogId: string | null;
  originalYarnBrand: string | null;
  originalYarnLine: string | null;
  // GET /patterns/:id 응답에만 포함 - 로그인 상태일 때 내 찜 여부/메모 (화면설계서 6번)
  myBookmark?: { memo: string | null } | null;
}

// GET /patterns/search 응답
export type PatternSearchResult =
  | ({ source: "LOCAL" } & Pattern)
  | ({ source: "RAVELRY"; ravelryId: number; name: string; designer?: string; thumbnailUrl?: string });

// GET /patterns/ravelry/:ravelryId 응답 - 등록 폼 자동 채움용 (requiredMinM/MaxM은 이미 m로 정규화돼 있음)
export interface RavelryPatternDetail {
  ravelryId: number;
  name: string;
  designer?: string;
  craftType?: CraftType;
  weightCategory?: WeightCategory;
  requiredMinM?: number;
  requiredMaxM?: number;
  gaugeStitches?: number;
  sourceUrl?: string;
  thumbnailUrl?: string;
}

export interface PatternBookmark {
  id: string;
  userId: string;
  patternId: string;
  memo: string | null;
  createdAt: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  url: string;
  publicId: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  patternId: string;
  yarnId: string | null;
  status: ProjectStatus;
  currentRow: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  // GET /projects, /projects/:id, PATCH /projects/:id 응답에 포함 (목록 카드·상세에 도안명/연결된 실 표시용)
  pattern: Pattern;
  yarn: Yarn | null;
  photos: ProjectPhoto[];
}

export type YardageLabel = "AMPLE" | "SUFFICIENT" | "TIGHT" | "INSUFFICIENT";
export type GaugeChip = "MATCH" | "DIFFERENT" | null;

export const YARDAGE_LABEL_TEXT: Record<YardageLabel, string> = {
  AMPLE: "여유 있음",
  SUFFICIENT: "충분함",
  TIGHT: "타이트함",
  INSUFFICIENT: "부족함",
};

// GET /yarns/:id/pattern-matches 응답 항목
export interface YarnPatternMatch {
  pattern: Pattern;
  ratioPercent: number;
  label: YardageLabel;
  gaugeChip: GaugeChip;
  needsLotMixing: boolean;
}

// GET /patterns/:id/yarn-matches 응답 항목
export interface PatternYarnMatch {
  yarn: Yarn;
  ratioPercent: number;
  label: YardageLabel;
  gaugeChip: GaugeChip;
  needsLotMixing: boolean;
}

export type DeleteEligibilityReason = "NOT_OWNER" | "BOOKMARKED_BY_OTHERS" | "HAS_PROJECT";
export type DeleteEligibility =
  | { canDelete: true }
  | { canDelete: false; reason: DeleteEligibilityReason };

export interface PhotoInput {
  url: string;
  publicId?: string;
}

export interface BatchInput {
  dyeLot?: string;
  skeinCount: number;
  weightPerSkeinG: number;
  lengthPerSkeinM: number;
  inputUnit: UnitSystem;
  purchasedAt?: string;
}

export interface CreateYarnInput {
  catalogId?: string;
  brand: string;
  lineName?: string;
  colorName?: string;
  fiber?: string;
  weightCategory?: WeightCategory | "";
  needleSize?: string;
  gaugeStitches?: number;
  memo?: string;
  photos?: PhotoInput[];
  batches: BatchInput[];
}

export type UpdateYarnInput = Partial<Omit<CreateYarnInput, "catalogId" | "batches">> & {
  consumed?: boolean;
};

export interface CreatePatternInput {
  name: string;
  designer?: string;
  craftType: CraftType | "";
  weightCategory: WeightCategory | "";
  requiredMinM: number;
  requiredMaxM?: number;
  requiredUnit: UnitSystem;
  gaugeStitches?: number;
  sourceUrl?: string;
  sourceType: PatternSource;
  ravelryId?: number;
  originalYarnCatalogId?: string;
  originalYarnBrand?: string;
  originalYarnLine?: string;
}

export type UpdatePatternInput = Partial<Omit<CreatePatternInput, "sourceType" | "ravelryId">>;

export interface UpdateProjectInput {
  status?: ProjectStatus;
  currentRow?: number;
  memo?: string;
  yarnId?: string;
  photos?: PhotoInput[];
}
