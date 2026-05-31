import type { PropertySearchResponse } from "@/types/property";
import {
  isWithinTtl,
  LISTINGS_CACHE_TTL_MS,
} from "@/lib/rentcast/cache-policy";

export function isCachedSearchFresh(
  results: PropertySearchResponse | null,
  zipCode: string,
  options: { requireAllListings?: boolean } = {},
): boolean {
  if (!results?.success) {
    return false;
  }

  const normalizedZip = zipCode.trim();

  if (results.zipCode !== normalizedZip) {
    return false;
  }

  if (!isWithinTtl(results.lastUpdated, LISTINGS_CACHE_TTL_MS)) {
    return false;
  }

  if (
    options.requireAllListings &&
    results.meta.hasMoreListings &&
    results.meta.listingsScope === "first_page"
  ) {
    return false;
  }

  return true;
}
