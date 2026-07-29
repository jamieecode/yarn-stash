export const OZ_TO_G = 28.35;
export const YD_TO_M = 0.9144;

export type InputUnit = "METRIC" | "IMPERIAL";

// 기획서 2.1/2.5 원칙: 사용자가 입력한 단위와 무관하게 내부 저장은 항상 g·m(길이는 m) 기준으로 정규화
export function toGrams(value: number, unit: InputUnit): number {
  return unit === "IMPERIAL" ? +(value * OZ_TO_G).toFixed(1) : value;
}

export function toMeters(value: number, unit: InputUnit): number {
  return unit === "IMPERIAL" ? +(value * YD_TO_M).toFixed(1) : value;
}
