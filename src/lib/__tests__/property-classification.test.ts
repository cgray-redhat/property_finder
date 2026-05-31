import {
  filterForAppMode,
  isLotListing,
  rankLotListings,
} from "@/lib/property-classification";
import type { EnrichedPropertyListing } from "@/types/property";

const rentalProperty: EnrichedPropertyListing = {
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

const landLot: EnrichedPropertyListing = {
  ...rentalProperty,
  id: "lot-1",
  formattedAddress: "0 Empty Lot Ln",
  price: 120_000,
  bedrooms: null,
  bathrooms: null,
  squareFootage: 7500,
  propertyType: "Land",
  rentalBenchmarks: {
    medianRent: 1800,
    averageRent: 1800,
    minRent: 1500,
    maxRent: 2000,
    bedroomCount: null,
    matchType: "zip_aggregate",
    dataSource: "rentcast",
  },
};

describe("isLotListing", () => {
  it("identifies land property types as lots", () => {
    expect(isLotListing(landLot)).toBe(true);
  });

  it("identifies listings with no beds and baths as lots", () => {
    expect(
      isLotListing({
        ...rentalProperty,
        propertyType: "Residential",
        bedrooms: null,
        bathrooms: null,
      }),
    ).toBe(true);
  });

  it("does not classify homes with bed/bath counts as lots", () => {
    expect(isLotListing(rentalProperty)).toBe(false);
  });
});

describe("filterForAppMode", () => {
  const listings = [rentalProperty, landLot];

  it("returns only non-lot listings for property finder mode", () => {
    expect(filterForAppMode(listings, "property_finder")).toEqual([
      rentalProperty,
    ]);
  });

  it("returns only lots for lot finder mode", () => {
    expect(filterForAppMode(listings, "lot_finder")).toEqual([landLot]);
  });
});

describe("rankLotListings", () => {
  it("sorts lots by ascending price", () => {
    const expensive = { ...landLot, id: "lot-2", price: 200_000 };
    const cheap = { ...landLot, id: "lot-3", price: 90_000 };

    expect(rankLotListings([expensive, cheap])).toEqual([cheap, expensive]);
  });
});
