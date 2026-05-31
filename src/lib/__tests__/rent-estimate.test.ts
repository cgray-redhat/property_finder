import { resolveMonthlyRent } from "@/lib/rent-estimate";
import type { EnrichedPropertyListing } from "@/types/property";

const baseProperty: EnrichedPropertyListing = {
  id: "test-1",
  formattedAddress: "123 Main St",
  addressLine1: "123 Main St",
  city: "Austin",
  state: "TX",
  zipCode: "78723",
  price: 300_000,
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1500,
  latitude: 30.27,
  longitude: -97.74,
  propertyType: "Single Family",
  listedDate: null,
  daysOnMarket: null,
  mlsNumber: null,
  lotSizeSqFt: null,
  viewType: null,
  legalDescription: null,
  zoning: null,
  rentalBenchmarks: {
    medianRent: 2500,
    averageRent: 2400,
    minRent: 2000,
    maxRent: 2800,
    bedroomCount: 3,
    matchType: "bedroom",
    dataSource: "rentcast",
  },
  lastUpdated: new Date().toISOString(),
};

describe("resolveMonthlyRent", () => {
  it("prefers manual override over API data", () => {
    const result = resolveMonthlyRent({
      property: baseProperty,
      rentOverride: 3200,
    });

    expect(result.monthlyRent).toBe(3200);
    expect(result.source).toBe("override");
    expect(result.isFallback).toBe(false);
  });

  it("uses API median rent when available", () => {
    const result = resolveMonthlyRent({ property: baseProperty });

    expect(result.monthlyRent).toBe(2500);
    expect(result.source).toBe("api");
  });

  it("falls back to zip median when listing rent is missing", () => {
    const result = resolveMonthlyRent({
      property: {
        ...baseProperty,
        rentalBenchmarks: {
          ...baseProperty.rentalBenchmarks,
          medianRent: null,
          averageRent: null,
        },
      },
      zipMedianRent: 2100,
    });

    expect(result.monthlyRent).toBe(2100);
    expect(result.source).toBe("zip_fallback");
    expect(result.isFallback).toBe(true);
  });

  it("uses 1% rule when all market data is missing", () => {
    const result = resolveMonthlyRent({
      property: {
        ...baseProperty,
        rentalBenchmarks: {
          ...baseProperty.rentalBenchmarks,
          medianRent: null,
          averageRent: null,
        },
      },
    });

    expect(result.monthlyRent).toBe(3000);
    expect(result.source).toBe("one_percent_rule");
  });
});
