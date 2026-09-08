import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TopBar } from "../../components/layout/TopBar";
import { YarnCatalogAutocomplete } from "../../components/yarn/YarnCatalogAutocomplete";
import { usePatternQuery, useUpdatePatternMutation } from "../../api/usePatterns";
import {
  CRAFT_TYPE_ORDER,
  WEIGHT_CATEGORY_ORDER,
  type CraftType,
  type UnitSystem,
  type WeightCategory,
} from "../../types/api";
import { craftTypeLabel, weightCategoryLabel } from "../../lib/enumLabels";

// 화면설계서 6-1(도안 수정) - 검색 UI 없이 필드 직접 수정, ravelryId/sourceType은 변경하지 않음
export function PatternEditPage() {
  const { t } = useTranslation(["pattern", "enums", "common"]);
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
        <TopBar title={t("pattern:edit.title")} />
        <p className="p-6 text-center text-sm text-muted">{t("common:loading")}</p>
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
      <TopBar title={t("pattern:edit.title")} />
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <section className="flex flex-col gap-2">
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
              <input value={requiredMin} onChange={(e) => setRequiredMin(e.target.value)} type="number" placeholder={t("pattern:register.requiredMinPlaceholder")} className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
              <input value={requiredMax} onChange={(e) => setRequiredMax(e.target.value)} type="number" placeholder={t("pattern:register.requiredMaxPlaceholder")} className="rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:border-accent" />
            </div>
          </div>

          <TextField label={t("pattern:register.gaugeLabel")} value={gaugeStitches} onChange={setGaugeStitches} type="number" />
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
      </div>

      <div className="sticky bottom-0 border-t border-border bg-bg p-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || updatePattern.isPending}
          className="w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {updatePattern.isPending ? t("pattern:edit.saving") : t("pattern:edit.save")}
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
