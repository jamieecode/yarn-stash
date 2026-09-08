import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TopBar } from "../../components/layout/TopBar";
import { PhotoUploader } from "../../components/ui/PhotoUploader";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ProjectYarnList } from "../../components/project/ProjectYarnList";
import { CompleteProjectModal } from "../../components/project/CompleteProjectModal";
import { useDeleteProjectMutation, useProjectQuery, useUpdateProjectMutation } from "../../api/useProjects";
import { PROJECT_STATUS_ORDER, type PhotoInput, type ProjectStatus } from "../../types/api";
import { projectStatusLabel } from "../../lib/enumLabels";

// 화면설계서 7-1(프로젝트 상세)
export function ProjectDetailPage() {
  const { t } = useTranslation(["project", "enums", "common"]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project } = useProjectQuery(id);
  const updateProject = useUpdateProjectMutation(id ?? "");
  const deleteProject = useDeleteProjectMutation();

  const [memo, setMemo] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingComplete, setConfirmingComplete] = useState(false);

  useEffect(() => {
    setMemo(project?.memo ?? "");
  }, [project?.memo]);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title={t("project:detail.title")} />
        <p className="p-6 text-center text-sm text-muted">{t("common:loading")}</p>
      </div>
    );
  }

  // 완료로 넘어갈 때는 실사용량을 먼저 확정받는다 - 아직 확정 안 된 실이 있을 때만 모달을 띄우고,
  // 확정할 게 없으면(연결된 실이 없거나 이미 다 확정됨) 그냥 상태만 바꾼다
  function handleStatusChange(status: ProjectStatus) {
    const needsConfirm = status === "COMPLETED" && project!.yarnUsages.some((u) => u.usedM == null);
    if (needsConfirm) {
      setConfirmingComplete(true);
      return;
    }
    updateProject.mutate({ status });
  }

  async function handleComplete(confirmUsages: { yarnId: string; usedM: number }[]) {
    await updateProject.mutateAsync({ status: "COMPLETED", confirmUsages });
    setConfirmingComplete(false);
  }

  function handleRowChange(delta: number) {
    updateProject.mutate({ currentRow: Math.max(0, project!.currentRow + delta) });
  }

  async function handleReset() {
    await updateProject.mutateAsync({ currentRow: 0 });
    setConfirmingReset(false);
  }

  function handlePhotosChange(photos: PhotoInput[]) {
    updateProject.mutate({ photos });
  }

  async function handleDelete() {
    await deleteProject.mutateAsync(project!.id);
    navigate("/projects", { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={project.pattern.name}
        right={
          <button onClick={() => setConfirmingDelete(true)} aria-label={t("project:detail.deleteAria")} className="cursor-pointer border-none bg-transparent p-1 text-danger">
            <Trash2 size={18} />
          </button>
        }
      />

      <div className="p-4">
        <ProjectYarnList project={project} />

        <div className="mt-4 flex gap-2">
          {PROJECT_STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm font-semibold ${
                project.status === s ? "border-accent bg-accent-soft text-accent" : "border-border bg-card text-muted"
              }`}
            >
              {projectStatusLabel(t, s)}
            </button>
          ))}
        </div>
        {project.status === "COMPLETED" && (
          <p className="mt-2 text-xs text-sub">
            {t("project:detail.completedNote")}
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="text-5xl font-bold text-text">{project.currentRow}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRowChange(-1)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-text"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => handleRowChange(1)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white"
            >
              <Plus size={18} />
            </button>
          </div>
          <button onClick={() => setConfirmingReset(true)} className="cursor-pointer border-none bg-transparent text-xs text-muted underline">
            {t("project:detail.reset")}
          </button>
        </div>

        <section className="mt-6">
          <label className="mb-1.5 block text-xs font-semibold text-muted">{t("project:detail.photoLabel")}</label>
          <PhotoUploader photos={project.photos.map((p) => ({ url: p.url, publicId: p.publicId ?? undefined }))} onChange={handlePhotosChange} />
        </section>

        <section className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted">{t("project:detail.memoLabel")}</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => memo !== (project.memo ?? "") && updateProject.mutate({ memo })}
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </section>
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title={t("project:detail.deleteConfirmTitle")}
          description={t("project:detail.deleteConfirmDesc")}
          danger
          confirmLabel={t("common:action.delete")}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      {confirmingReset && (
        <ConfirmModal
          title={t("project:detail.resetConfirmTitle")}
          confirmLabel={t("project:detail.reset")}
          danger
          onConfirm={handleReset}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
      {confirmingComplete && (
        <CompleteProjectModal project={project} onConfirm={handleComplete} onCancel={() => setConfirmingComplete(false)} />
      )}
    </div>
  );
}
