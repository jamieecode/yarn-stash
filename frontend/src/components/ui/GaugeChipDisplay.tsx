import type { GaugeChip } from "../../types/api";

// 기획서 2.3 - 게이지 정보가 둘 다 있을 때만 보조 칩 표시 (하드 필터 아님)
export function GaugeChipDisplay({ chip }: { chip: GaugeChip }) {
  if (!chip) return null;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        chip === "MATCH" ? "bg-sub-soft text-sub" : "bg-warn-soft text-warn"
      }`}
    >
      {chip === "MATCH" ? "게이지 일치" : "게이지 차이 있음"}
    </span>
  );
}
