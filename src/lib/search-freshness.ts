import type { PropertySearchResponse } from "@/types/property";
import {
  isWithinTtl,
  LISTINGS_CACHE_TTL_MS,
} from "@/lib/rentcast/cache-policy";
import {
  listingSearchFiltersEqual,
  normalizeListingSearchFilters,
  type ListingSearchFilters,
} from "@/lib/rentcast/listing-filters";

export function isCachedSearchFresh(
  results: PropertySearchResponse | null,
  zipCode: string,
  options: {
    requireAllListings?: boolean;
    filters?: ListingSearchFilters;
  } = {},
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

  if (options.filters != null) {
    const requested = normalizeListingSearchFilters(options.filters);
    const applied = normalizeListingSearchFilters(
      results.meta.appliedFilters ?? {},
    );

    if (!listingSearchFiltersEqual(requested, applied)) {
      return false;
    }
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
