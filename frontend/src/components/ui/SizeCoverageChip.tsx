import { useTranslation } from "react-i18next";
import type { SizeCoverage } from "../../types/api";
import { sizeCoverageLabel } from "../../lib/enumLabels";

// 범위형 도안(requiredMaxM 있음)에서만 표시 - 4단계 칩은 가장 작은 사이즈 기준이라 큰 사이즈까지 되는지는 이걸로 보완
export function SizeCoverageChip({ coverage }: { coverage: SizeCoverage }) {
  const { t } = useTranslation("enums");
  if (!coverage) return null;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        coverage === "ALL_SIZES" ? "bg-sub-soft text-sub" : "bg-warn-soft text-warn"
      }`}
    >
      {sizeCoverageLabel(t, coverage)}
    </span>
  );
}
