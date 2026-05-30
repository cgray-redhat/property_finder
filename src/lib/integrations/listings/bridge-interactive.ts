import type { IntegrationMeta, ListingRecord, SearchLocation } from "../types";

const STUB_DELAY_MS = 75;

/** Deterministic pseudo-random from a string seed (0–1). */
function seededUnit(seed: string, index: number): number {
  let hash = index;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return (hash % 10_000) / 10_000;
}

const STREET_NAMES = [
  "Oak",
  "Maple",
  "Cedar",
  "Pine",
  "Elm",
  "Birch",
  "Willow",
  "Ash",
  "Spruce",
  "Laurel",
];

/**
 * Stub for Bridge Interactive (MLS) listings API.
 * Replace with real HTTP calls when API credentials are available.
 */
export async function fetchActiveListings(
  location: SearchLocation,
): Promise<{ listings: ListingRecord[]; meta: IntegrationMeta }> {
  const startedAt = Date.now();
  await new Promise((resolve) => setTimeout(resolve, STUB_DELAY_MS));

  const seed = `${location.type}:${location.query}`;
  const listingCount = 4 + Math.floor(seededUnit(seed, 1) * 5);
  const city = location.city ?? location.query.split(",")[0]?.trim() ?? "Unknown";
  const state =
    location.state ?? location.query.split(",")[1]?.trim().slice(0, 2) ?? "CA";
  const zipCode =
    location.zipCode ??
    (location.type === "zip" ? location.query : `${94100 + Math.floor(seededUnit(seed, 2) * 99)}`);

  const listings: ListingRecord[] = Array.from({ length: listingCount }, (_, i) => {
    const bedrooms = 1 + Math.floor(seededUnit(seed, i + 10) * 4);
    const bathrooms = 1 + Math.floor(seededUnit(seed, i + 20) * 3) * 0.5;
    const sqft = 700 + Math.floor(seededUnit(seed, i + 30) * 1_800);
    const listingPrice = Math.round(
      (250_000 + seededUnit(seed, i + 40) * 650_000) / 1_000,
    ) * 1_000;
    const street = STREET_NAMES[i % STREET_NAMES.length];
    const streetNumber = 100 + Math.floor(seededUnit(seed, i + 50) * 900);
    const latOffset = (seededUnit(seed, i + 60) - 0.5) * 0.04;
    const lngOffset = (seededUnit(seed, i + 70) - 0.5) * 0.04;

    return {
      id: `bridge-${seed.replace(/\W+/g, "-")}-${i}`,
      externalId: `MLS-${zipCode}-${1000 + i}`,
      address: `${streetNumber} ${street} St`,
      city,
      state,
      zipCode,
      listingPrice,
      bedrooms,
      bathrooms,
      sqft,
      latitude: location.latitude + latOffset,
      longitude: location.longitude + lngOffset,
      listedAt: new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
      source: "bridge_interactive",
    };
  });

  return {
    listings,
    meta: {
      provider: "bridge_interactive",
      fetchedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      stubbed: true,
    },
  };
}
