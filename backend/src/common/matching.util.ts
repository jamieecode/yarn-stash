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
