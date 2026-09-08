import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePatternSearchQuery, usePatternsQuery } from "../../api/usePatterns";
import { PatternCard } from "../../components/pattern/PatternCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { CRAFT_TYPE_ORDER, type CraftType } from "../../types/api";
import { craftTypeLabel } from "../../lib/enumLabels";

type BookmarkFilter = "ALL" | "BOOKMARKED";

// 화면설계서 4번(도안 목록)
export function PatternListPage() {
  const { t } = useTranslation(["pattern", "enums", "common"]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BookmarkFilter>("ALL");
  const [craftFilter, setCraftFilter] = useState<CraftType | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const isSearching = debouncedQuery.trim().length > 0;

  const listQuery = usePatternsQuery({
    craftType: craftFilter === "ALL" ? undefined : craftFilter,
    bookmarked: filter === "BOOKMARKED",
  });
  const searchQuery = usePatternSearchQuery(isSearching ? debouncedQuery : "");
  // 전체/검색 목록에서도 하트 상태를 표시하기 위해 내 찜 목록을 함께 조회
  const { data: myBookmarks } = usePatternsQuery({ bookmarked: true });
  const bookmarkedIds = useMemo(() => new Set((myBookmarks ?? []).map((p) => p.id)), [myBookmarks]);

  const isEmpty = isSearching
    ? (searchQuery.data?.length ?? 0) === 0 && !searchQuery.isLoading
    : (listQuery.data?.length ?? 0) === 0 && !listQuery.isLoading;

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold text-text">{t("pattern:list.title")}</h1>
        <button
          onClick={() => navigate("/patterns/new")}
          aria-label={t("pattern:list.registerAria")}
          className="flex cursor-pointer items-center justify-center rounded-full border-none bg-accent p-2 text-white"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5 px-4">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} label={t("pattern:list.filterAll")} />
        <FilterChip active={filter === "BOOKMARKED"} onClick={() => setFilter("BOOKMARKED")} label={t("pattern:list.filterBookmarked")} />
      </div>

      <div className="mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <FilterChip active={craftFilter === "ALL"} onClick={() => setCraftFilter("ALL")} label={t("pattern:list.filterAll")} />
        {CRAFT_TYPE_ORDER.map((c) => (
          <FilterChip key={c} active={craftFilter === c} onClick={() => setCraftFilter(c)} label={craftTypeLabel(t, c)} />
        ))}
      </div>

      <div className="px-4 pt-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("pattern:list.searchPlaceholder")}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="p-4">
        {isSearching
          ? searchQuery.isLoading && <p className="py-10 text-center text-sm text-muted">{t("pattern:list.searching")}</p>
          : listQuery.isLoading && <p className="py-10 text-center text-sm text-muted">{t("common:loading")}</p>}

        {!isEmpty && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {isSearching
              ? searchQuery.data?.map((r) =>
                  r.source === "LOCAL" ? (
                    <PatternCard key={r.id} pattern={r} isBookmarked={bookmarkedIds.has(r.id)} onOpen={() => navigate(`/patterns/${r.id}`)} />
                  ) : (
                    <button
                      key={`ravelry-${r.ravelryId}`}
                      onClick={() => navigate(`/patterns/new?ravelryId=${r.ravelryId}`)}
                      className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left"
                    >
                      <div className="text-sm font-semibold text-text">{r.name}</div>
                      <div className="mt-0.5 text-xs text-muted">{r.designer ?? t("pattern:list.designerUnknown")} · Ravelry</div>
                    </button>
                  ),
                )
              : listQuery.data?.map((pattern) => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    isBookmarked={bookmarkedIds.has(pattern.id)}
                    onOpen={() => navigate(`/patterns/${pattern.id}`)}
                  />
                ))}
          </div>
        )}

        {isEmpty && (
          <EmptyState
            message={
              isSearching
                ? t("pattern:list.emptySearch")
                : filter === "BOOKMARKED"
                  ? t("pattern:list.emptyBookmarked")
                  : t("pattern:list.emptyDefault")
            }
            action={
              isSearching ? (
                <button
                  onClick={() => navigate("/patterns/new")}
                  className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("pattern:list.emptyCta")}
                </button>
              ) : undefined
            }
          />
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
