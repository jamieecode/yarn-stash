import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatternSearchQuery, usePatternsQuery } from "../../api/usePatterns";
import { PatternCard } from "../../components/pattern/PatternCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { CRAFT_TYPE_LABEL, CRAFT_TYPE_ORDER, type CraftType } from "../../types/api";

type BookmarkFilter = "ALL" | "BOOKMARKED";

// 화면설계서 4번(도안 목록)
export function PatternListPage() {
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
        <h1 className="text-lg font-bold text-text">도안</h1>
        <button
          onClick={() => navigate("/patterns/new")}
          aria-label="도안 등록"
          className="flex cursor-pointer items-center justify-center rounded-full border-none bg-accent p-2 text-white"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5 px-4">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} label="전체" />
        <FilterChip active={filter === "BOOKMARKED"} onClick={() => setFilter("BOOKMARKED")} label="찜함" />
      </div>

      <div className="mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <FilterChip active={craftFilter === "ALL"} onClick={() => setCraftFilter("ALL")} label="전체" />
        {CRAFT_TYPE_ORDER.map((c) => (
          <FilterChip key={c} active={craftFilter === c} onClick={() => setCraftFilter(c)} label={CRAFT_TYPE_LABEL[c]} />
        ))}
      </div>

      <div className="px-4 pt-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="도안명·작가로 검색"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="p-4">
        {isSearching
          ? searchQuery.isLoading && <p className="py-10 text-center text-sm text-muted">검색 중...</p>
          : listQuery.isLoading && <p className="py-10 text-center text-sm text-muted">불러오는 중...</p>}

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
                      <div className="mt-0.5 text-xs text-muted">{r.designer ?? "작가 미상"} · Ravelry</div>
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
                ? "일치하는 도안이 없어요"
                : filter === "BOOKMARKED"
                  ? "아직 찜한 도안이 없어요"
                  : "아직 등록된 도안이 없어요"
            }
            action={
              isSearching ? (
                <button
                  onClick={() => navigate("/patterns/new")}
                  className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  등록하기
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
