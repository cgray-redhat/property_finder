import {
  buildLotListingQuery,
  buildPropertyListingQuery,
  listingFiltersCacheKey,
  listingSearchFiltersEqual,
  normalizeListingSearchFilters,
  parseListingFiltersFromSearchParams,
} from "@/lib/rentcast/listing-filters";

describe("listing filters", () => {
  it("builds property query with min beds and max price", () => {
    expect(
      buildPropertyListingQuery("78723", {
        propertyMinBedrooms: 3,
        propertyMaxPrice: 500_000,
      }),
    ).toEqual({
      bedrooms: "3:*",
      price: "*:500000",
    });
  });

  it("builds lot query with land type and max price", () => {
    expect(
      buildLotListingQuery("78723", {
        lotMaxPrice: 250_000,
      }),
    ).toEqual({
      propertyType: "Land",
      price: "*:250000",
    });
  });

  it("parses filters from search params", () => {
    const params = new URLSearchParams({
      propertyMinBedrooms: "2",
      propertyMaxPrice: "400000",
      lotMaxPrice: "150000",
    });

    expect(parseListingFiltersFromSearchParams(params)).toEqual({
      propertyMinBedrooms: 2,
      propertyMaxPrice: 400_000,
      lotMaxPrice: 150_000,
    });
  });

  it("creates stable cache keys per filter set", () => {
    const keyA = listingFiltersCacheKey({
      propertyMinBedrooms: 3,
      propertyMaxPrice: 500_000,
    });
    const keyB = listingFiltersCacheKey({
      propertyMinBedrooms: 3,
      propertyMaxPrice: 500_000,
    });
    const keyC = listingFiltersCacheKey({
      propertyMinBedrooms: 2,
    });

    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });

  it("compares normalized filter objects", () => {
    expect(
      listingSearchFiltersEqual(
        { propertyMinBedrooms: 1 },
        normalizeListingSearchFilters({}),
      ),
    ).toBe(true);
  });
});
