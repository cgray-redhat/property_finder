import type { IntegrationMeta, RentalCompRecord, SearchLocation } from "../types";

const STUB_DELAY_MS = 60;

function seededUnit(seed: string, index: number): number {
  let hash = index;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 37 + seed.charCodeAt(i)) >>> 0;
  }

  return (hash % 10_000) / 10_000;
}

const RENTAL_STREETS = [
  "Market",
  "Mission",
  "Valencia",
  "Guerrero",
  "Folsom",
  "Howard",
  "Bryant",
  "Harrison",
  "Potrero",
  "Divisadero",
];

/**
 * Stub for RentCast market data API (Attom Data alternative).
 * Returns historical rental comps keyed by zip code and bedroom count.
 * Replace with real HTTP calls when API credentials are available.
 */
export async function fetchRentalComps(
  location: SearchLocation,
): Promise<{ comps: RentalCompRecord[]; meta: IntegrationMeta }> {
  const startedAt = Date.now();
  await new Promise((resolve) => setTimeout(resolve, STUB_DELAY_MS));

  const seed = `${location.type}:${location.query}`;
  const zipCode =
    location.zipCode ??
    (location.type === "zip" ? location.query : `${94100 + Math.floor(seededUnit(seed, 3) * 99)}`);
  const compCount = 18 + Math.floor(seededUnit(seed, 4) * 12);

  const comps: RentalCompRecord[] = Array.from({ length: compCount }, (_, i) => {
    const bedrooms = 1 + (i % 4);
    const baseRent =
      bedrooms === 1
        ? 1_800
        : bedrooms === 2
          ? 2_600
          : bedrooms === 3
            ? 3_400
            : 4_200;
    const monthlyRent = Math.round(baseRent + (seededUnit(seed, i + 100) - 0.5) * 900);
    const latOffset = (seededUnit(seed, i + 200) - 0.5) * 0.06;
    const lngOffset = (seededUnit(seed, i + 300) - 0.5) * 0.06;
    const street = RENTAL_STREETS[i % RENTAL_STREETS.length];
    const daysAgo = 30 + Math.floor(seededUnit(seed, i + 400) * 330);

    return {
      id: `rentcast-${zipCode}-${i}`,
      address: `${200 + i * 7} ${street} Ave`,
      zipCode,
      bedrooms,
      bathrooms: bedrooms === 1 ? 1 : bedrooms - 0.5,
      monthlyRent,
      latitude: location.latitude + latOffset,
      longitude: location.longitude + lngOffset,
      effectiveDate: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      source: "rentcast",
    };
  });

  return {
    comps,
    meta: {
      provider: "rentcast",
      fetchedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      stubbed: true,
    },
  };
}
