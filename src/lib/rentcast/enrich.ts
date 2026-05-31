import type {
  EnrichedPropertyListing,
  PropertySearchResponse,
  RentCastMarketData,
  RentCastRentalData,
  RentCastSaleListing,
  RentalBenchmarks,
} from "@/types/property";
import { filterForAppMode } from "@/lib/property-classification";
import type { ListingSearchFilters } from "@/lib/rentcast/listing-filters";
import { normalizeListingSearchFilters } from "@/lib/rentcast/listing-filters";

function pickRentalBenchmarks(
  bedrooms: number | null | undefined,
  rentalData: RentCastRentalData | undefined,
): RentalBenchmarks {
  const bedroomStats =
    bedrooms != null
      ? rentalData?.dataByBedrooms?.find((entry) => entry.bedrooms === bedrooms)
      : undefined;

  if (bedroomStats) {
    return {
      medianRent: bedroomStats.medianRent ?? null,
      averageRent: bedroomStats.averageRent ?? null,
      minRent: bedroomStats.minRent ?? null,
      maxRent: bedroomStats.maxRent ?? null,
      bedroomCount: bedroomStats.bedrooms,
      matchType: "bedroom",
      dataSource: "rentcast",
    };
  }

  return {
    medianRent: rentalData?.medianRent ?? null,
    averageRent: rentalData?.averageRent ?? null,
    minRent: rentalData?.minRent ?? null,
    maxRent: rentalData?.maxRent ?? null,
    bedroomCount: bedrooms ?? null,
    matchType: "zip_aggregate",
    dataSource: "rentcast",
  };
}

export function enrichListingsWithMarketData(
  listings: RentCastSaleListing[],
  marketData: RentCastMarketData | null,
  lastUpdated: string,
): EnrichedPropertyListing[] {
  const rentalData = marketData?.rentalData;

  return listings.map((listing) => ({
    id: listing.id,
    formattedAddress: listing.formattedAddress,
    addressLine1: listing.addressLine1 ?? null,
    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
    price: listing.price,
    bedrooms: listing.bedrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    squareFootage: listing.squareFootage ?? null,
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    propertyType: listing.propertyType ?? null,
    listedDate: listing.listedDate ?? null,
    daysOnMarket: listing.daysOnMarket ?? null,
    mlsNumber: listing.mlsNumber ?? null,
    lotSizeSqFt: listing.lotSize ?? null,
    viewType: null,
    legalDescription: null,
    zoning: null,
    rentalBenchmarks: pickRentalBenchmarks(listing.bedrooms, rentalData),
    lastUpdated,
  }));
}

export function buildMarketSummary(
  marketData: RentCastMarketData | null,
): PropertySearchResponse["marketSummary"] {
  if (!marketData?.rentalData) {
    return null;
  }

  const { rentalData } = marketData;

  return {
    zipCode: marketData.zipCode,
    rental: {
      medianRent: rentalData.medianRent ?? null,
      averageRent: rentalData.averageRent ?? null,
      minRent: rentalData.minRent ?? null,
      maxRent: rentalData.maxRent ?? null,
      lastUpdatedDate: rentalData.lastUpdatedDate ?? null,
      totalListings: rentalData.totalListings ?? null,
    },
  };
}

export function buildSearchResponse(
  zipCode: string,
  listings: EnrichedPropertyListing[],
  marketData: RentCastMarketData | null,
  warnings: string[],
  options: {
    listingsScope?: "first_page" | "all";
    hasMoreListings?: boolean;
    appliedFilters?: ListingSearchFilters;
  } = {},
): PropertySearchResponse {
  const lastUpdated = new Date().toISOString();
  const listingsScope = options.listingsScope ?? "first_page";
  const hasMoreListings = options.hasMoreListings ?? false;
  const appliedFilters = normalizeListingSearchFilters(
    options.appliedFilters ?? {},
  );

  const propertyCount = filterForAppMode(listings, "property_finder").length;
  const lotCount = filterForAppMode(listings, "lot_finder").length;

  return {
    success: true,
    lastUpdated,
    zipCode,
    properties: listings,
    marketSummary: buildMarketSummary(marketData),
    meta: {
      zipCode,
      listingCount: listings.length,
      propertyCount,
      lotCount,
      listingsScope,
      hasMoreListings,
      appliedFilters,
      dataSource: "rentcast",
      partial: warnings.length > 0,
      warnings,
    },
  };
}
