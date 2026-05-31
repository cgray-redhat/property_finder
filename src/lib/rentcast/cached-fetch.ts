import type { RentCastMarketData, RentCastSaleListing } from "@/types/property";
import {
  LISTINGS_CACHE_TTL_MS,
  LISTINGS_PAGE_SIZE,
  MARKET_CACHE_TTL_MS,
  type ListingsScope,
} from "@/lib/rentcast/cache-policy";
import {
  fetchRentCastMarketData,
  fetchRentCastSaleListingsQuery,
  type RentCastFetchResult,
} from "@/lib/rentcast/client";
import {
  buildLotListingQuery,
  buildPropertyListingQuery,
  listingFiltersCacheKey,
  normalizeListingSearchFilters,
  type ListingSearchFilters,
} from "@/lib/rentcast/listing-filters";
import { TtlCache } from "@/lib/rentcast/ttl-cache";

type CachedListings = {
  listings: RentCastSaleListing[];
  scope: ListingsScope;
  hasMoreListings: boolean;
  fetchedAt: string;
  filters: ListingSearchFilters;
};

const marketCache = new TtlCache<RentCastMarketData>();
const listingsCache = new TtlCache<CachedListings>();

function listingsCacheKey(
  zipCode: string,
  scope: ListingsScope,
  filters: ListingSearchFilters,
): string {
  return `listings:${zipCode}:${scope}:${listingFiltersCacheKey(filters)}`;
}

function marketCacheKey(zipCode: string): string {
  return `market:${zipCode}`;
}

function dedupeListings(listings: RentCastSaleListing[]): RentCastSaleListing[] {
  const seen = new Set<string>();

  return listings.filter((listing) => {
    if (seen.has(listing.id)) {
      return false;
    }

    seen.add(listing.id);
    return true;
  });
}

async function fetchMergedListings(
  zipCode: string,
  filters: ListingSearchFilters,
  loadAll: boolean,
): Promise<
  RentCastFetchResult<CachedListings> & {
    warnings?: string[];
  }
> {
  const normalizedFilters = normalizeListingSearchFilters(filters);
  const propertyQuery = {
    zipCode,
    ...buildPropertyListingQuery(zipCode, normalizedFilters),
  };
  const lotQuery = {
    zipCode,
    ...buildLotListingQuery(zipCode, normalizedFilters),
  };

  const [propertyResult, lotResult] = await Promise.all([
    fetchRentCastSaleListingsQuery(propertyQuery, { loadAll }),
    fetchRentCastSaleListingsQuery(lotQuery, { loadAll }),
  ]);

  const warnings: string[] = [];

  if (!propertyResult.ok && !lotResult.ok) {
    return propertyResult;
  }

  if (!propertyResult.ok) {
    warnings.push(`Property listings unavailable: ${propertyResult.message}`);
  }

  if (!lotResult.ok) {
    warnings.push(`Land listings unavailable: ${lotResult.message}`);
  }

  const propertyListings = propertyResult.ok ? propertyResult.data : [];
  const lotListings = lotResult.ok ? lotResult.data : [];
  const listings = dedupeListings([...propertyListings, ...lotListings]);

  const propertyHasMore =
    !loadAll && propertyListings.length >= LISTINGS_PAGE_SIZE;
  const lotHasMore = !loadAll && lotListings.length >= LISTINGS_PAGE_SIZE;

  return {
    ok: true,
    data: {
      listings,
      scope: loadAll ? "all" : "first_page",
      hasMoreListings: propertyHasMore || lotHasMore,
      fetchedAt: new Date().toISOString(),
      filters: normalizedFilters,
    },
    status: 200,
    warnings,
  };
}

export async function getCachedMarketData(
  zipCode: string,
): Promise<RentCastFetchResult<RentCastMarketData>> {
  const cached = marketCache.get(marketCacheKey(zipCode));

  if (cached) {
    return { ok: true, data: cached, status: 200 };
  }

  const result = await fetchRentCastMarketData(zipCode);

  if (result.ok) {
    marketCache.set(marketCacheKey(zipCode), result.data, MARKET_CACHE_TTL_MS);
  }

  return result;
}

export async function getCachedListings(
  zipCode: string,
  loadAll: boolean,
  filters: ListingSearchFilters = {},
): Promise<
  RentCastFetchResult<CachedListings> & {
    fromCache?: boolean;
    warnings?: string[];
  }
> {
  const normalizedFilters = normalizeListingSearchFilters(filters);
  const scope: ListingsScope = loadAll ? "all" : "first_page";
  const cacheKey = listingsCacheKey(zipCode, scope, normalizedFilters);
  const cached = listingsCache.get(cacheKey);

  if (cached) {
    return { ok: true, data: cached, status: 200, fromCache: true };
  }

  const result = await fetchMergedListings(zipCode, normalizedFilters, loadAll);

  if (!result.ok) {
    return result;
  }

  listingsCache.set(cacheKey, result.data, LISTINGS_CACHE_TTL_MS);

  return {
    ok: true,
    data: result.data,
    status: result.status,
    fromCache: false,
    warnings: result.warnings,
  };
}

/** Test helper — clears module-level caches between test runs. */
export function clearRentCastCaches(): void {
  marketCache.clear();
  listingsCache.clear();
}
