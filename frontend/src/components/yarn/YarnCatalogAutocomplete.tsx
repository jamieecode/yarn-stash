import { useState } from "react";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useResolveRavelryYarnMutation, useYarnCatalogSearchQuery } from "../../api/useYarnCatalog";
import type { YarnCatalog } from "../../types/api";

interface YarnCatalogAutocompleteProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (catalog: YarnCatalog) => void;
}

// 화면설계서 2번 - 브랜드/라인명 입력 중 실시간 추천 드롭다운 (내 DB 우선, 부족하면 Ravelry 병합)
export function YarnCatalogAutocomplete({ query, onQueryChange, onSelect }: YarnCatalogAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results } = useYarnCatalogSearchQuery(debouncedQuery);
  const resolveRavelry = useResolveRavelryYarnMutation();

  async function handlePick(result: NonNullable<typeof results>[number]) {
    if (result.source === "LOCAL") {
      onSelect(result);
    } else {
      const resolved = await resolveRavelry.mutateAsync(result.ravelryId);
      onSelect(resolved);
    }
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="브랜드 또는 라인명"
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      {isOpen && Boolean(results?.length) && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {results!.map((r) => (
            <button
              key={r.source === "LOCAL" ? r.id : `ravelry-${r.ravelryId}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePick(r)}
              className="flex w-full cursor-pointer flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-bg"
            >
              <span className="text-sm font-semibold text-text">
                {r.brand} {r.lineName}
              </span>
              <span className="text-xs text-muted">
                {r.source === "LOCAL" ? [r.fiber, r.weightCategory].filter(Boolean).join(" · ") : "정보 불러오는 중..."}
                {" · "}
                {r.source === "LOCAL" ? "내 DB" : "Ravelry"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
