import { getLotBadges, hasWaterFeature } from "@/lib/lot-attributes";
import type { EnrichedPropertyListing } from "@/types/property";

type LotWaterBadgesProps = {
  lot: Pick<EnrichedPropertyListing, "viewType" | "lotSizeSqFt">;
  compact?: boolean;
};

export function LotWaterBadges({ lot, compact = false }: LotWaterBadgesProps) {
  const badges = getLotBadges({
    viewType: lot.viewType,
    lotSizeSqFt: lot.lotSizeSqFt,
  });
  const waterBadges = badges.filter((badge) => badge.tone === "water");

  if (waterBadges.length === 0) {
    if (compact) {
      return null;
    }

    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
        No water feature on record
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {waterBadges.map((badge) => (
        <span
          key={badge.label}
          className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900"
        >
          {badge.label}
        </span>
      ))}
      {!compact && hasWaterFeature(lot.viewType) && (
        <span className="text-xs text-zinc-500">
          County view type — not survey footage
        </span>
      )}
    </div>
  );
}
