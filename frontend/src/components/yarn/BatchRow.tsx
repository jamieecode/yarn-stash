import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRemoveBatchMutation, useUpdateBatchMutation } from "../../api/useYarns";
import { displayLength, displayWeight } from "../../lib/units";
import { ConfirmModal } from "../ui/ConfirmModal";
import type { YarnBatch } from "../../types/api";

// 화면설계서 3번 "배치 카드 탭 시 인라인 수정 모드" - 배치별 로트/수량/무게/길이 인라인 수정 + 삭제
export function BatchRow({ yarnId, batch }: { yarnId: string; batch: YarnBatch }) {
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
            placeholder="염색로트 (선택)"
            className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={skeinCount}
            onChange={(e) => setSkeinCount(e.target.value)}
            type="number"
            placeholder="타래 수"
            className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={weightPerSkein}
            onChange={(e) => setWeightPerSkein(e.target.value)}
            type="number"
            placeholder={`타래당 무게 (${dispWeight.label})`}
            className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={lengthPerSkein}
            onChange={(e) => setLengthPerSkein(e.target.value)}
            type="number"
            placeholder={`타래당 길이 (${dispLength.label})`}
            className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 cursor-pointer rounded-lg border border-border bg-card py-2 text-sm font-medium text-text"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={updateBatch.isPending}
            className="flex-1 cursor-pointer rounded-lg border-none bg-accent py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <button type="button" onClick={() => setEditing(true)} className="flex-1 cursor-pointer text-left">
        <div className="text-sm font-semibold text-text">{batch.dyeLot ?? "로트 구분 없음"}</div>
        <div className="mt-0.5 text-xs text-muted">
          {batch.skeinCount}타래 · 타래당 {dispWeight.value}{dispWeight.label} · {dispLength.value}{dispLength.label}
          {batch.purchasedAt && ` · ${new Date(batch.purchasedAt).toLocaleDateString()}`}
        </div>
      </button>
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label="배치 삭제"
        className="cursor-pointer border-none bg-transparent p-1.5 text-muted"
      >
        <Trash2 size={16} />
      </button>
      {confirmingDelete && (
        <ConfirmModal
          title="이 배치를 삭제할까요?"
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
