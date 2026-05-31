import type { EnrichedPropertyListing } from "@/types/property";

export type AppMode = "property_finder" | "lot_finder";

export function isLotListing(property: EnrichedPropertyListing): boolean {
  const type = property.propertyType?.toLowerCase() ?? "";

  if (type.includes("land") || type.includes("lot")) {
    return true;
  }

  const noBedrooms = property.bedrooms == null || property.bedrooms === 0;
  const noBathrooms = property.bathrooms == null || property.bathrooms === 0;

  return noBedrooms && noBathrooms;
}

export function filterForAppMode(
  properties: EnrichedPropertyListing[],
  mode: AppMode,
): EnrichedPropertyListing[] {
  if (mode === "lot_finder") {
    return properties.filter(isLotListing);
  }

  return properties.filter((property) => !isLotListing(property));
}

/** Sort land listings by list price (ascending). */
export function rankLotListings(
  properties: EnrichedPropertyListing[],
): EnrichedPropertyListing[] {
  return [...properties].sort((a, b) => a.price - b.price);
}
