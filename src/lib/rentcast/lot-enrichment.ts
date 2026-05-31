import { isLotListing } from "@/lib/property-classification";
import { TtlCache } from "@/lib/rentcast/ttl-cache";
import {
  fetchRentCastPropertyRecord,
  type CachedPropertyRecord,
} from "@/lib/rentcast/client";
import type { EnrichedPropertyListing, RentCastPropertyRecord } from "@/types/property";

const PROPERTY_RECORD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_LOT_RECORD_FETCHES = 25;
const LOT_FETCH_CONCURRENCY = 5;

const propertyRecordCache = new TtlCache<CachedPropertyRecord>();

function cacheKeyForListing(listing: EnrichedPropertyListing): string {
  return listing.id;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

async function getPropertyRecordForLot(
  listing: EnrichedPropertyListing,
): Promise<RentCastPropertyRecord | null> {
  const cacheKey = cacheKeyForListing(listing);
  const cached = propertyRecordCache.get(cacheKey);

  if (cached != null) {
    return cached === "missing" ? null : cached;
  }

  const result = await fetchRentCastPropertyRecord(listing.formattedAddress);

  if (result.ok) {
    propertyRecordCache.set(cacheKey, result.data, PROPERTY_RECORD_CACHE_TTL_MS);
    return result.data;
  }

  propertyRecordCache.set(cacheKey, "missing", PROPERTY_RECORD_CACHE_TTL_MS);
  return null;
}

function mergeLotRecord(
  listing: EnrichedPropertyListing,
  record: RentCastPropertyRecord | null,
): EnrichedPropertyListing {
  if (!record) {
    return listing;
  }

  return {
    ...listing,
    lotSizeSqFt: listing.lotSizeSqFt ?? record.lotSize ?? null,
    viewType: record.features?.viewType ?? listing.viewType ?? null,
    legalDescription: record.legalDescription ?? listing.legalDescription ?? null,
    zoning: record.zoning ?? listing.zoning ?? null,
  };
}

export async function enrichLotListingsFromRecords(
  listings: EnrichedPropertyListing[],
): Promise<{
  listings: EnrichedPropertyListing[];
  warnings: string[];
}> {
  const lotIndexes = listings
    .map((listing, index) => ({ listing, index }))
    .filter(({ listing }) => isLotListing(listing));

  if (lotIndexes.length === 0) {
    return { listings, warnings: [] };
  }

  const warnings: string[] = [];
  const targets = lotIndexes.slice(0, MAX_LOT_RECORD_FETCHES);

  if (lotIndexes.length > MAX_LOT_RECORD_FETCHES) {
    warnings.push(
      `Water and parcel attributes fetched for the first ${MAX_LOT_RECORD_FETCHES} land listings only.`,
    );
  }

  const records = await mapWithConcurrency(
    targets,
    LOT_FETCH_CONCURRENCY,
    ({ listing }) => getPropertyRecordForLot(listing),
  );

  const enriched = [...listings];

  targets.forEach(({ index }, resultIndex) => {
    enriched[index] = mergeLotRecord(listings[index], records[resultIndex]);
  });

  return { listings: enriched, warnings };
}

/** Test helper — clears module-level property record cache. */
export function clearLotPropertyRecordCache(): void {
  propertyRecordCache.clear();
}
