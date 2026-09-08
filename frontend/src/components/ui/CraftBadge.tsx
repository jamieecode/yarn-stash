import { useTranslation } from "react-i18next";
import { type CraftType } from "../../types/api";
import { craftTypeLabel } from "../../lib/enumLabels";

export function CraftBadge({ craftType }: { craftType: CraftType }) {
  const { t } = useTranslation("enums");
  return (
    <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-text">
      {craftTypeLabel(t, craftType)}
    </span>
  );
}
