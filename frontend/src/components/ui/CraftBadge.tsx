import { CRAFT_TYPE_LABEL, type CraftType } from "../../types/api";

export function CraftBadge({ craftType }: { craftType: CraftType }) {
  return (
    <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-text">
      {CRAFT_TYPE_LABEL[craftType]}
    </span>
  );
}
