import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TopBar } from "../../components/layout/TopBar";
import { PhotoUploader } from "../../components/ui/PhotoUploader";
import { useUpdateYarnMutation, useYarnQuery } from "../../api/useYarns";
import { WEIGHT_CATEGORY_ORDER, type PhotoInput, type WeightCategory } from "../../types/api";
import { weightCategoryLabel } from "../../lib/enumLabels";

// 화면설계서 3-1(실 수정) - 카탈로그 자동완성 없이 필드 직접 수정만 지원
export function YarnEditPage() {
  const { t } = useTranslation(["yarn", "enums", "common"]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: yarn } = useYarnQuery(id);
  const updateYarn = useUpdateYarnMutation(id ?? "");

  const [brand, setBrand] = useState("");
  const [lineName, setLineName] = useState("");
  const [colorName, setColorName] = useState("");
  const [fiber, setFiber] = useState("");
  const [weightCategory, setWeightCategory] = useState<WeightCategory | "">("");
  const [needleSize, setNeedleSize] = useState("");
  const [gaugeStitches, setGaugeStitches] = useState("");
  const [memo, setMemo] = useState("");
  const [photos, setPhotos] = useState<PhotoInput[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!yarn || initialized) return;
    setBrand(yarn.brand);
    setLineName(yarn.lineName ?? "");
    setColorName(yarn.colorName ?? "");
    setFiber(yarn.fiber ?? "");
    setWeightCategory(yarn.weightCategory ?? "");
    setNeedleSize(yarn.needleSize ?? "");
    setGaugeStitches(yarn.gaugeStitches != null ? String(yarn.gaugeStitches) : "");
    setMemo(yarn.memo ?? "");
    setPhotos(yarn.photos.map((p) => ({ url: p.url, publicId: p.publicId ?? undefined })));
    setInitialized(true);
  }, [yarn, initialized]);

  if (!yarn) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title={t("yarn:edit.title")} />
        <p className="p-6 text-center text-sm text-muted">{t("common:loading")}</p>
      </div>
    );
  }

  async function handleSubmit() {
    await updateYarn.mutateAsync({
      brand,
      lineName: lineName || undefined,
      colorName: colorName || undefined,
      fiber: fiber || undefined,
      weightCategory: weightCategory || undefined,
      needleSize: needleSize || undefined,
      gaugeStitches: gaugeStitches ? Number(gaugeStitches) : undefined,
      memo: memo || undefined,
      photos,
    });
    navigate(`/yarns/${id}`, { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={t("yarn:edit.title")} />
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <section>
          <label className="mb-1.5 block text-xs font-semibold text-muted">{t("yarn:edit.photoLabel")}</label>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2">
          <TextField label={t("yarn:edit.brandLabel")} value={brand} onChange={setBrand} />
          <TextField label={t("yarn:edit.lineNameLabel")} value={lineName} onChange={setLineName} />
          <TextField label={t("yarn:edit.colorNameLabel")} value={colorName} onChange={setColorName} />
          <TextField label={t("yarn:edit.fiberLabel")} value={fiber} onChange={setFiber} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("yarn:edit.weightLabel")}</label>
            <select
              value={weightCategory}
              onChange={(e) => setWeightCategory(e.target.value as WeightCategory | "")}
              className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">{t("yarn:edit.weightNotSelected")}</option>
              {WEIGHT_CATEGORY_ORDER.map((w) => (
                <option key={w} value={w}>
                  {weightCategoryLabel(t, w)}
                </option>
              ))}
            </select>
          </div>
          <TextField label={t("yarn:edit.needleSizeLabel")} value={needleSize} onChange={setNeedleSize} />
          <TextField label={t("yarn:edit.gaugeLabel")} value={gaugeStitches} onChange={setGaugeStitches} type="number" />
        </section>

        <section className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted">{t("yarn:edit.memoLabel")}</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-bg p-4">
        <button
          onClick={handleSubmit}
          disabled={!brand.trim() || updateYarn.isPending}
          className="w-full cursor-pointer rounded-xl border-none bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {updateYarn.isPending ? t("yarn:edit.saving") : t("yarn:edit.save")}
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
