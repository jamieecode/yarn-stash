// 백엔드 src/common/units.util.ts와 동일한 상수 - 저장은 항상 백엔드가 g·m으로 정규화하므로,
// 프론트는 "사용자가 원래 입력했던 단위로 다시 보여주기" 용도로만 이 상수를 사용한다.
export const OZ_TO_G = 28.35;
export const YD_TO_M = 0.9144;

export type InputUnit = "METRIC" | "IMPERIAL";

export function displayWeight(grams: number, unit: InputUnit): { value: number; label: string } {
  if (unit === "IMPERIAL") return { value: +(grams / OZ_TO_G).toFixed(1), label: "oz" };
  return { value: grams, label: "g" };
}

export function displayLength(meters: number, unit: InputUnit): { value: number; label: string } {
  if (unit === "IMPERIAL") return { value: +(meters / YD_TO_M).toFixed(1), label: "yd" };
  return { value: meters, label: "m" };
}
