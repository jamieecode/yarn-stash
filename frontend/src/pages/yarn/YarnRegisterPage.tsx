import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../../components/layout/TopBar";
import { PhotoUploader } from "../../components/ui/PhotoUploader";
import { YarnCatalogAutocomplete } from "../../components/yarn/YarnCatalogAutocomplete";
import { useCreateYarnMutation } from "../../api/useYarns";
import { WEIGHT_CATEGORY_LABEL, WEIGHT_CATEGORY_ORDER, type PhotoInput, type UnitSystem, type WeightCategory } from "../../types/api";

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
      <TopBar title="실 등록" />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <section>
          <label className="mb-1.5 block text-xs font-semibold text-muted">사진</label>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </section>

        <section className="mt-5">
          <label className="mb-1.5 block text-xs font-semibold text-muted">브랜드 또는 라인명</label>
          <YarnCatalogAutocomplete query={catalogQuery} onQueryChange={handleCatalogQueryChange} onSelect={handleCatalogSelect} />
          {autoFilledFrom && <p className="mt-1 text-xs text-sub">{autoFilledFrom}에서 자동 입력됨</p>}
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2">
          <TextField label="라인명" value={lineName} onChange={setLineName} />
          <TextField label="색상명" value={colorName} onChange={setColorName} />
          <TextField label="소재" value={fiber} onChange={setFiber} className="col-span-2" />
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">굵기</label>
            <select
              value={weightCategory}
              onChange={(e) => setWeightCategory(e.target.value as WeightCategory | "")}
              className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">선택 안 함</option>
              {WEIGHT_CATEGORY_ORDER.map((w) => (
                <option key={w} value={w}>
                  {WEIGHT_CATEGORY_LABEL[w]}
                </option>
              ))}
            </select>
          </div>
          <TextField label="추천 바늘 사이즈" value={needleSize} onChange={setNeedleSize} />
          <TextField label="게이지 (콧수/10cm)" value={gaugeStitches} onChange={setGaugeStitches} type="number" min={0} />
        </section>
        {!weightCategory && (
          <p className="mt-1.5 text-xs text-muted">굵기를 입력하면 도안 추천을 받을 수 있어요</p>
        )}

        <section className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted">메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder="예: 선물로 받음, 세일 때 구매"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-muted">보유 기록</label>
            <div className="flex overflow-hidden rounded-lg border border-border text-xs">
              <button
                onClick={() => setUnit("METRIC")}
                className={`cursor-pointer border-none px-2.5 py-1 ${unit === "METRIC" ? "bg-accent text-white" : "bg-card text-muted"}`}
              >
                g·m
              </button>
              <button
                onClick={() => setUnit("IMPERIAL")}
                className={`cursor-pointer border-none px-2.5 py-1 ${unit === "IMPERIAL" ? "bg-accent text-white" : "bg-card text-muted"}`}
              >
                oz·yd
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
                    placeholder="염색로트 (선택)"
                    className="col-span-2 rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={batch.skeinCount}
                    onChange={(e) => updateBatch(index, { skeinCount: e.target.value })}
                    type="number"
                    min={1}
                    placeholder="보유 타래 수"
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
                    placeholder={`타래당 무게 (${unit === "METRIC" ? "g" : "oz"})`}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={batch.lengthPerSkein}
                    onChange={(e) => updateBatch(index, { lengthPerSkein: e.target.value })}
                    type="number"
                    min={0}
                    placeholder={`타래당 길이 (${unit === "METRIC" ? "m" : "yd"})`}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                {batches.length > 1 && (
                  <button
                    onClick={() => removeBatch(index)}
                    className="mt-2 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs text-danger"
                  >
                    <Trash2 size={12} /> 이 배치 제거
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setBatches((prev) => [...prev, { ...EMPTY_BATCH }])}
            className="mt-2 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-accent"
          >
            <Plus size={14} /> 다른 배치 추가
          </button>
          {!batchesValid && batches.some((b) => b.skeinCount || b.weightPerSkein || b.lengthPerSkein) && (
            <p className="mt-1.5 text-xs text-danger">보유 타래 수는 1개 이상, 무게·길이는 0보다 커야 해요</p>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-bg p-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createYarn.isPending}
          className="w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {createYarn.isPending ? "등록 중..." : "등록하기"}
        </button>
        {createYarn.isError && <p className="mt-2 text-center text-xs text-danger">등록에 실패했어요. 다시 시도해주세요</p>}
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
