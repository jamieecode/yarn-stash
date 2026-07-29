import { Heart } from "lucide-react";
import { useAddBookmarkMutation, useRemoveBookmarkMutation } from "../../api/usePatterns";
import { WeightBadge } from "../ui/WeightBadge";
import { CraftBadge } from "../ui/CraftBadge";
import type { Pattern } from "../../types/api";

interface PatternCardProps {
  pattern: Pattern;
  isBookmarked: boolean;
  onOpen: () => void;
}

// 화면설계서 4번(도안 목록) - 하트 아이콘으로 목록에서 바로 찜 가능
export function PatternCard({ pattern, isBookmarked, onOpen }: PatternCardProps) {
  const addBookmark = useAddBookmarkMutation(pattern.id);
  const removeBookmark = useRemoveBookmarkMutation(pattern.id);

  function handleToggleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    if (isBookmarked) removeBookmark.mutate();
    else addBookmark.mutate();
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-text">{pattern.name}</div>
        {pattern.designer && <div className="mt-0.5 text-xs text-muted">{pattern.designer}</div>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <WeightBadge weight={pattern.weightCategory} />
          <CraftBadge craftType={pattern.craftType} />
          <span className="text-[11px] text-muted">
            {pattern.requiredMaxM && pattern.requiredMaxM > pattern.requiredMinM
              ? `${pattern.requiredMinM}~${pattern.requiredMaxM}m`
              : `${pattern.requiredMinM}m`}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-muted">
          {pattern.sourceType === "RAVELRY" ? "Ravelry" : pattern.sourceType === "LINK" ? "링크 출처" : "직접 등록"}
        </div>
      </div>
      <button
        type="button"
        onClick={handleToggleBookmark}
        aria-label={isBookmarked ? "찜 해제" : "찜하기"}
        className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-accent"
      >
        <Heart size={20} fill={isBookmarked ? "currentColor" : "none"} />
      </button>
    </button>
  );
}
