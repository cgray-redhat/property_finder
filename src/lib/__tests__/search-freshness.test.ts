import type { PropertySearchResponse } from "@/types/property";
import { isCachedSearchFresh } from "@/lib/search-freshness";

function buildResponse(
  overrides: Partial<PropertySearchResponse> = {},
): PropertySearchResponse {
  const lastUpdated = new Date().toISOString();

  return {
    success: true,
    lastUpdated,
    zipCode: "78723",
    properties: [],
    marketSummary: null,
    meta: {
      zipCode: "78723",
      listingCount: 10,
      propertyCount: 8,
      lotCount: 2,
      listingsScope: "first_page",
      hasMoreListings: true,
      appliedFilters: {
        propertyMinBedrooms: 1,
        propertyMaxPrice: 500_000,
      },
      dataSource: "rentcast",
      partial: false,
      warnings: [],
    },
    ...overrides,
  };
}

describe("isCachedSearchFresh", () => {
  it("returns true for a recent matching zip search", () => {
    const results = buildResponse();

    expect(
      isCachedSearchFresh(results, "78723", {
        filters: { propertyMinBedrooms: 1, propertyMaxPrice: 500_000 },
      }),
    ).toBe(true);
  });

  it("returns false when filters differ", () => {
    const results = buildResponse();

    expect(
      isCachedSearchFresh(results, "78723", {
        filters: { propertyMinBedrooms: 3 },
      }),
    ).toBe(false);
  });

  it("returns false for a different zip", () => {
    const results = buildResponse();

    expect(isCachedSearchFresh(results, "78701")).toBe(false);
  });

  it("requires all listings when requested", () => {
    const results = buildResponse();

    expect(
      isCachedSearchFresh(results, "78723", { requireAllListings: true }),
    ).toBe(false);

    const complete = buildResponse({
      meta: {
        ...buildResponse().meta,
        listingsScope: "all",
        hasMoreListings: false,
      },
    });

    expect(
      isCachedSearchFresh(complete, "78723", { requireAllListings: true }),
    ).toBe(true);
  });
});
