import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "../../components/layout/TopBar";
import { YarnCatalogAutocomplete } from "../../components/yarn/YarnCatalogAutocomplete";
import { usePatternQuery, useUpdatePatternMutation } from "../../api/usePatterns";
import {
  CRAFT_TYPE_LABEL,
  CRAFT_TYPE_ORDER,
  WEIGHT_CATEGORY_LABEL,
  WEIGHT_CATEGORY_ORDER,
  type CraftType,
  type UnitSystem,
  type WeightCategory,
} from "../../types/api";

// 화면설계서 6-1(도안 수정) - 검색 UI 없이 필드 직접 수정, ravelryId/sourceType은 변경하지 않음
export function PatternEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pattern } = usePatternQuery(id);
  const updatePattern = useUpdatePatternMutation(id ?? "");

  const [name, setName] = useState("");
  const [designer, setDesigner] = useState("");
  const [craftType, setCraftType] = useState<CraftType | "">("");
  const [weightCategory, setWeightCategory] = useState<WeightCategory | "">("");
  const [requiredUnit, setRequiredUnit] = useState<UnitSystem>("METRIC");
  const [requiredMin, setRequiredMin] = useState("");
  const [requiredMax, setRequiredMax] = useState("");
  const [gaugeStitches, setGaugeStitches] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [yarnQuery, setYarnQuery] = useState("");
  const [originalYarnCatalogId, setOriginalYarnCatalogId] = useState<string | undefined>(undefined);
  const [originalYarnBrand, setOriginalYarnBrand] = useState("");
  const [originalYarnLine, setOriginalYarnLine] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!pattern || initialized) return;
    setName(pattern.name);
    setDesigner(pattern.designer ?? "");
    setCraftType(pattern.craftType);
    setWeightCategory(pattern.weightCategory);
    setRequiredUnit(pattern.requiredUnit ?? "METRIC");
    setRequiredMin(String(pattern.requiredMinM));
    setRequiredMax(pattern.requiredMaxM != null ? String(pattern.requiredMaxM) : "");
    setGaugeStitches(pattern.gaugeStitches != null ? String(pattern.gaugeStitches) : "");
    setSourceUrl(pattern.sourceUrl ?? "");
    setOriginalYarnBrand(pattern.originalYarnBrand ?? "");
    setOriginalYarnLine(pattern.originalYarnLine ?? "");
    setOriginalYarnCatalogId(pattern.originalYarnCatalogId ?? undefined);
    setYarnQuery([pattern.originalYarnBrand, pattern.originalYarnLine].filter(Boolean).join(" "));
    setInitialized(true);
  }, [pattern, initialized]);

  if (!pattern) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="도안 수정" />
        <p className="p-6 text-center text-sm text-muted">불러오는 중...</p>
      </div>
    );
  }

  const canSubmit = name.trim().length > 0 && craftType !== "" && weightCategory !== "" && requiredMin.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    await updatePattern.mutateAsync({
      name,
      designer: designer || undefined,
      craftType,
      weightCategory,
      requiredMinM: Number(requiredMin),
      requiredMaxM: requiredMax ? Number(requiredMax) : undefined,
      requiredUnit,
      gaugeStitches: gaugeStitches ? Number(gaugeStitches) : undefined,
      sourceUrl: sourceUrl || undefined,
      originalYarnCatalogId,
      originalYarnBrand: originalYarnBrand || undefined,
      originalYarnLine: originalYarnLine || undefined,
    });
    navigate(`/patterns/${id}`, { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="도안 수정" />
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <section className="flex flex-col gap-2">
          <TextField label="도안명" value={name} onChange={setName} />
          <TextField label="작가 (선택)" value={designer} onChange={setDesigner} />

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">뜨개 방법</label>
            <select
              value={craftType}
              onChange={(e) => setCraftType(e.target.value as CraftType | "")}
              className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">선택해주세요</option>
              {CRAFT_TYPE_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CRAFT_TYPE_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">굵기</label>
            <select
              value={weightCategory}
              onChange={(e) => setWeightCategory(e.target.value as WeightCategory | "")}
              className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">선택해주세요</option>
              {WEIGHT_CATEGORY_ORDER.map((w) => (
                <option key={w} value={w}>
                  {WEIGHT_CATEGORY_LABEL[w]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-muted">필요량</label>
              <div className="flex overflow-hidden rounded-lg border border-border text-xs">
                <button onClick={() => setRequiredUnit("METRIC")} className={`cursor-pointer border-none px-2.5 py-1 ${requiredUnit === "METRIC" ? "bg-accent text-white" : "bg-card text-muted"}`}>
                  m
                </button>
                <button onClick={() => setRequiredUnit("IMPERIAL")} className={`cursor-pointer border-none px-2.5 py-1 ${requiredUnit === "IMPERIAL" ? "bg-accent text-white" : "bg-card text-muted"}`}>
                  yd
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={requiredMin} onChange={(e) => setRequiredMin(e.target.value)} type="number" placeholder="최소값" className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
              <input value={requiredMax} onChange={(e) => setRequiredMax(e.target.value)} type="number" placeholder="최대값 (선택)" className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
            </div>
          </div>

          <TextField label="게이지 (콧수/10cm, 선택)" value={gaugeStitches} onChange={setGaugeStitches} type="number" />
          <TextField label="참고 링크 (선택)" value={sourceUrl} onChange={setSourceUrl} />

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">원본 실 (선택)</label>
            <YarnCatalogAutocomplete
              query={yarnQuery}
              onQueryChange={(q) => {
                setYarnQuery(q);
                setOriginalYarnCatalogId(undefined);
                setOriginalYarnBrand(q);
              }}
              onSelect={(catalog) => {
                setOriginalYarnCatalogId(catalog.id);
                setOriginalYarnBrand(catalog.brand);
                setOriginalYarnLine(catalog.lineName);
                setYarnQuery(`${catalog.brand} ${catalog.lineName}`);
              }}
            />
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-bg p-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || updatePattern.isPending}
          className="w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {updatePattern.isPending ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}
