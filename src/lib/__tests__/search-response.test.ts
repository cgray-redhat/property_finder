import { buildSearchResponse } from "@/lib/rentcast/enrich";
import type { EnrichedPropertyListing } from "@/types/property";

describe("buildSearchResponse", () => {
  it("includes property and lot counts from the shared listing set", () => {
    const rental: EnrichedPropertyListing = {
      id: "home-1",
      formattedAddress: "123 Oak St",
      city: "Austin",
      state: "TX",
      zipCode: "78723",
      price: 350_000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1600,
      latitude: 30.27,
      longitude: -97.74,
      propertyType: "Single Family",
      listedDate: null,
      daysOnMarket: 10,
      rentalBenchmarks: {
        medianRent: 2200,
        averageRent: 2100,
        minRent: 1800,
        maxRent: 2500,
        bedroomCount: 3,
        matchType: "bedroom",
        dataSource: "rentcast",
      },
      lastUpdated: new Date().toISOString(),
    };

    const lot: EnrichedPropertyListing = {
      ...rental,
      id: "lot-1",
      bedrooms: null,
      bathrooms: null,
      propertyType: "Land",
    };

    const response = buildSearchResponse("78723", [rental, lot], null, []);

    expect(response.meta.listingCount).toBe(2);
    expect(response.meta.propertyCount).toBe(1);
    expect(response.meta.lotCount).toBe(1);
    expect(response.meta.listingsScope).toBe("first_page");
    expect(response.meta.hasMoreListings).toBe(false);
  });
});
