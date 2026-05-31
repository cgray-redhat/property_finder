/** Max listings returned per RentCast page request. */
export const LISTINGS_PAGE_SIZE = 500;

/** Max listings when paginating with loadAll=true. */
export const LISTINGS_MAX_RESULTS = 5000;

/** Server + client freshness window for zip listing searches. */
export const LISTINGS_CACHE_TTL_MS = 30 * 60 * 1000;

/** Server freshness window for zip-level market benchmarks. */
export const MARKET_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type ListingsScope = "first_page" | "all";

export function isWithinTtl(isoTimestamp: string, ttlMs: number): boolean {
  const ageMs = Date.now() - new Date(isoTimestamp).getTime();
  return ageMs >= 0 && ageMs < ttlMs;
}
