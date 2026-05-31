import type { RentCastMarketData, RentCastSaleListing } from "@/types/property";
import {
  LISTINGS_CACHE_TTL_MS,
  LISTINGS_PAGE_SIZE,
  MARKET_CACHE_TTL_MS,
  type ListingsScope,
} from "@/lib/rentcast/cache-policy";
import {
  fetchRentCastMarketData,
  fetchRentCastSaleListings,
  type RentCastFetchResult,
} from "@/lib/rentcast/client";
import { TtlCache } from "@/lib/rentcast/ttl-cache";

type CachedListings = {
  listings: RentCastSaleListing[];
  scope: ListingsScope;
  hasMoreListings: boolean;
  fetchedAt: string;
};

const marketCache = new TtlCache<RentCastMarketData>();
const listingsCache = new TtlCache<CachedListings>();

function listingsCacheKey(zipCode: string, scope: ListingsScope): string {
  return `listings:${zipCode}:${scope}`;
}

function marketCacheKey(zipCode: string): string {
  return `market:${zipCode}`;
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
): Promise<
  RentCastFetchResult<CachedListings> & { fromCache?: boolean }
> {
  const scope: ListingsScope = loadAll ? "all" : "first_page";
  const cacheKey = listingsCacheKey(zipCode, scope);
  const cached = listingsCache.get(cacheKey);

  if (cached) {
    return { ok: true, data: cached, status: 200, fromCache: true };
  }

  const result = await fetchRentCastSaleListings(zipCode, { loadAll });

  if (!result.ok) {
    return result;
  }

  const listings = Array.isArray(result.data) ? result.data : [];
  const hasMoreListings =
    !loadAll && listings.length >= LISTINGS_PAGE_SIZE;

  const payload: CachedListings = {
    listings,
    scope,
    hasMoreListings,
    fetchedAt: new Date().toISOString(),
  };

  listingsCache.set(cacheKey, payload, LISTINGS_CACHE_TTL_MS);

  return { ok: true, data: payload, status: result.status, fromCache: false };
}

/** Test helper — clears module-level caches between test runs. */
export function clearRentCastCaches(): void {
  marketCache.clear();
  listingsCache.clear();
}
