import { YARDAGE_LABEL_TEXT, type YardageLabel } from "../../types/api";

// 화면설계서 9번 결정 사항 - 130%+ 여유로움 / 110~130% 충분함 / 100~110% 빠듯함 / 100% 미만 부족함
const TIER_CLASS: Record<YardageLabel, string> = {
  AMPLE: "bg-accent-soft text-accent",
  SUFFICIENT: "bg-sub-soft text-sub",
  TIGHT: "bg-warn-soft text-warn",
  INSUFFICIENT: "bg-danger-soft text-danger",
};

export function MatchTierChip({ label }: { label: YardageLabel }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${TIER_CLASS[label]}`}>
      {YARDAGE_LABEL_TEXT[label]}
    </span>
  );
}
