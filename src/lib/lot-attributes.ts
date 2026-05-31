/** RentCast view types that indicate water proximity or waterfront (county records). */
export const WATER_VIEW_TYPES = new Set([
  "Waterfront",
  "Water",
  "Lake",
  "River",
  "Pond",
  "Creek",
  "Canal",
  "Ocean",
  "Beach",
]);

export function parseViewTypes(viewType: string | null | undefined): string[] {
  if (!viewType?.trim()) {
    return [];
  }

  return viewType
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getWaterViewTypes(viewType: string | null | undefined): string[] {
  return parseViewTypes(viewType).filter((value) => WATER_VIEW_TYPES.has(value));
}

export function hasWaterFeature(viewType: string | null | undefined): boolean {
  return getWaterViewTypes(viewType).length > 0;
}

export type LotBadgeTone = "water" | "neutral";

export type LotBadge = {
  label: string;
  tone: LotBadgeTone;
};

export function getLotBadges(input: {
  viewType?: string | null;
  lotSizeSqFt?: number | null;
}): LotBadge[] {
  const badges: LotBadge[] = [];

  for (const waterType of getWaterViewTypes(input.viewType)) {
    badges.push({ label: waterType, tone: "water" });
  }

  if (badges.length === 0 && input.viewType?.trim()) {
    badges.push({ label: input.viewType.trim(), tone: "neutral" });
  }

  return badges;
}

export function formatLotSize(lotSizeSqFt: number | null | undefined): string {
  if (lotSizeSqFt == null || lotSizeSqFt <= 0) {
    return "Not listed";
  }

  if (lotSizeSqFt >= 43_560) {
    const acres = lotSizeSqFt / 43_560;
    return `${acres.toFixed(acres >= 10 ? 0 : 1)} ac (${lotSizeSqFt.toLocaleString()} sqft)`;
  }

  return `${lotSizeSqFt.toLocaleString()} sqft`;
}
