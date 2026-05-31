import {
  LISTINGS_CACHE_TTL_MS,
  LISTINGS_PAGE_SIZE,
} from "@/lib/rentcast/cache-policy";
import {
  appendListingFiltersToSearchParams,
  type ListingSearchFilters,
} from "@/lib/rentcast/listing-filters";

export type PropertySearchQuery = {
  zipCode?: string;
  /** @deprecated Use zipCode — kept for search form compatibility */
  zip?: string;
  location?: string;
  /** When true, paginate through all listing pages (up to 5,000). */
  loadAll?: boolean;
  filters?: ListingSearchFilters;
};

export type { PropertySearchResponse } from "@/types/property";
export type { ListingSearchFilters } from "@/lib/rentcast/listing-filters";

export const PROPERTY_SEARCH_API = "/api/properties/search";

export function buildSearchUrl(query: PropertySearchQuery): string {
  const params = new URLSearchParams();
  const zipCode =
    query.zipCode?.trim() || query.zip?.trim() || query.location?.trim();

  if (zipCode) {
    params.set("zipCode", zipCode);
  }

  if (query.loadAll) {
    params.set("loadAll", "true");
  }

  if (query.filters) {
    appendListingFiltersToSearchParams(query.filters, params);
  }

  return `${PROPERTY_SEARCH_API}?${params.toString()}`;
}

export { LISTINGS_CACHE_TTL_MS, LISTINGS_PAGE_SIZE };
