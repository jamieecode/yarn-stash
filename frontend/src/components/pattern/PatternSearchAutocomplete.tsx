import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { usePatternSearchQuery } from "../../api/usePatterns";
import { api } from "../../lib/apiClient";
import type { PatternSearchResult, RavelryPatternDetail } from "../../types/api";

interface PatternSearchAutocompleteProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSelectLocal: (patternId: string) => void;
  onSelectRavelry: (detail: RavelryPatternDetail) => void;
}

// 화면설계서 5번 - 도안명/작가 검색, 우리 DB(클릭 시 바로 상세 이동)와 Ravelry(클릭 시 폼 자동 채움) 결과를 한 목록에 병합
export function PatternSearchAutocomplete({ query, onQueryChange, onSelectLocal, onSelectRavelry }: PatternSearchAutocompleteProps) {
  const { t } = useTranslation("pattern");
  const [isOpen, setIsOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results } = usePatternSearchQuery(debouncedQuery);

  async function handlePick(result: PatternSearchResult) {
    if (result.source === "LOCAL") {
      onSelectLocal(result.id);
    } else {
      setIsResolving(true);
      try {
        const detail = await api.get<RavelryPatternDetail>(`/patterns/ravelry/${result.ravelryId}`);
        onSelectRavelry(detail);
      } finally {
        setIsResolving(false);
      }
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
        placeholder={t("searchAutocomplete.placeholder")}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      {isResolving && <p className="mt-1 text-xs text-muted">{t("searchAutocomplete.resolvingRavelry")}</p>}
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
              <span className="text-sm font-semibold text-text">{r.name}</span>
              <span className="text-xs text-muted">
                {r.designer ?? t("searchAutocomplete.designerUnknown")} · {r.source === "LOCAL" ? t("searchAutocomplete.myDb") : "Ravelry"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
