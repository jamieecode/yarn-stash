import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useProjectsQuery } from "../../api/useProjects";
import { EmptyState } from "../../components/ui/EmptyState";
import { PROJECT_STATUS_ORDER, type Project, type ProjectStatus } from "../../types/api";
import { projectStatusLabel } from "../../lib/enumLabels";

const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  IN_PROGRESS: "bg-accent-soft text-accent",
  COMPLETED: "bg-sub-soft text-sub",
  ON_HOLD: "bg-warn-soft text-warn",
};

// 카드 한 줄에 실 이름을 다 나열하면 넘치므로 첫 실만 쓰고 나머지는 개수로 접는다 (배색 프로젝트 대응)
function describeYarns(t: TFunction, project: Project) {
  const [first, ...rest] = project.yarnUsages;
  if (!first) return t("project:list.yarnUnlinked");
  const name = [first.yarn.brand, first.yarn.lineName].filter(Boolean).join(" ");
  return rest.length > 0 ? t("project:list.yarnMoreCount", { name, count: rest.length }) : name;
}

// 화면설계서 7번(프로젝트 목록)
export function ProjectListPage() {
  const { t, i18n } = useTranslation(["project", "enums", "common"]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectStatus | "ALL">("ALL");
  const { data: projects, isLoading } = useProjectsQuery(filter === "ALL" ? {} : { status: filter });

  return (
    <div>
      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-text">{t("project:list.title")}</h1>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} label={t("project:list.filterAll")} />
        {PROJECT_STATUS_ORDER.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={projectStatusLabel(t, s)} />
        ))}
      </div>

      <div className="p-4">
        {isLoading && <p className="py-10 text-center text-sm text-muted">{t("common:loading")}</p>}
        {projects && projects.length === 0 && (
          <EmptyState message={t("project:list.emptyMessage")} />
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
                    {projectStatusLabel(t, project.status)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {describeYarns(t, project)} · {t("project:list.rowCount", { count: project.currentRow })}
                </div>
                <div className="mt-1 text-[11px] text-muted">
                  {new Date(project.updatedAt).toLocaleDateString(i18n.language)}
                </div>
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
