import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "../../types/api";

// 프로젝트를 완료할 때 "실제로 얼마나 썼는지"를 확정받는 모달.
// 여기서 확정한 값이 그대로 재고에서 빠지므로, 예약량을 기본값으로 채워두고 다르면 고치게 한다.
// 확정을 건너뛰면 예약량을 그대로 쓴 것으로 간주된다 (백엔드 committedMeters의 fallback과 동일)
export function CompleteProjectModal({
  project,
  onConfirm,
  onCancel,
}: {
  project: Project;
  onConfirm: (usages: { yarnId: string; usedM: number }[]) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation(["project", "common"]);
  const pending = project.yarnUsages.filter((u) => u.usedM == null);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(pending.map((u) => [u.yarnId, String(u.reservedM)])),
  );

  function handleConfirm() {
    const usages = pending
      .map((u) => ({ yarnId: u.yarnId, usedM: Number(values[u.yarnId]) }))
      .filter((u) => Number.isFinite(u.usedM) && u.usedM >= 0);
    onConfirm(usages);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" onClick={onCancel}>
      <div className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-text">{t("project:completeModal.title")}</p>
        <p className="mt-2 text-xs text-muted">{t("project:completeModal.description")}</p>

        <div className="mt-4 flex flex-col gap-2.5">
          {pending.map((usage) => (
            <div key={usage.id}>
              <div className="mb-1 truncate text-xs font-medium text-text">
                {usage.yarn.brand} {usage.yarn.lineName}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  value={values[usage.yarnId] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [usage.yarnId]: e.target.value }))}
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">m</span>
              </div>
              <p className="mt-1 text-[11px] text-sub">
                {t("project:completeModal.summary", {
                  total: Math.round(usage.yarn.totalM),
                  reserved: Math.round(usage.reservedM),
                })}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-text"
          >
            {t("common:action.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 cursor-pointer rounded-lg border-none bg-accent py-2.5 text-sm font-semibold text-white"
          >
            {t("project:completeModal.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
