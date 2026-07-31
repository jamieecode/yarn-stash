import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopBar } from "../../components/layout/TopBar";
import { PatternSearchAutocomplete } from "../../components/pattern/PatternSearchAutocomplete";
import { YarnCatalogAutocomplete } from "../../components/yarn/YarnCatalogAutocomplete";
import { useCreatePatternMutation, useRavelryPatternDetailQuery } from "../../api/usePatterns";
import { useAuth } from "../../auth/AuthContext";
import {
  CRAFT_TYPE_LABEL,
  CRAFT_TYPE_ORDER,
  WEIGHT_CATEGORY_LABEL,
  WEIGHT_CATEGORY_ORDER,
  type CraftType,
  type PatternSource,
  type UnitSystem,
  type WeightCategory,
} from "../../types/api";

// 화면설계서 5번(도안 등록)
export function PatternRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRavelryId = searchParams.get("ravelryId");
  const { isGuest } = useAuth();
  const createPattern = useCreatePatternMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [autoFilledFromRavelry, setAutoFilledFromRavelry] = useState(false);
  const [ravelryId, setRavelryId] = useState<number | undefined>(initialRavelryId ? Number(initialRavelryId) : undefined);

  const { data: ravelryDetail } = useRavelryPatternDetailQuery(initialRavelryId ? Number(initialRavelryId) : undefined);

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

  useEffect(() => {
    if (!ravelryDetail) return;
    setName(ravelryDetail.name);
    if (ravelryDetail.designer) setDesigner(ravelryDetail.designer);
    if (ravelryDetail.craftType) setCraftType(ravelryDetail.craftType);
    if (ravelryDetail.weightCategory) setWeightCategory(ravelryDetail.weightCategory);
    if (ravelryDetail.requiredMinM != null) setRequiredMin(String(ravelryDetail.requiredMinM));
    if (ravelryDetail.requiredMaxM != null) setRequiredMax(String(ravelryDetail.requiredMaxM));
    if (ravelryDetail.gaugeStitches != null) setGaugeStitches(String(ravelryDetail.gaugeStitches));
    if (ravelryDetail.sourceUrl) setSourceUrl(ravelryDetail.sourceUrl);
    setRequiredUnit("METRIC");
    setRavelryId(ravelryDetail.ravelryId);
    setAutoFilledFromRavelry(true);
  }, [ravelryDetail]);

  function handleSelectRavelryFromSearch(detail: {
    ravelryId: number;
    name: string;
    designer?: string;
    craftType?: CraftType;
    weightCategory?: WeightCategory;
    requiredMinM?: number;
    requiredMaxM?: number;
    gaugeStitches?: number;
    sourceUrl?: string;
  }) {
    setName(detail.name);
    if (detail.designer) setDesigner(detail.designer);
    if (detail.craftType) setCraftType(detail.craftType);
    if (detail.weightCategory) setWeightCategory(detail.weightCategory);
    if (detail.requiredMinM != null) setRequiredMin(String(detail.requiredMinM));
    if (detail.requiredMaxM != null) setRequiredMax(String(detail.requiredMaxM));
    if (detail.gaugeStitches != null) setGaugeStitches(String(detail.gaugeStitches));
    if (detail.sourceUrl) setSourceUrl(detail.sourceUrl);
    setRequiredUnit("METRIC");
    setRavelryId(detail.ravelryId);
    setAutoFilledFromRavelry(true);
  }

  const sourceType: PatternSource = ravelryId ? "RAVELRY" : sourceUrl ? "LINK" : "USER";
  const requiredMinValid = requiredMin.trim().length > 0 && Number(requiredMin) > 0;
  const requiredMaxValid = requiredMax.trim().length === 0 || (Number(requiredMax) > 0 && Number(requiredMax) >= Number(requiredMin));
  const canSubmit = name.trim().length > 0 && craftType !== "" && weightCategory !== "" && requiredMinValid && requiredMaxValid;

  async function handleSubmit() {
    if (!canSubmit) return;
    const pattern = await createPattern.mutateAsync({
      name,
      designer: designer || undefined,
      craftType,
      weightCategory,
      requiredMinM: Number(requiredMin),
      requiredMaxM: requiredMax ? Number(requiredMax) : undefined,
      requiredUnit,
      gaugeStitches: gaugeStitches ? Number(gaugeStitches) : undefined,
      sourceUrl: sourceUrl || undefined,
      sourceType,
      ravelryId,
      originalYarnCatalogId,
      originalYarnBrand: originalYarnBrand || undefined,
      originalYarnLine: originalYarnLine || undefined,
    });
    navigate(`/patterns/${pattern.id}`, { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="도안 등록" />
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {!initialRavelryId && (
          <section>
            <PatternSearchAutocomplete
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSelectLocal={(patternId) => navigate(`/patterns/${patternId}`, { replace: true })}
              onSelectRavelry={handleSelectRavelryFromSearch}
            />
          </section>
        )}
        {autoFilledFromRavelry && <p className="mt-1.5 text-xs text-sub">Ravelry에서 자동 입력됨</p>}

        {isGuest ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-text">도안 등록은 로그인 후 이용할 수 있어요</p>
            <button
              onClick={() => navigate("/my")}
              className="mt-3 cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              로그인하러 가기
            </button>
          </div>
        ) : (
          <>
            <section className="mt-5 flex flex-col gap-2">
              <TextField label="도안명" value={name} onChange={setName} />
              <TextField label="작가 (선택)" value={designer} onChange={setDesigner} />

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">도구 종류</label>
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
                <label className="mb-1 block text-xs font-semibold text-muted">무게 카테고리</label>
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
                  <input
                    value={requiredMin}
                    onChange={(e) => setRequiredMin(e.target.value)}
                    type="number"
                    min={0}
                    placeholder="최소값"
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={requiredMax}
                    onChange={(e) => setRequiredMax(e.target.value)}
                    type="number"
                    min={0}
                    placeholder="최대값 (선택)"
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                {requiredMin.trim().length > 0 && !requiredMinValid && (
                  <p className="mt-1.5 text-xs text-danger">최소값은 0보다 커야 해요</p>
                )}
                {requiredMinValid && !requiredMaxValid && (
                  <p className="mt-1.5 text-xs text-danger">최대값은 최소값보다 크거나 같아야 해요</p>
                )}
              </div>

              <TextField label="게이지 (콧수/10cm, 선택)" value={gaugeStitches} onChange={setGaugeStitches} type="number" min={0} />
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
          </>
        )}
      </div>

      {!isGuest && (
        <div className="sticky bottom-0 border-t border-border bg-bg p-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || createPattern.isPending}
            className="w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {createPattern.isPending ? "등록 중..." : "등록하기"}
          </button>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
}) {
  return (
    <div>
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
