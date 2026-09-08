import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRemoveBatchMutation, useUpdateBatchMutation } from "../../api/useYarns";
import { displayLength, displayWeight } from "../../lib/units";
import { ConfirmModal } from "../ui/ConfirmModal";
import type { YarnBatch } from "../../types/api";

// 화면설계서 3번 "배치 카드 탭 시 인라인 수정 모드" - 배치별 로트/수량/무게/길이 인라인 수정 + 삭제
export function BatchRow({ yarnId, batch }: { yarnId: string; batch: YarnBatch }) {
  const { t, i18n } = useTranslation(["yarn", "common"]);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateBatch = useUpdateBatchMutation(yarnId);
  const removeBatch = useRemoveBatchMutation(yarnId);

  const dispWeight = displayWeight(batch.weightPerSkeinG, batch.inputUnit);
  const dispLength = displayLength(batch.lengthPerSkeinM, batch.inputUnit);

  const [dyeLot, setDyeLot] = useState(batch.dyeLot ?? "");
  const [skeinCount, setSkeinCount] = useState(String(batch.skeinCount));
  const [weightPerSkein, setWeightPerSkein] = useState(String(dispWeight.value));
  const [lengthPerSkein, setLengthPerSkein] = useState(String(dispLength.value));

  async function handleSave() {
    await updateBatch.mutateAsync({
      batchId: batch.id,
      dto: {
        dyeLot: dyeLot || undefined,
        skeinCount: Number(skeinCount),
        weightPerSkeinG: Number(weightPerSkein),
        lengthPerSkeinM: Number(lengthPerSkein),
        inputUnit: batch.inputUnit,
      },
    });
    setEditing(false);
  }

  async function handleDelete() {
    await removeBatch.mutateAsync(batch.id);
    setConfirmingDelete(false);
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={dyeLot}
            onChange={(e) => setDyeLot(e.target.value)}
            placeholder={t("yarn:batch.dyeLotPlaceholder")}
            className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={skeinCount}
            onChange={(e) => setSkeinCount(e.target.value)}
            type="number"
            placeholder={t("yarn:batch.skeinCountPlaceholder")}
            className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={weightPerSkein}
            onChange={(e) => setWeightPerSkein(e.target.value)}
            type="number"
            placeholder={t("yarn:batch.weightPlaceholder", { unit: dispWeight.label })}
            className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={lengthPerSkein}
            onChange={(e) => setLengthPerSkein(e.target.value)}
            type="number"
            placeholder={t("yarn:batch.lengthPlaceholder", { unit: dispLength.label })}
            className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 cursor-pointer rounded-lg border border-border bg-card py-2 text-sm font-medium text-text"
          >
            {t("common:action.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={updateBatch.isPending}
            className="flex-1 cursor-pointer rounded-lg border-none bg-accent py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("common:action.confirm")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <button type="button" onClick={() => setEditing(true)} className="flex-1 cursor-pointer text-left">
        <div className="text-sm font-semibold text-text">{batch.dyeLot ?? t("yarn:batch.noLot")}</div>
        <div className="mt-0.5 text-xs text-muted">
          {t("yarn:batch.summary", {
            count: batch.skeinCount,
            weight: `${dispWeight.value}${dispWeight.label}`,
            length: `${dispLength.value}${dispLength.label}`,
          })}
          {batch.purchasedAt && ` · ${new Date(batch.purchasedAt).toLocaleDateString(i18n.language)}`}
        </div>
      </button>
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label={t("yarn:batch.deleteAria")}
        className="cursor-pointer border-none bg-transparent p-1.5 text-muted"
      >
        <Trash2 size={16} />
      </button>
      {confirmingDelete && (
        <ConfirmModal
          title={t("yarn:batch.deleteConfirmTitle")}
          description={t("yarn:batch.deleteConfirmDesc")}
          danger
          confirmLabel={t("common:action.delete")}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
