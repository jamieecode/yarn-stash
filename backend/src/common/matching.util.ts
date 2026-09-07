// 실↔도안 양방향 매칭 계산 (기획서 2.3/2.6, 설계 메모) - yarn.service/pattern.service에서 함께 사용

export type YardageLabel = "AMPLE" | "SUFFICIENT" | "TIGHT" | "INSUFFICIENT";

export interface BatchLike {
  dyeLot: string | null;
  skeinCount: number;
  lengthPerSkeinM: number;
}

export function totalMeters(batches: BatchLike[]): number {
  return batches.reduce((sum, b) => sum + b.skeinCount * b.lengthPerSkeinM, 0);
}

// 프로젝트가 잡고 있는 실의 양 (ProjectYarnUsage) - 재고는 배치를 깎지 않고 여기서 빼는 방식으로 계산
export interface UsageLike {
  reservedM: number;
  usedM: number | null;
  project: { status: "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" };
}

// 완료된 프로젝트는 확정 사용량(usedM), 아직 확정 전이면 예약량(reservedM)을 소비로 본다.
// 진행중/보류는 아직 안 썼더라도 실을 잡고 있는 것이므로 똑같이 가용량에서 뺀다 - 보류라고 풀어주면
// "다른 도안에도 충분함"으로 잘못 뜨고, 정작 재개할 때 실이 모자라게 됨
export function committedMeters(usages: UsageLike[]): number {
  return usages.reduce((sum, u) => sum + (u.project.status === "COMPLETED" ? (u.usedM ?? u.reservedM) : u.reservedM), 0);
}

// 실제로 다른 도안에 쓸 수 있는 양. 사용자가 예약량을 실제 보유량보다 크게 넣을 수 있으므로 음수는 0으로 막는다
export function availableMeters(batches: BatchLike[], usages: UsageLike[]): number {
  return Math.max(0, totalMeters(batches) - committedMeters(usages));
}

// 로트 보조 안내를 가용량 기준으로 맞추기 위한 비율 - 소비분을 배치들에서 비례 차감한 가상의 배치 목록을 만든다.
// (어느 로트에서 얼마를 썼는지까지는 기록하지 않기로 했으므로 균등 비례가 최선의 근사)
export function scaleBatchesToAvailable(batches: BatchLike[], availableM: number): BatchLike[] {
  const total = totalMeters(batches);
  if (total <= 0) return batches;
  const ratio = Math.min(1, availableM / total);
  return batches.map((b) => ({ ...b, skeinCount: b.skeinCount * ratio }));
}

// 여유분 비율: requiredMinM(가장 작은 사이즈 기준) 대비 보유량 - "최소한 어떤 사이즈는 뜰 수 있는지"가 목적
export function yardageRatioPercent(totalM: number, requiredMinM: number): number {
  if (requiredMinM <= 0) return 0;
  return (totalM / requiredMinM) * 100;
}

// 130%+ 여유있음 / 110~130% 충분함 / 100~110% 타이트함 / 100% 미만 부족함 - 100% 미만도 숨기지 않음
export function yardageLabel(ratioPercent: number): YardageLabel {
  if (ratioPercent >= 130) return "AMPLE";
  if (ratioPercent >= 110) return "SUFFICIENT";
  if (ratioPercent >= 100) return "TIGHT";
  return "INSUFFICIENT";
}

// 게이지 보조 칩 - 실·도안 둘 다 값이 있을 때만 비교(하드 필터 아님), 허용 오차 ±1콧수
export function gaugeChip(yarnGauge?: number | null, patternGauge?: number | null): "MATCH" | "DIFFERENT" | null {
  if (yarnGauge == null || patternGauge == null) return null;
  return Math.abs(yarnGauge - patternGauge) <= 1 ? "MATCH" : "DIFFERENT";
}

// 로트 보조 안내 - 합계는 충분한데 최대 단일 로트만으로는 부족한 경우 true (dyeLot이 없는 배치는 하나의 그룹으로 합산)
export function needsLotMixing(batches: BatchLike[], requiredMinM: number): boolean {
  const total = totalMeters(batches);
  if (total < requiredMinM) return false;
  if (batches.length === 0) return false;

  const groupTotals = new Map<string, number>();
  for (const b of batches) {
    const key = b.dyeLot ?? "__NO_LOT__";
    groupTotals.set(key, (groupTotals.get(key) ?? 0) + b.skeinCount * b.lengthPerSkeinM);
  }
  const maxLotTotal = Math.max(...groupTotals.values());
  return maxLotTotal < requiredMinM;
}
