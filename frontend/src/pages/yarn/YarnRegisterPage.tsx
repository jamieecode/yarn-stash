import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TopBar } from "../../components/layout/TopBar";
import { PhotoUploader } from "../../components/ui/PhotoUploader";
import { YarnCatalogAutocomplete } from "../../components/yarn/YarnCatalogAutocomplete";
import { useCreateYarnMutation } from "../../api/useYarns";
import { WEIGHT_CATEGORY_ORDER, type PhotoInput, type UnitSystem, type WeightCategory } from "../../types/api";
import { weightCategoryLabel } from "../../lib/enumLabels";

interface BatchFormRow {
  dyeLot: string;
  skeinCount: string;
  weightPerSkein: string;
  lengthPerSkein: string;
  purchasedAt: string;
}

const EMPTY_BATCH: BatchFormRow = { dyeLot: "", skeinCount: "", weightPerSkein: "", lengthPerSkein: "", purchasedAt: "" };

// 화면설계서 2번(실 등록)
export function YarnRegisterPage() {
  const { t } = useTranslation(["yarn", "enums"]);
  const navigate = useNavigate();
  const createYarn = useCreateYarnMutation();

  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogId, setCatalogId] = useState<string | undefined>(undefined);
  const [autoFilledFrom, setAutoFilledFrom] = useState<string | null>(null);

  const [brand, setBrand] = useState("");
  const [lineName, setLineName] = useState("");
  const [colorName, setColorName] = useState("");
  const [fiber, setFiber] = useState("");
  const [weightCategory, setWeightCategory] = useState<WeightCategory | "">("");
  const [needleSize, setNeedleSize] = useState("");
  const [gaugeStitches, setGaugeStitches] = useState("");
  const [memo, setMemo] = useState("");
  const [photos, setPhotos] = useState<PhotoInput[]>([]);

  const [unit, setUnit] = useState<UnitSystem>("METRIC");
  const [batches, setBatches] = useState<BatchFormRow[]>([{ ...EMPTY_BATCH }]);

  function handleCatalogSelect(catalog: { id: string; brand: string; lineName: string; fiber: string | null; weightCategory: WeightCategory | null; needleSize: string | null; gaugeStitches: number | null }) {
    setCatalogId(catalog.id);
    setBrand(catalog.brand);
    setLineName(catalog.lineName);
    setCatalogQuery(`${catalog.brand} ${catalog.lineName}`);
    if (catalog.fiber) setFiber(catalog.fiber);
    if (catalog.weightCategory) setWeightCategory(catalog.weightCategory);
    if (catalog.needleSize) setNeedleSize(catalog.needleSize);
    if (catalog.gaugeStitches != null) setGaugeStitches(String(catalog.gaugeStitches));
    setAutoFilledFrom(`${catalog.brand} ${catalog.lineName}`);
  }

  function handleCatalogQueryChange(q: string) {
    setCatalogQuery(q);
    setCatalogId(undefined);
    setAutoFilledFrom(null);
    setBrand(q);
  }

  function updateBatch(index: number, patch: Partial<BatchFormRow>) {
    setBatches((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function removeBatch(index: number) {
    setBatches((prev) => prev.filter((_, i) => i !== index));
  }

  const batchesValid = batches.every((b) => Number(b.skeinCount) >= 1 && Number(b.weightPerSkein) > 0 && Number(b.lengthPerSkein) > 0);
  const canSubmit = brand.trim().length > 0 && batchesValid;

  async function handleSubmit() {
    if (!canSubmit) return;
    const yarn = await createYarn.mutateAsync({
      catalogId,
      brand,
      lineName: lineName || undefined,
      colorName: colorName || undefined,
      fiber: fiber || undefined,
      weightCategory: weightCategory || undefined,
      needleSize: needleSize || undefined,
      gaugeStitches: gaugeStitches ? Number(gaugeStitches) : undefined,
      memo: memo || undefined,
      photos,
      batches: batches.map((b) => ({
        dyeLot: b.dyeLot || undefined,
        skeinCount: Number(b.skeinCount),
        weightPerSkeinG: Number(b.weightPerSkein),
        lengthPerSkeinM: Number(b.lengthPerSkein),
        inputUnit: unit,
        purchasedAt: b.purchasedAt || undefined,
      })),
    });
    navigate(`/yarns/${yarn.id}`, { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={t("yarn:register.title")} />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <section>
          <label className="mb-1.5 block text-xs font-semibold text-muted">{t("yarn:register.photoLabel")}</label>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </section>

        <section className="mt-5">
          <label className="mb-1.5 block text-xs font-semibold text-muted">{t("yarn:register.brandOrLineLabel")}</label>
          <YarnCatalogAutocomplete query={catalogQuery} onQueryChange={handleCatalogQueryChange} onSelect={handleCatalogSelect} />
          {autoFilledFrom && <p className="mt-1 text-xs text-sub">{t("yarn:register.autoFilledFrom", { source: autoFilledFrom })}</p>}
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2">
          <TextField label={t("yarn:register.lineNameLabel")} value={lineName} onChange={setLineName} />
          <TextField label={t("yarn:register.colorNameLabel")} value={colorName} onChange={setColorName} />
          <TextField label={t("yarn:register.fiberLabel")} value={fiber} onChange={setFiber} className="col-span-2" />
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("yarn:register.weightLabel")}</label>
            <select
              value={weightCategory}
              onChange={(e) => setWeightCategory(e.target.value as WeightCategory | "")}
              className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">{t("yarn:register.weightNotSelected")}</option>
              {WEIGHT_CATEGORY_ORDER.map((w) => (
                <option key={w} value={w}>
                  {weightCategoryLabel(t, w)}
                </option>
              ))}
            </select>
          </div>
          <TextField label={t("yarn:register.needleSizeLabel")} value={needleSize} onChange={setNeedleSize} />
          <TextField label={t("yarn:register.gaugeLabel")} value={gaugeStitches} onChange={setGaugeStitches} type="number" min={0} />
        </section>
        {!weightCategory && (
          <p className="mt-1.5 text-xs text-muted">{t("yarn:register.weightHint")}</p>
        )}

        <section className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted">{t("yarn:register.memoLabel")}</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder={t("yarn:register.memoPlaceholder")}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-muted">{t("yarn:register.stashLabel")}</label>
            <div className="flex overflow-hidden rounded-lg border border-border text-xs">
              <button
                onClick={() => setUnit("METRIC")}
                className={`cursor-pointer border-none px-2.5 py-1 ${unit === "METRIC" ? "bg-accent text-white" : "bg-card text-muted"}`}
              >
                {t("yarn:register.unitMetric")}
              </button>
              <button
                onClick={() => setUnit("IMPERIAL")}
                className={`cursor-pointer border-none px-2.5 py-1 ${unit === "IMPERIAL" ? "bg-accent text-white" : "bg-card text-muted"}`}
              >
                {t("yarn:register.unitImperial")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {batches.map((batch, index) => (
              <div key={index} className="rounded-xl border border-border bg-card p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={batch.dyeLot}
                    onChange={(e) => updateBatch(index, { dyeLot: e.target.value })}
                    placeholder={t("yarn:register.dyeLotPlaceholder")}
                    className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={batch.skeinCount}
                    onChange={(e) => updateBatch(index, { skeinCount: e.target.value })}
                    type="number"
                    min={1}
                    placeholder={t("yarn:register.skeinCountPlaceholder")}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={batch.purchasedAt}
                    onChange={(e) => updateBatch(index, { purchasedAt: e.target.value })}
                    type="date"
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={batch.weightPerSkein}
                    onChange={(e) => updateBatch(index, { weightPerSkein: e.target.value })}
                    type="number"
                    min={0}
                    placeholder={t("yarn:register.weightPerSkeinPlaceholder", { unit: unit === "METRIC" ? "g" : "oz" })}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={batch.lengthPerSkein}
                    onChange={(e) => updateBatch(index, { lengthPerSkein: e.target.value })}
                    type="number"
                    min={0}
                    placeholder={t("yarn:register.lengthPerSkeinPlaceholder", { unit: unit === "METRIC" ? "m" : "yd" })}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                {batches.length > 1 && (
                  <button
                    onClick={() => removeBatch(index)}
                    className="mt-2 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs text-danger"
                  >
                    <Trash2 size={12} /> {t("yarn:register.removeBatch")}
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setBatches((prev) => [...prev, { ...EMPTY_BATCH }])}
            className="mt-2 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-accent"
          >
            <Plus size={14} /> {t("yarn:register.addBatch")}
          </button>
          {!batchesValid && batches.some((b) => b.skeinCount || b.weightPerSkein || b.lengthPerSkein) && (
            <p className="mt-1.5 text-xs text-danger">{t("yarn:register.batchValidationError")}</p>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-bg p-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createYarn.isPending}
          className="w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {createYarn.isPending ? t("yarn:register.submitting") : t("yarn:register.submit")}
        </button>
        {createYarn.isError && <p className="mt-2 text-center text-xs text-danger">{t("yarn:register.submitError")}</p>}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  min,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        min={min}
        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
