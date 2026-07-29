import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { WeightBadge } from "../../components/ui/WeightBadge";
import { CraftBadge } from "../../components/ui/CraftBadge";
import { MatchTierChip } from "../../components/ui/MatchTierChip";
import { GaugeChipDisplay } from "../../components/ui/GaugeChipDisplay";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  useAddBookmarkMutation,
  useDeleteCheckQuery,
  useDeletePatternMutation,
  usePatternQuery,
  usePatternYarnMatchesQuery,
  useRemoveBookmarkMutation,
  useUpdateBookmarkMemoMutation,
} from "../../api/usePatterns";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/apiClient";
import type { Project } from "../../types/api";

const DELETE_REASON_TEXT: Record<string, string> = {
  NOT_OWNER: "등록한 사람만 삭제할 수 있어요",
  BOOKMARKED_BY_OTHERS: "다른 분들이 찜한 도안이라 삭제할 수 없어요",
  HAS_PROJECT: "진행 중인 프로젝트가 있어 삭제할 수 없어요",
};

// 화면설계서 6번(도안 상세)
export function PatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [memo, setMemo] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const { data: pattern, isLoading } = usePatternQuery(id);
  const isOwner = Boolean(pattern && user && pattern.createdByUserId === user.id);

  const { data: matches, isLoading: matchesLoading } = usePatternYarnMatchesQuery(id);
  const { data: deleteCheck } = useDeleteCheckQuery(id, isOwner);

  const addBookmark = useAddBookmarkMutation(id ?? "");
  const removeBookmark = useRemoveBookmarkMutation(id ?? "");
  const updateMemo = useUpdateBookmarkMemoMutation(id ?? "");
  const deletePattern = useDeletePatternMutation();

  useEffect(() => {
    setMemo(pattern?.myBookmark?.memo ?? "");
  }, [pattern?.myBookmark?.memo]);

  if (isLoading || !pattern) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="도안 상세" />
        <p className="p-6 text-center text-sm text-muted">불러오는 중...</p>
      </div>
    );
  }

  const isBookmarked = Boolean(pattern.myBookmark);

  async function handleToggleBookmark() {
    if (isBookmarked) await removeBookmark.mutateAsync();
    else await addBookmark.mutateAsync();
  }

  async function handleDelete() {
    await deletePattern.mutateAsync(pattern!.id);
    navigate("/patterns", { replace: true });
  }

  // 이 도안으로 진행 중인 프로젝트가 이미 있는지 확인 (기획서 6-2 - 있으면 새로 안 만들고 그 프로젝트로 이동)
  async function handleStartProject() {
    setIsStarting(true);
    try {
      const inProgress = await api.get<Project[]>(`/projects?patternId=${pattern!.id}&status=IN_PROGRESS`);
      if (inProgress[0]) navigate(`/projects/${inProgress[0].id}`);
      else navigate(`/patterns/${pattern!.id}/start-project`);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={pattern.name}
        right={
          <div className="flex gap-1">
            <button onClick={handleToggleBookmark} aria-label="찜하기" className="cursor-pointer border-none bg-transparent p-1 text-accent">
              <Heart size={18} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            {isOwner && (
              <button onClick={() => navigate(`/patterns/${pattern.id}/edit`)} aria-label="수정" className="cursor-pointer border-none bg-transparent p-1 text-text">
                <Pencil size={18} />
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => deleteCheck?.canDelete && setConfirmingDelete(true)}
                aria-label="삭제"
                disabled={deleteCheck ? !deleteCheck.canDelete : false}
                className="cursor-pointer border-none bg-transparent p-1 text-danger disabled:opacity-30"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        }
      />

      <div className="p-4">
        {pattern.designer && <p className="text-sm text-muted">{pattern.designer}</p>}
        <p className="mt-1 text-xs text-muted">{pattern.sourceType === "RAVELRY" ? "Ravelry" : "내 DB"}</p>

        {isOwner && deleteCheck && !deleteCheck.canDelete && (
          <p className="mt-2 text-xs text-danger">{DELETE_REASON_TEXT[deleteCheck.reason]}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <WeightBadge weight={pattern.weightCategory} />
          <CraftBadge craftType={pattern.craftType} />
          <span className="text-xs text-muted">
            {pattern.requiredMaxM && pattern.requiredMaxM > pattern.requiredMinM
              ? `${pattern.requiredMinM}~${pattern.requiredMaxM}m`
              : `${pattern.requiredMinM}m`}
          </span>
        </div>

        {(pattern.originalYarnBrand || pattern.originalYarnLine) && (
          <div className="mt-2 text-xs text-muted">
            원본 실: {[pattern.originalYarnBrand, pattern.originalYarnLine].filter(Boolean).join(" ")}
          </div>
        )}

        {pattern.sourceUrl && (
          <a href={pattern.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-accent underline">
            원본 링크 보기
          </a>
        )}

        {isBookmarked && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-muted">내 메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => memo !== pattern.myBookmark?.memo && updateMemo.mutate(memo)}
              rows={2}
              placeholder='예: "5.5mm로 바꿔서 뜰 것"'
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
        )}

        <button
          onClick={handleStartProject}
          disabled={isStarting}
          className="mt-4 w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          이 도안으로 시작하기
        </button>
      </div>

      <div className="p-4 pt-0">
        <h2 className="mb-2 text-sm font-semibold text-text">내가 가진 실 중 맞는 것</h2>
        {matchesLoading && <p className="py-6 text-center text-sm text-muted">불러오는 중...</p>}
        {matches && matches.length === 0 && <EmptyState message="같은 굵기의 실이 없어요" />}
        {matches && matches.length > 0 && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <button
                key={m.yarn.id}
                onClick={() => navigate(`/yarns/${m.yarn.id}`)}
                className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text">
                    {m.yarn.brand} {m.yarn.lineName}
                  </span>
                  <MatchTierChip label={m.label} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <GaugeChipDisplay chip={m.gaugeChip} />
                </div>
                {m.needsLotMixing && <p className="mt-1 text-xs text-warn">로트를 섞어야 해요</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="도안을 삭제할까요?"
          description="삭제하면 되돌릴 수 없어요"
          danger
          confirmLabel="삭제"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
