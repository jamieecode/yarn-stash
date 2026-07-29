import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectsQuery } from "../../api/useProjects";
import { EmptyState } from "../../components/ui/EmptyState";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_ORDER, type ProjectStatus } from "../../types/api";

const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  IN_PROGRESS: "bg-accent-soft text-accent",
  COMPLETED: "bg-sub-soft text-sub",
  ON_HOLD: "bg-warn-soft text-warn",
};

// 화면설계서 7번(프로젝트 목록)
export function ProjectListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectStatus | "ALL">("ALL");
  const { data: projects, isLoading } = useProjectsQuery(filter === "ALL" ? {} : { status: filter });

  return (
    <div>
      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-text">프로젝트</h1>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} label="전체" />
        {PROJECT_STATUS_ORDER.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={PROJECT_STATUS_LABEL[s]} />
        ))}
      </div>

      <div className="p-4">
        {isLoading && <p className="py-10 text-center text-sm text-muted">불러오는 중...</p>}
        {projects && projects.length === 0 && (
          <EmptyState message="아직 시작한 프로젝트가 없어요, 도안 탭에서 마음에 드는 도안을 찾아 시작해보세요" />
        )}
        {projects && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text">{project.pattern.name}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE_CLASS[project.status]}`}>
                    {PROJECT_STATUS_LABEL[project.status]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {project.yarn ? `${project.yarn.brand} ${project.yarn.lineName ?? ""}` : "실 미연결"} · {project.currentRow}단
                </div>
                <div className="mt-1 text-[11px] text-muted">{new Date(project.updatedAt).toLocaleDateString()}</div>
              </button>
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
