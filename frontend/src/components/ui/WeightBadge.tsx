import { useTranslation } from "react-i18next";
import { type WeightCategory } from "../../types/api";
import { weightCategoryLabel, weightCategoryUnspecifiedLabel } from "../../lib/enumLabels";

export function WeightBadge({ weight }: { weight: WeightCategory | null | undefined }) {
  const { t } = useTranslation("enums");
  if (!weight) {
    return (
      <span className="rounded-full bg-border px-2.5 py-1 text-[11px] font-semibold text-muted">
        {weightCategoryUnspecifiedLabel(t)}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-sub-soft px-2.5 py-1 text-[11px] font-semibold text-sub">
      {weightCategoryLabel(t, weight)}
    </span>
  );
}
