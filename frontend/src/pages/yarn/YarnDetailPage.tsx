import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["yarn", "common"]);
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
        <TopBar title={t("yarn:detail.title")} />
        <p className="p-6 text-center text-sm text-muted">{t("common:loading")}</p>
      </div>
    );
  }

  const totalSkeinCount = yarn.batches.reduce((s, b) => s + b.skeinCount, 0);

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
            <button onClick={() => navigate(`/yarns/${yarn.id}/edit`)} aria-label={t("yarn:detail.editAria")} className="cursor-pointer border-none bg-transparent p-1 text-text">
              <Pencil size={18} />
            </button>
            <button onClick={() => setConfirmingDelete(true)} aria-label={t("yarn:detail.deleteAria")} className="cursor-pointer border-none bg-transparent p-1 text-danger">
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
          {t("yarn:detail.consumedToggle")}
        </label>
      </div>

      <div className="flex border-b border-border">
        <TabButton active={tab === "stash"} onClick={() => setTab("stash")} label={t("yarn:detail.tabStash")} />
        <TabButton active={tab === "matches"} onClick={() => setTab("matches")} label={t("yarn:detail.tabMatches")} />
      </div>

      {tab === "stash" && (
        <div className="p-4">
          <div className="mb-3 rounded-xl bg-card p-3 text-sm text-muted">
            {t("yarn:detail.stockSummary", {
              count: totalSkeinCount,
              skeins: totalSkeinCount,
              grams: yarn.batches.reduce((s, b) => s + b.skeinCount * b.weightPerSkeinG, 0),
              meters: Math.round(yarn.totalM),
            })}
            {yarn.committedM > 0 && (
              <div className="mt-1.5 border-t border-border pt-1.5 text-xs">
                {t("yarn:detail.committedSummary", {
                  committed: Math.round(yarn.committedM),
                  available: Math.round(yarn.availableM),
                })}
              </div>
            )}
          </div>
          {yarn.usages && yarn.usages.length > 0 && (
            <div className="mb-3 flex flex-col gap-1">
              {yarn.usages.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs">
                  <span className="truncate text-muted">{u.project.pattern.name}</span>
                  <span className="shrink-0 text-sub">
                    {u.usedM == null
                      ? t("yarn:detail.usageReserved", { meters: Math.round(u.reservedM) })
                      : t("yarn:detail.usageUsed", { meters: Math.round(u.usedM) })}
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
              <Plus size={16} /> {t("yarn:detail.addBatch")}
            </button>
          )}
        </div>
      )}

      {tab === "matches" && (
        <div className="p-4">
          {!yarn.weightCategory && (
            <EmptyState message={t("yarn:detail.weightHint")} />
          )}
          {yarn.consumed && yarn.weightCategory && (
            <EmptyState message={t("yarn:detail.consumedNoMatches")} />
          )}
          {matchesEnabled && matchesLoading && <p className="py-10 text-center text-sm text-muted">{t("common:loading")}</p>}
          {matchesEnabled && matches && matches.length === 0 && (
            <EmptyState message={t("yarn:detail.matchesEmpty")} />
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
                        ? t("yarn:detail.matchRequiredRange", { min: m.pattern.requiredMinM, max: m.pattern.requiredMaxM })
                        : t("yarn:detail.matchRequiredMin", { min: m.pattern.requiredMinM })}
                    </span>
                    <GaugeChipDisplay chip={m.gaugeChip} />
                  </div>
                  {m.needsLotMixing && <p className="mt-1 text-xs text-warn">{t("yarn:detail.needsLotMixing")}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {confirmingDelete && (
        <ConfirmModal
          title={t("yarn:detail.deleteConfirmTitle")}
          description={t("yarn:detail.deleteConfirmDesc")}
          danger
          confirmLabel={t("common:action.delete")}
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
  const { t } = useTranslation(["yarn", "common"]);
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
        <input value={dyeLot} onChange={(e) => setDyeLot(e.target.value)} placeholder={t("yarn:addBatch.dyeLotPlaceholder")} className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
        <input value={skeinCount} onChange={(e) => setSkeinCount(e.target.value)} type="number" placeholder={t("yarn:addBatch.skeinCountPlaceholder")} className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
        <input value={weightPerSkein} onChange={(e) => setWeightPerSkein(e.target.value)} type="number" placeholder={t("yarn:addBatch.weightPlaceholder", { unit: unit === "METRIC" ? "g" : "oz" })} className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
        <input value={lengthPerSkein} onChange={(e) => setLengthPerSkein(e.target.value)} type="number" placeholder={t("yarn:addBatch.lengthPlaceholder", { unit: unit === "METRIC" ? "m" : "yd" })} className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={onDone} className="flex-1 cursor-pointer rounded-lg border border-border bg-card py-2 text-sm font-medium text-text">
          {t("common:action.cancel")}
        </button>
        <button onClick={handleSubmit} disabled={addBatch.isPending} className="flex-1 cursor-pointer rounded-lg border-none bg-accent py-2 text-sm font-semibold text-white disabled:opacity-50">
          {t("yarn:addBatch.submit")}
        </button>
      </div>
    </div>
  );
}
