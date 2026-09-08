import type { CraftType, GaugeChip, ProjectStatus, WeightCategory, YardageLabel } from "../types/api";

type T = (key: string) => string;

// Record<Enum, string>으로 선언해두면 types/api.ts에 새 enum 값이 추가될 때 여기서도 컴파일 에러가 나서
// 번역 키 매핑 누락을 빌드 타임에 잡을 수 있다 (템플릿 문자열 보간만 쓰면 이 체크가 사라짐)
const WEIGHT_CATEGORY_KEYS: Record<WeightCategory, string> = {
  LACE: "enums:weightCategory.LACE",
  FINGERING: "enums:weightCategory.FINGERING",
  SPORT: "enums:weightCategory.SPORT",
  DK: "enums:weightCategory.DK",
  WORSTED: "enums:weightCategory.WORSTED",
  ARAN: "enums:weightCategory.ARAN",
  BULKY: "enums:weightCategory.BULKY",
  SUPER_BULKY: "enums:weightCategory.SUPER_BULKY",
};

const CRAFT_TYPE_KEYS: Record<CraftType, string> = {
  KNITTING: "enums:craftType.KNITTING",
  CROCHET: "enums:craftType.CROCHET",
  BOTH: "enums:craftType.BOTH",
};

const PROJECT_STATUS_KEYS: Record<ProjectStatus, string> = {
  IN_PROGRESS: "enums:projectStatus.IN_PROGRESS",
  COMPLETED: "enums:projectStatus.COMPLETED",
  ON_HOLD: "enums:projectStatus.ON_HOLD",
};

const YARDAGE_KEYS: Record<YardageLabel, string> = {
  AMPLE: "enums:yardage.AMPLE",
  SUFFICIENT: "enums:yardage.SUFFICIENT",
  TIGHT: "enums:yardage.TIGHT",
  INSUFFICIENT: "enums:yardage.INSUFFICIENT",
};

const GAUGE_CHIP_KEYS: Record<Exclude<GaugeChip, null>, string> = {
  MATCH: "enums:gaugeChip.MATCH",
  DIFFERENT: "enums:gaugeChip.DIFFERENT",
};

export function weightCategoryLabel(t: T, category: WeightCategory): string {
  return t(WEIGHT_CATEGORY_KEYS[category]);
}

export function weightCategoryUnspecifiedLabel(t: T): string {
  return t("enums:weightCategory.unspecified");
}

export function weightCategoryUnenteredLabel(t: T): string {
  return t("enums:weightCategory.unentered");
}

export function craftTypeLabel(t: T, craftType: CraftType): string {
  return t(CRAFT_TYPE_KEYS[craftType]);
}

export function projectStatusLabel(t: T, status: ProjectStatus): string {
  return t(PROJECT_STATUS_KEYS[status]);
}

export function yardageLabel(t: T, label: YardageLabel): string {
  return t(YARDAGE_KEYS[label]);
}

export function gaugeChipLabel(t: T, chip: Exclude<GaugeChip, null>): string {
  return t(GAUGE_CHIP_KEYS[chip]);
}
