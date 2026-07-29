import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useYarnsQuery } from "../../api/useYarns";
import { YarnCard } from "../../components/yarn/YarnCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { WEIGHT_CATEGORY_LABEL, WEIGHT_CATEGORY_ORDER, type WeightCategory } from "../../types/api";

// 화면설계서 1번(실 목록)
export function YarnListPage() {
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
        <h1 className="text-lg font-bold text-text">실</h1>
        <button
          onClick={() => navigate("/yarns/new")}
          aria-label="실 등록"
          className="flex cursor-pointer items-center justify-center rounded-full border-none bg-accent p-2 text-white"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <FilterChip active={weightFilter === "ALL"} onClick={() => setWeightFilter("ALL")} label="전체" />
        {WEIGHT_CATEGORY_ORDER.map((w) => (
          <FilterChip
            key={w}
            active={weightFilter === w}
            onClick={() => setWeightFilter(w)}
            label={WEIGHT_CATEGORY_LABEL[w]}
          />
        ))}
      </div>

      <div className="px-4 pt-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="브랜드·라인명·색상명 검색"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted">
        <div className="flex gap-3">
          <button
            onClick={() => setSort("RECENT")}
            className={`cursor-pointer border-none bg-transparent p-0 ${sort === "RECENT" ? "font-semibold text-text" : ""}`}
          >
            최근 등록순
          </button>
          <button
            onClick={() => setSort("NAME")}
            className={`cursor-pointer border-none bg-transparent p-0 ${sort === "NAME" ? "font-semibold text-text" : ""}`}
          >
            이름순
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" checked={showConsumed} onChange={(e) => setShowConsumed(e.target.checked)} />
          소진됨 보기
        </label>
      </div>

      <div className="p-4">
        {isLoading && <p className="py-10 text-center text-sm text-muted">불러오는 중...</p>}
        {isError && <p className="py-10 text-center text-sm text-danger">실 목록을 불러오지 못했어요</p>}
        {yarns && yarns.length === 0 && (
          <EmptyState
            message={
              query || weightFilter !== "ALL" ? "일치하는 실이 없어요" : "첫 실을 등록해보세요"
            }
            action={
              !query && weightFilter === "ALL" ? (
                <button
                  onClick={() => navigate("/yarns/new")}
                  className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  실 등록하기
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
