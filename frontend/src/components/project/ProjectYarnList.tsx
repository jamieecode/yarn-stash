import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useAddProjectYarnMutation,
  useRemoveProjectYarnMutation,
  useUpdateProjectYarnMutation,
} from "../../api/useProjects";
import { usePatternYarnMatchesQuery } from "../../api/usePatterns";
import type { Project } from "../../types/api";

// 화면설계서 7-1(프로젝트 상세) - 이 프로젝트가 잡고 있는 실 목록.
// 여기서 연결/해제하거나 예약량을 바꾸면 곧바로 실 재고의 가용량에 반영된다 (배치 자체는 건드리지 않음)
export function ProjectYarnList({ project }: { project: Project }) {
  const { t } = useTranslation(["project", "yarn"]);
  const [picking, setPicking] = useState(false);
  const addYarn = useAddProjectYarnMutation(project.id);
  const removeYarn = useRemoveProjectYarnMutation(project.id);

  // 이미 연결된 실은 후보에서 빼야 중복 선택처럼 보이지 않음
  const { data: matches } = usePatternYarnMatchesQuery(picking ? project.patternId : undefined);
  const linkedIds = new Set(project.yarnUsages.map((u) => u.yarnId));
  const candidates = matches?.filter((m) => !linkedIds.has(m.yarn.id)) ?? [];

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold text-muted">{t("project:yarnList.heading")}</label>
        <button
          onClick={() => setPicking((v) => !v)}
          className="flex cursor-pointer items-center gap-1 border-none bg-transparent text-xs font-semibold text-accent"
        >
          <Plus size={13} /> {t("project:yarnList.linkAction")}
        </button>
      </div>

      {project.yarnUsages.length === 0 && !picking && (
        <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted">
          {t("project:yarnList.emptyNotice")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {project.yarnUsages.map((usage) => (
          <UsageRow key={usage.id} projectId={project.id} usage={usage} onRemove={() => removeYarn.mutate(usage.yarnId)} />
        ))}
      </div>

      {picking && (
        <div className="mt-2 flex flex-col gap-1.5">
          {candidates.length === 0 && (
            <p className="text-xs text-muted">{t("project:yarnList.noCandidates")}</p>
          )}
          {candidates.map((m) => (
            <button
              key={m.yarn.id}
              onClick={() => {
                addYarn.mutate({ yarnId: m.yarn.id });
                setPicking(false);
              }}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left text-sm"
            >
              <span>
                {m.yarn.brand} {m.yarn.lineName}
              </span>
              <span className="text-[11px] text-muted">
                {t("yarn:card.availableMeters", { meters: Math.round(m.yarn.availableM) })}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function UsageRow({
  projectId,
  usage,
  onRemove,
}: {
  projectId: string;
  usage: Project["yarnUsages"][number];
  onRemove: () => void;
}) {
  const { t } = useTranslation("project");
  const updateYarn = useUpdateProjectYarnMutation(projectId);
  const [reserved, setReserved] = useState(String(usage.reservedM));

  // availableM은 이 프로젝트의 예약분이 이미 빠진 값이라, 예약을 늘릴 수 있는 한도는 availableM + 지금 예약분이다
  const ceiling = usage.yarn.availableM + usage.reservedM;
  const overReserved = usage.reservedM > ceiling;

  function commit() {
    const value = Number(reserved);
    if (!Number.isFinite(value) || value < 0 || value === usage.reservedM) {
      setReserved(String(usage.reservedM));
      return;
    }
    updateYarn.mutate({ yarnId: usage.yarnId, reservedM: value });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-text">
            {usage.yarn.brand} {usage.yarn.lineName}
          </div>
          <div className="text-[11px] text-muted">
            {t("yarnList.colorAndOwned", {
              color: usage.yarn.colorName ?? t("yarnList.colorUnspecified"),
              meters: Math.round(usage.yarn.totalM),
            })}
          </div>
        </div>
        <button onClick={onRemove} aria-label={t("yarnList.removeAria")} className="cursor-pointer border-none bg-transparent p-0.5 text-muted">
          <X size={15} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[11px] text-muted">{usage.usedM == null ? t("yarnList.reserved") : t("yarnList.usedConfirmed")}</span>
        {usage.usedM == null ? (
          <>
            <input
              value={reserved}
              onChange={(e) => setReserved(e.target.value)}
              onBlur={commit}
              type="number"
              min={0}
              className="w-20 rounded-lg border border-border bg-card px-2 py-1 text-sm outline-none focus:border-accent"
            />
            <span className="text-[11px] text-muted">m</span>
          </>
        ) : (
          <span className="text-sm font-semibold text-text">{Math.round(usage.usedM)}m</span>
        )}
      </div>

      {overReserved && (
        <p className="mt-1.5 text-[11px] text-danger">
          {t("yarnList.overReserved", { ceiling: Math.round(ceiling) })}
        </p>
      )}
    </div>
  );
}
