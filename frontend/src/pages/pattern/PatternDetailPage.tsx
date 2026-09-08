import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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

// 화면설계서 6번(도안 상세)
export function PatternDetailPage() {
  const { t } = useTranslation(["pattern", "common"]);
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
        <TopBar title={t("pattern:detail.title")} />
        <p className="p-6 text-center text-sm text-muted">{t("common:loading")}</p>
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
            <button onClick={handleToggleBookmark} aria-label={t("pattern:detail.bookmarkAria")} className="cursor-pointer border-none bg-transparent p-1 text-accent">
              <Heart size={18} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            {isOwner && (
              <button onClick={() => navigate(`/patterns/${pattern.id}/edit`)} aria-label={t("pattern:detail.editAria")} className="cursor-pointer border-none bg-transparent p-1 text-text">
                <Pencil size={18} />
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => deleteCheck?.canDelete && setConfirmingDelete(true)}
                aria-label={t("pattern:detail.deleteAria")}
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
        <p className="mt-1 text-xs text-muted">{pattern.sourceType === "RAVELRY" ? "Ravelry" : t("pattern:detail.sourceMyDb")}</p>

        {isOwner && deleteCheck && !deleteCheck.canDelete && (
          <p className="mt-2 text-xs text-danger">{t(`pattern:detail.deleteReason.${deleteCheck.reason}`)}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <WeightBadge weight={pattern.weightCategory} />
          <CraftBadge craftType={pattern.craftType} />
          <span className="text-xs text-muted">
            {pattern.requiredMaxM && pattern.requiredMaxM > pattern.requiredMinM
              ? t("pattern:card.requiredRange", { min: pattern.requiredMinM, max: pattern.requiredMaxM })
              : t("pattern:card.requiredMin", { min: pattern.requiredMinM })}
          </span>
        </div>

        {(pattern.originalYarnBrand || pattern.originalYarnLine) && (
          <div className="mt-2 text-xs text-muted">
            {t("pattern:detail.originalYarnLabel", {
              name: [pattern.originalYarnBrand, pattern.originalYarnLine].filter(Boolean).join(" "),
            })}
          </div>
        )}

        {pattern.sourceUrl && (
          <a href={pattern.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-accent underline">
            {t("pattern:detail.originalLinkLabel")}
          </a>
        )}

        {isBookmarked && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-muted">{t("pattern:detail.memoLabel")}</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => memo !== pattern.myBookmark?.memo && updateMemo.mutate(memo)}
              rows={2}
              placeholder={t("pattern:detail.memoPlaceholder")}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
        )}

        <button
          onClick={handleStartProject}
          disabled={isStarting}
          className="mt-4 w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("pattern:detail.startProject")}
        </button>
      </div>

      <div className="p-4 pt-0">
        <h2 className="mb-2 text-sm font-semibold text-text">{t("pattern:detail.matchingYarnHeading")}</h2>
        {matchesLoading && <p className="py-6 text-center text-sm text-muted">{t("common:loading")}</p>}
        {matches && matches.length === 0 && <EmptyState message={t("pattern:detail.matchesEmpty")} />}
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
                {/* 매칭 판정 자체가 가용량 기준이므로, 일부가 묶여 있으면 그 사실을 같이 보여줘야 납득이 됨 */}
                {m.yarn.committedM > 0 && (
                  <p className="mt-1 text-[11px] text-muted">
                    {t("pattern:detail.availableOfTotal", {
                      available: Math.round(m.yarn.availableM),
                      total: Math.round(m.yarn.totalM),
                    })}
                  </p>
                )}
                {m.needsLotMixing && <p className="mt-1 text-xs text-warn">{t("pattern:detail.needsLotMixing")}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title={t("pattern:detail.deleteConfirmTitle")}
          description={t("pattern:detail.deleteConfirmDesc")}
          danger
          confirmLabel={t("common:action.delete")}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
