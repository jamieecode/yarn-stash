import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PhotoUploader } from "../../components/ui/PhotoUploader";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { useDeleteProjectMutation, useProjectQuery, useUpdateProjectMutation } from "../../api/useProjects";
import { usePatternYarnMatchesQuery } from "../../api/usePatterns";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_ORDER, type PhotoInput, type ProjectStatus } from "../../types/api";

// 화면설계서 7-1(프로젝트 상세)
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project } = useProjectQuery(id);
  const updateProject = useUpdateProjectMutation(id ?? "");
  const deleteProject = useDeleteProjectMutation();

  const [memo, setMemo] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [showYarnPicker, setShowYarnPicker] = useState(false);

  const { data: yarnMatches } = usePatternYarnMatchesQuery(showYarnPicker ? project?.patternId : undefined);

  useEffect(() => {
    setMemo(project?.memo ?? "");
  }, [project?.memo]);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="프로젝트 상세" />
        <p className="p-6 text-center text-sm text-muted">불러오는 중...</p>
      </div>
    );
  }

  function handleStatusChange(status: ProjectStatus) {
    updateProject.mutate({ status });
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

  function handlePickYarn(yarnId: string) {
    updateProject.mutate({ yarnId });
    setShowYarnPicker(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={project.pattern.name}
        right={
          <button onClick={() => setConfirmingDelete(true)} aria-label="삭제" className="cursor-pointer border-none bg-transparent p-1 text-danger">
            <Trash2 size={18} />
          </button>
        }
      />

      <div className="p-4">
        {project.yarn ? (
          <p className="text-sm text-muted">
            {project.yarn.brand} {project.yarn.lineName}
          </p>
        ) : (
          <button
            onClick={() => setShowYarnPicker((v) => !v)}
            className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-accent"
          >
            실 연결하기
          </button>
        )}
        {showYarnPicker && (
          <div className="mt-2 flex flex-col gap-1.5">
            {yarnMatches?.map((m) => (
              <button
                key={m.yarn.id}
                onClick={() => handlePickYarn(m.yarn.id)}
                className="cursor-pointer rounded-lg border border-border bg-card p-2 text-left text-sm"
              >
                {m.yarn.brand} {m.yarn.lineName}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {PROJECT_STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm font-semibold ${
                project.status === s ? "border-accent bg-accent-soft text-accent" : "border-border bg-card text-muted"
              }`}
            >
              {PROJECT_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {project.status === "COMPLETED" && (
          <p className="mt-2 text-xs text-sub">
            완료를 축하해요! 실 소진 처리는 실 상세에서 직접 할 수 있어요
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
            초기화
          </button>
        </div>

        <section className="mt-6">
          <label className="mb-1.5 block text-xs font-semibold text-muted">진행 사진</label>
          <PhotoUploader photos={project.photos.map((p) => ({ url: p.url, publicId: p.publicId ?? undefined }))} onChange={handlePhotosChange} />
        </section>

        <section className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted">메모</label>
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
          title="프로젝트를 삭제할까요?"
          description="삭제하면 되돌릴 수 없어요"
          danger
          confirmLabel="삭제"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      {confirmingReset && (
        <ConfirmModal
          title="단수를 0으로 초기화할까요?"
          confirmLabel="초기화"
          danger
          onConfirm={handleReset}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </div>
  );
}
