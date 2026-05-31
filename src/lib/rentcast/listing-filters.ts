/** Filters sent to RentCast — one search loads both property and lot streams. */
export type ListingSearchFilters = {
  /** Minimum bedrooms for the property stream (default 1 excludes vacant lots). */
  propertyMinBedrooms?: number;
  /** Maximum list price for rental property stream. */
  propertyMaxPrice?: number;
  /** Maximum list price for land/lot stream. */
  lotMaxPrice?: number;
};

export const DEFAULT_LISTING_SEARCH_FILTERS: ListingSearchFilters = {
  propertyMinBedrooms: 1,
};

export function normalizeListingSearchFilters(
  filters: ListingSearchFilters = {},
): ListingSearchFilters {
  const normalized: ListingSearchFilters = {};

  if (
    filters.propertyMinBedrooms != null &&
    filters.propertyMinBedrooms >= 1
  ) {
    normalized.propertyMinBedrooms = Math.floor(filters.propertyMinBedrooms);
  } else {
    normalized.propertyMinBedrooms = 1;
  }

  if (filters.propertyMaxPrice != null && filters.propertyMaxPrice > 0) {
    normalized.propertyMaxPrice = Math.floor(filters.propertyMaxPrice);
  }

  if (filters.lotMaxPrice != null && filters.lotMaxPrice > 0) {
    normalized.lotMaxPrice = Math.floor(filters.lotMaxPrice);
  }

  return normalized;
}

export function listingSearchFiltersEqual(
  a: ListingSearchFilters,
  b: ListingSearchFilters,
): boolean {
  const left = normalizeListingSearchFilters(a);
  const right = normalizeListingSearchFilters(b);

  return (
    left.propertyMinBedrooms === right.propertyMinBedrooms &&
    left.propertyMaxPrice === right.propertyMaxPrice &&
    left.lotMaxPrice === right.lotMaxPrice
  );
}

export function parseListingFiltersFromSearchParams(
  params: URLSearchParams,
): ListingSearchFilters {
  const raw: ListingSearchFilters = {};

  const minBeds = params.get("propertyMinBedrooms");
  if (minBeds != null && minBeds !== "") {
    const parsed = Number(minBeds);
    if (Number.isFinite(parsed) && parsed >= 1) {
      raw.propertyMinBedrooms = Math.floor(parsed);
    }
  }

  const propertyMax = params.get("propertyMaxPrice");
  if (propertyMax != null && propertyMax !== "") {
    const parsed = Number(propertyMax);
    if (Number.isFinite(parsed) && parsed > 0) {
      raw.propertyMaxPrice = Math.floor(parsed);
    }
  }

  const lotMax = params.get("lotMaxPrice");
  if (lotMax != null && lotMax !== "") {
    const parsed = Number(lotMax);
    if (Number.isFinite(parsed) && parsed > 0) {
      raw.lotMaxPrice = Math.floor(parsed);
    }
  }

  return normalizeListingSearchFilters(raw);
}

export function appendListingFiltersToSearchParams(
  filters: ListingSearchFilters,
  params: URLSearchParams,
): void {
  const normalized = normalizeListingSearchFilters(filters);

  params.set("propertyMinBedrooms", String(normalized.propertyMinBedrooms ?? 1));

  if (normalized.propertyMaxPrice != null) {
    params.set("propertyMaxPrice", String(normalized.propertyMaxPrice));
  }

  if (normalized.lotMaxPrice != null) {
    params.set("lotMaxPrice", String(normalized.lotMaxPrice));
  }
}

export function listingFiltersCacheKey(filters: ListingSearchFilters): string {
  const normalized = normalizeListingSearchFilters(filters);
  const parts = [`pb${normalized.propertyMinBedrooms ?? 1}`];

  if (normalized.propertyMaxPrice != null) {
    parts.push(`pp${normalized.propertyMaxPrice}`);
  }

  if (normalized.lotMaxPrice != null) {
    parts.push(`lp${normalized.lotMaxPrice}`);
  }

  return parts.join("_");
}

export type RentCastListingQuery = {
  zipCode: string;
  bedrooms?: string;
  price?: string;
  propertyType?: string;
};

export function buildPropertyListingQuery(
  zipCode: string,
  filters: ListingSearchFilters,
): Omit<RentCastListingQuery, "zipCode"> {
  const normalized = normalizeListingSearchFilters(filters);
  const query: Omit<RentCastListingQuery, "zipCode"> = {
    bedrooms: `${normalized.propertyMinBedrooms ?? 1}:*`,
  };

  if (normalized.propertyMaxPrice != null) {
    query.price = `*:${normalized.propertyMaxPrice}`;
  }

  return query;
}

export function buildLotListingQuery(
  zipCode: string,
  filters: ListingSearchFilters,
): Omit<RentCastListingQuery, "zipCode"> {
  const normalized = normalizeListingSearchFilters(filters);
  const query: Omit<RentCastListingQuery, "zipCode"> = {
    propertyType: "Land",
  };

  if (normalized.lotMaxPrice != null) {
    query.price = `*:${normalized.lotMaxPrice}`;
  }

  return query;
}

export function describeListingFilters(filters: ListingSearchFilters): {
  property: string;
  lot: string;
} {
  const normalized = normalizeListingSearchFilters(filters);
  const propertyParts = [`${normalized.propertyMinBedrooms ?? 1}+ beds`];

  if (normalized.propertyMaxPrice != null) {
    propertyParts.push(`≤ $${normalized.propertyMaxPrice.toLocaleString()}`);
  }

  const lotParts = ["Land listings"];

  if (normalized.lotMaxPrice != null) {
    lotParts.push(`≤ $${normalized.lotMaxPrice.toLocaleString()}`);
  }

  return {
    property: propertyParts.join(", "),
    lot: lotParts.join(", "),
  };
}
