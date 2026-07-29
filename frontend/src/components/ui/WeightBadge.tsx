import { WEIGHT_CATEGORY_LABEL, type WeightCategory } from "../../types/api";

export function WeightBadge({ weight }: { weight: WeightCategory | null | undefined }) {
  if (!weight) {
    return (
      <span className="rounded-full bg-border px-2.5 py-1 text-[11px] font-semibold text-muted">무게 미지정</span>
    );
  }
  return (
    <span className="rounded-full bg-sub-soft px-2.5 py-1 text-[11px] font-semibold text-sub">
      {WEIGHT_CATEGORY_LABEL[weight]}
    </span>
  );
}
