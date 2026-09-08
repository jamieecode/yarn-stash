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

export const CRAFT_TYPE_ORDER: CraftType[] = ["KNITTING", "CROCHET", "BOTH"];

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
  // 백엔드가 계산해서 내려주는 재고 3종 (m 기준). 배치를 직접 깎지 않으므로 totalM은 늘 "산 만큼"이고,
  // 다른 도안에 실제로 쓸 수 있는 양은 availableM - 매칭도 이 값을 기준으로 계산된다
  totalM: number;
  committedM: number;
  availableM: number;
  // 어떤 프로젝트가 이 실을 잡고 있는지 (GET /yarns, /yarns/:id에 포함)
  usages: YarnUsageRef[];
}

// 실 쪽에서 본 사용 기록 - 프로젝트 쪽 ProjectYarnUsage와 같은 레코드지만, 여기선 어느 프로젝트인지만 필요하다
export interface YarnUsageRef {
  id: string;
  projectId: string;
  reservedM: number;
  usedM: number | null;
  project: { id: string; status: ProjectStatus; pattern: { name: string } };
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

// 프로젝트가 잡고 있는 실. reservedM은 예약(예상 사용)량, usedM은 완료 시 확정한 실사용량(확정 전엔 null).
// 이만큼이 실 재고의 availableM에서 빠지고, 연결을 해제하거나 프로젝트를 지우면 그대로 돌아온다
export interface ProjectYarnUsage {
  id: string;
  projectId: string;
  yarnId: string;
  reservedM: number;
  usedM: number | null;
  createdAt: string;
  updatedAt: string;
  yarn: Yarn;
}

export interface Project {
  id: string;
  userId: string;
  patternId: string;
  status: ProjectStatus;
  currentRow: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  // GET /projects, /projects/:id, PATCH /projects/:id 응답에 포함 (목록 카드·상세에 도안명/연결된 실 표시용)
  pattern: Pattern;
  yarnUsages: ProjectYarnUsage[];
  photos: ProjectPhoto[];
}

export type YardageLabel = "AMPLE" | "SUFFICIENT" | "TIGHT" | "INSUFFICIENT";
export type GaugeChip = "MATCH" | "DIFFERENT" | null;

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

// GET /dashboard - 홈 화면 집계. 길이는 전부 m 기준(백엔드에서 정규화된 값)
export interface DashboardSummary {
  stash: {
    yarnCount: number;
    skeinCount: number;
    totalM: number;
    committedM: number;
    availableM: number;
    totalG: number;
  };
  // 보유량 많은 순으로 정렬되어 옴. weightCategory가 null인 그룹은 "미분류" 실
  weightDistribution: {
    weightCategory: WeightCategory | null;
    yarnCount: number;
    totalM: number;
    availableM: number;
  }[];
  projects: Record<ProjectStatus, number>;
  bookmarkCount: number;
  // 실 하나의 가용량만으로 필요량이 커버되는 도안
  readyToKnit: {
    count: number;
    samples: {
      id: string;
      name: string;
      designer: string | null;
      thumbnailUrl: string | null;
      craftType: CraftType;
      weightCategory: WeightCategory;
      requiredMinM: number;
      yarn: { id: string; brand: string; lineName: string | null; availableM: number };
    }[];
  };
}

export interface UpdateProjectInput {
  status?: ProjectStatus;
  currentRow?: number;
  memo?: string;
  photos?: PhotoInput[];
  // 완료 처리와 실사용량 확정을 한 요청으로 묶기 위한 항목 (완료 모달에서 함께 전송)
  confirmUsages?: { yarnId: string; usedM: number; inputUnit?: UnitSystem }[];
}

export interface AddProjectYarnInput {
  yarnId: string;
  reservedM?: number;
  inputUnit?: UnitSystem;
}

export interface UpdateProjectYarnInput {
  reservedM?: number;
  usedM?: number;
  inputUnit?: UnitSystem;
}
