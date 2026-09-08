import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useYarnsQuery } from "../../api/useYarns";
import { YarnCard } from "../../components/yarn/YarnCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { WEIGHT_CATEGORY_ORDER, type WeightCategory } from "../../types/api";
import { weightCategoryLabel } from "../../lib/enumLabels";

// 화면설계서 1번(실 목록)
export function YarnListPage() {
  const { t } = useTranslation(["yarn", "enums", "common"]);
  const navigate = useNavigate();
  const [weightFilter, setWeightFilter] = useState<WeightCategory | "ALL">("ALL");
  const [sort, setSort] = useState<"RECENT" | "NAME">("RECENT");
  const [query, setQuery] = useState("");
  const [showConsumed, setShowConsumed] = useState(false);

  const { data: yarns, isLoading, isError } = useYarnsQuery({
    q: query || undefined,
    weightCategory: weightFilter === "ALL" ? undefined : weightFilter,
    sort,
    includeConsumed: showConsumed,
  });

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold text-text">{t("yarn:list.title")}</h1>
        <button
          onClick={() => navigate("/yarns/new")}
          aria-label={t("yarn:list.registerAria")}
          className="flex cursor-pointer items-center justify-center rounded-full border-none bg-accent p-2 text-white"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <FilterChip active={weightFilter === "ALL"} onClick={() => setWeightFilter("ALL")} label={t("yarn:list.filterAll")} />
        {WEIGHT_CATEGORY_ORDER.map((w) => (
          <FilterChip
            key={w}
            active={weightFilter === w}
            onClick={() => setWeightFilter(w)}
            label={weightCategoryLabel(t, w)}
          />
        ))}
      </div>

      <div className="px-4 pt-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("yarn:list.searchPlaceholder")}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted">
        <div className="flex gap-3">
          <button
            onClick={() => setSort("RECENT")}
            className={`cursor-pointer border-none bg-transparent p-0 ${sort === "RECENT" ? "font-semibold text-text" : ""}`}
          >
            {t("yarn:list.sortRecent")}
          </button>
          <button
            onClick={() => setSort("NAME")}
            className={`cursor-pointer border-none bg-transparent p-0 ${sort === "NAME" ? "font-semibold text-text" : ""}`}
          >
            {t("yarn:list.sortName")}
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" checked={showConsumed} onChange={(e) => setShowConsumed(e.target.checked)} />
          {t("yarn:list.showConsumed")}
        </label>
      </div>

      <div className="p-4">
        {isLoading && <p className="py-10 text-center text-sm text-muted">{t("common:loading")}</p>}
        {isError && <p className="py-10 text-center text-sm text-danger">{t("yarn:list.loadError")}</p>}
        {yarns && yarns.length === 0 && (
          <EmptyState
            message={
              query || weightFilter !== "ALL" ? t("yarn:list.emptyFiltered") : t("yarn:list.emptyDefault")
            }
            action={
              !query && weightFilter === "ALL" ? (
                <button
                  onClick={() => navigate("/yarns/new")}
                  className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("yarn:list.emptyCta")}
                </button>
              ) : undefined
            }
          />
        )}
        {yarns && yarns.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {yarns.map((yarn) => (
              <YarnCard key={yarn.id} yarn={yarn} onOpen={() => navigate(`/yarns/${yarn.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
        active ? "border-accent bg-accent-soft text-accent" : "border-border bg-card text-muted"
      }`}
    >
      {label}
    </button>
  );
}
