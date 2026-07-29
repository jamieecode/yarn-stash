import { Image as ImageIcon } from "lucide-react";
import { WeightBadge } from "../ui/WeightBadge";
import type { Yarn } from "../../types/api";

export function YarnCard({ yarn, onOpen }: { yarn: Yarn; onOpen: () => void }) {
  const totalM = yarn.batches.reduce((sum, b) => sum + b.skeinCount * b.lengthPerSkeinM, 0);
  const totalSkeins = yarn.batches.reduce((sum, b) => sum + b.skeinCount, 0);
  const lotCount = new Set(yarn.batches.map((b) => b.dyeLot ?? "__none__")).size;
  const photoCount = yarn.photos.length;
  const cover = yarn.photos[0]?.url;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`overflow-hidden rounded-2xl border border-border bg-card text-left ${yarn.consumed ? "opacity-55" : ""}`}
    >
      <div className="relative h-24 bg-sub-soft">
        {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
        {yarn.consumed && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
            소진됨
          </span>
        )}
        {lotCount > 1 && (
          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
            로트 {lotCount}개
          </span>
        )}
        {photoCount > 1 && (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
            <ImageIcon size={10} /> {photoCount}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-xs text-muted">{yarn.brand}</div>
        <div className="my-0.5 mb-1.5 text-[13px] font-semibold text-text">
          {[yarn.lineName, yarn.colorName].filter(Boolean).join(" · ")}
        </div>
        <div className="flex items-center justify-between">
          <WeightBadge weight={yarn.weightCategory} />
          <span className="text-[11px] text-muted">
            {totalM}m · {totalSkeins}타래
          </span>
        </div>
      </div>
    </button>
  );
}
