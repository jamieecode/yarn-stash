import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TopBar } from "../../components/layout/TopBar";
import { PatternSearchAutocomplete } from "../../components/pattern/PatternSearchAutocomplete";
import { YarnCatalogAutocomplete } from "../../components/yarn/YarnCatalogAutocomplete";
import { useCreatePatternMutation, useRavelryPatternDetailQuery } from "../../api/usePatterns";
import { useAuth } from "../../auth/AuthContext";
import {
  CRAFT_TYPE_ORDER,
  WEIGHT_CATEGORY_ORDER,
  type CraftType,
  type PatternSource,
  type UnitSystem,
  type WeightCategory,
} from "../../types/api";
import { craftTypeLabel, weightCategoryLabel } from "../../lib/enumLabels";

// 화면설계서 5번(도안 등록)
export function PatternRegisterPage() {
  const { t } = useTranslation(["pattern", "enums"]);
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
      <TopBar title={t("pattern:register.title")} />
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
        {autoFilledFromRavelry && <p className="mt-1.5 text-xs text-sub">{t("pattern:register.autoFilledFromRavelry")}</p>}

        {isGuest ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-text">{t("pattern:register.guestNotice")}</p>
            <button
              onClick={() => navigate("/my")}
              className="mt-3 cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              {t("pattern:register.guestLoginCta")}
            </button>
          </div>
        ) : (
          <>
            <section className="mt-5 flex flex-col gap-2">
              <TextField label={t("pattern:register.nameLabel")} value={name} onChange={setName} />
              <TextField label={t("pattern:register.designerLabel")} value={designer} onChange={setDesigner} />

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("pattern:register.craftTypeLabel")}</label>
                <select
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value as CraftType | "")}
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">{t("pattern:register.selectPlaceholder")}</option>
                  {CRAFT_TYPE_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {craftTypeLabel(t, c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("pattern:register.weightLabel")}</label>
                <select
                  value={weightCategory}
                  onChange={(e) => setWeightCategory(e.target.value as WeightCategory | "")}
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">{t("pattern:register.selectPlaceholder")}</option>
                  {WEIGHT_CATEGORY_ORDER.map((w) => (
                    <option key={w} value={w}>
                      {weightCategoryLabel(t, w)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted">{t("pattern:register.requiredLabel")}</label>
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
                    placeholder={t("pattern:register.requiredMinPlaceholder")}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={requiredMax}
                    onChange={(e) => setRequiredMax(e.target.value)}
                    type="number"
                    min={0}
                    placeholder={t("pattern:register.requiredMaxPlaceholder")}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                {requiredMin.trim().length > 0 && !requiredMinValid && (
                  <p className="mt-1.5 text-xs text-danger">{t("pattern:register.requiredMinError")}</p>
                )}
                {requiredMinValid && !requiredMaxValid && (
                  <p className="mt-1.5 text-xs text-danger">{t("pattern:register.requiredMaxError")}</p>
                )}
              </div>

              <TextField label={t("pattern:register.gaugeLabel")} value={gaugeStitches} onChange={setGaugeStitches} type="number" min={0} />
              <TextField label={t("pattern:register.sourceUrlLabel")} value={sourceUrl} onChange={setSourceUrl} />

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">{t("pattern:register.originalYarnLabel")}</label>
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
            {createPattern.isPending ? t("pattern:register.submitting") : t("pattern:register.submit")}
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
