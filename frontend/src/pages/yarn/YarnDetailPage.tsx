import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { WeightBadge } from "../../components/ui/WeightBadge";
import { MatchTierChip } from "../../components/ui/MatchTierChip";
import { GaugeChipDisplay } from "../../components/ui/GaugeChipDisplay";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { EmptyState } from "../../components/ui/EmptyState";
import { BatchRow } from "../../components/yarn/BatchRow";
import {
  useAddBatchMutation,
  useDeleteYarnMutation,
  useUpdateYarnMutation,
  useYarnPatternMatchesQuery,
  useYarnQuery,
} from "../../api/useYarns";
import type { UnitSystem } from "../../types/api";

type Tab = "stash" | "matches";

// 화면설계서 3번(실 상세)
export function YarnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stash");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [addingBatch, setAddingBatch] = useState(false);

  const { data: yarn, isLoading } = useYarnQuery(id);
  const updateYarn = useUpdateYarnMutation(id ?? "");
  const deleteYarn = useDeleteYarnMutation();

  const matchesEnabled = tab === "matches" && Boolean(yarn) && !yarn!.consumed && Boolean(yarn!.weightCategory);
  const { data: matches, isLoading: matchesLoading } = useYarnPatternMatchesQuery(id, matchesEnabled);

  if (isLoading || !yarn) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="실 상세" />
        <p className="p-6 text-center text-sm text-muted">불러오는 중...</p>
      </div>
    );
  }

  async function handleToggleConsumed() {
    await updateYarn.mutateAsync({ consumed: !yarn!.consumed });
  }

  async function handleDelete() {
    await deleteYarn.mutateAsync(yarn!.id);
    navigate("/yarns", { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={`${yarn.brand} ${yarn.lineName ?? ""}`.trim()}
        right={
          <div className="flex gap-1">
            <button onClick={() => navigate(`/yarns/${yarn.id}/edit`)} aria-label="수정" className="cursor-pointer border-none bg-transparent p-1 text-text">
              <Pencil size={18} />
            </button>
            <button onClick={() => setConfirmingDelete(true)} aria-label="삭제" className="cursor-pointer border-none bg-transparent p-1 text-danger">
              <Trash2 size={18} />
            </button>
          </div>
        }
      />

      <div className="p-4">
        {yarn.photos.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {yarn.photos.map((photo) => (
              <img key={photo.id} src={photo.url} alt="" className="h-32 w-32 shrink-0 rounded-xl object-cover" />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <WeightBadge weight={yarn.weightCategory} />
          {yarn.colorName && <span className="text-sm text-muted">{yarn.colorName}</span>}
          {yarn.fiber && <span className="text-sm text-muted">· {yarn.fiber}</span>}
        </div>
        {yarn.memo && <p className="mt-2 text-sm text-muted">{yarn.memo}</p>}

        <label className="mt-3 flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={yarn.consumed} onChange={handleToggleConsumed} />
          다 썼어요 (소진 처리)
        </label>
      </div>

      <div className="flex border-b border-border">
        <TabButton active={tab === "stash"} onClick={() => setTab("stash")} label="보유 현황" />
        <TabButton active={tab === "matches"} onClick={() => setTab("matches")} label="이 실로 뜰 수 있는 도안" />
      </div>

      {tab === "stash" && (
        <div className="p-4">
          <div className="mb-3 rounded-xl bg-card p-3 text-sm text-muted">
            총 {yarn.batches.reduce((s, b) => s + b.skeinCount, 0)}타래 · {yarn.batches.reduce((s, b) => s + b.skeinCount * b.weightPerSkeinG, 0)}g ·{" "}
            {Math.round(yarn.totalM)}m
            {yarn.committedM > 0 && (
              <div className="mt-1.5 border-t border-border pt-1.5 text-xs">
                프로젝트 사용 {Math.round(yarn.committedM)}m ·{" "}
                <span className="font-semibold text-text">쓸 수 있는 양 {Math.round(yarn.availableM)}m</span>
              </div>
            )}
          </div>
          {yarn.usages && yarn.usages.length > 0 && (
            <div className="mb-3 flex flex-col gap-1">
              {yarn.usages.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs">
                  <span className="truncate text-muted">{u.project.pattern.name}</span>
                  <span className="shrink-0 text-sub">
                    {Math.round(u.usedM ?? u.reservedM)}m {u.usedM == null ? "예약" : "사용"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {yarn.batches.map((batch) => (
              <BatchRow key={batch.id} yarnId={yarn.id} batch={batch} />
            ))}
          </div>
          {addingBatch ? (
            <AddBatchForm yarnId={yarn.id} onDone={() => setAddingBatch(false)} />
          ) : (
            <button
              onClick={() => setAddingBatch(true)}
              className="mt-3 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-sm font-semibold text-accent"
            >
              <Plus size={16} /> 배치 추가
            </button>
          )}
        </div>
      )}

      {tab === "matches" && (
        <div className="p-4">
          {!yarn.weightCategory && (
            <EmptyState message="굵기를 입력하면 추천받을 수 있어요" />
          )}
          {yarn.consumed && yarn.weightCategory && (
            <EmptyState message="소진 처리된 실이라 도안 추천이 표시되지 않아요" />
          )}
          {matchesEnabled && matchesLoading && <p className="py-10 text-center text-sm text-muted">불러오는 중...</p>}
          {matchesEnabled && matches && matches.length === 0 && (
            <EmptyState message="같은 굵기의 도안을 찾지 못했어요, 로컬 DB에 등록된 도안이 아직 적어서일 수 있어요" />
          )}
          {matchesEnabled && matches && matches.length > 0 && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => (
                <button
                  key={m.pattern.id}
                  onClick={() => navigate(`/patterns/${m.pattern.id}`)}
                  className="cursor-pointer rounded-xl border border-border bg-card p-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">{m.pattern.name}</span>
                    <MatchTierChip label={m.label} />
                  </div>
                  {m.pattern.designer && <div className="mt-0.5 text-xs text-muted">{m.pattern.designer}</div>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span>
                      {m.pattern.requiredMaxM && m.pattern.requiredMaxM > m.pattern.requiredMinM
                        ? `${m.pattern.requiredMinM}~${m.pattern.requiredMaxM}m 필요`
                        : `${m.pattern.requiredMinM}m 필요`}
                    </span>
                    <GaugeChipDisplay chip={m.gaugeChip} />
                  </div>
                  {m.needsLotMixing && <p className="mt-1 text-xs text-warn">로트를 섞어야 해요</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {confirmingDelete && (
        <ConfirmModal
          title="실을 삭제할까요?"
          description="삭제하면 되돌릴 수 없어요. 배치·사진도 함께 삭제돼요"
          danger
          confirmLabel="삭제"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 cursor-pointer border-none bg-transparent py-2.5 text-sm ${
        active ? "border-b-2 border-accent font-semibold text-accent" : "text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function AddBatchForm({ yarnId, onDone }: { yarnId: string; onDone: () => void }) {
  const addBatch = useAddBatchMutation(yarnId);
  const [dyeLot, setDyeLot] = useState("");
  const [skeinCount, setSkeinCount] = useState("");
  const [weightPerSkein, setWeightPerSkein] = useState("");
  const [lengthPerSkein, setLengthPerSkein] = useState("");
  const [unit, setUnit] = useState<UnitSystem>("METRIC");

  async function handleSubmit() {
    if (!skeinCount || !weightPerSkein || !lengthPerSkein) return;
    await addBatch.mutateAsync({
      dyeLot: dyeLot || undefined,
      skeinCount: Number(skeinCount),
      weightPerSkeinG: Number(weightPerSkein),
      lengthPerSkeinM: Number(lengthPerSkein),
      inputUnit: unit,
    });
    onDone();
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex overflow-hidden rounded-lg border border-border text-xs w-fit">
        <button onClick={() => setUnit("METRIC")} className={`cursor-pointer border-none px-2.5 py-1 ${unit === "METRIC" ? "bg-accent text-white" : "bg-card text-muted"}`}>
          g·m
        </button>
        <button onClick={() => setUnit("IMPERIAL")} className={`cursor-pointer border-none px-2.5 py-1 ${unit === "IMPERIAL" ? "bg-accent text-white" : "bg-card text-muted"}`}>
          oz·yd
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={dyeLot} onChange={(e) => setDyeLot(e.target.value)} placeholder="염색로트 (선택)" className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
        <input value={skeinCount} onChange={(e) => setSkeinCount(e.target.value)} type="number" placeholder="타래 수" className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
        <input value={weightPerSkein} onChange={(e) => setWeightPerSkein(e.target.value)} type="number" placeholder={`타래당 무게 (${unit === "METRIC" ? "g" : "oz"})`} className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
        <input value={lengthPerSkein} onChange={(e) => setLengthPerSkein(e.target.value)} type="number" placeholder={`타래당 길이 (${unit === "METRIC" ? "m" : "yd"})`} className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={onDone} className="flex-1 cursor-pointer rounded-lg border border-border bg-card py-2 text-sm font-medium text-text">
          취소
        </button>
        <button onClick={handleSubmit} disabled={addBatch.isPending} className="flex-1 cursor-pointer rounded-lg border-none bg-accent py-2 text-sm font-semibold text-white disabled:opacity-50">
          추가
        </button>
      </div>
    </div>
  );
}
