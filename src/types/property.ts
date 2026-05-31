/** RentCast sale listing record (subset of API response). */
import type { ListingSearchFilters } from "@/lib/rentcast/listing-filters";
import { DEFAULT_LISTING_SEARCH_FILTERS } from "@/lib/rentcast/listing-filters";

export type RentCastSaleListing = {
  id: string;
  formattedAddress: string;
  addressLine1?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  status?: string;
  price: number;
  listedDate?: string;
  daysOnMarket?: number;
  mlsNumber?: string;
  lotSize?: number;
};

/** Property record subset from RentCast /properties (county assessor data). */
export type RentCastPropertyRecord = {
  id: string;
  formattedAddress: string;
  lotSize?: number;
  legalDescription?: string;
  zoning?: string;
  features?: {
    viewType?: string;
  };
};

/** Bedroom-level rental statistics from RentCast market data. */
export type RentCastBedroomStats = {
  bedrooms: number;
  averageRent?: number;
  medianRent?: number;
  minRent?: number;
  maxRent?: number;
  averageRentPerSquareFoot?: number;
  medianRentPerSquareFoot?: number;
  averageSquareFootage?: number;
  medianSquareFootage?: number;
  averageDaysOnMarket?: number;
  totalListings?: number;
};

/** Rental aggregate block from RentCast /markets response. */
export type RentCastRentalData = {
  lastUpdatedDate?: string;
  averageRent?: number;
  medianRent?: number;
  minRent?: number;
  maxRent?: number;
  averageRentPerSquareFoot?: number;
  medianRentPerSquareFoot?: number;
  averageSquareFootage?: number;
  medianSquareFootage?: number;
  averageDaysOnMarket?: number;
  totalListings?: number;
  dataByBedrooms?: RentCastBedroomStats[];
};

/** Full RentCast /markets response (subset). */
export type RentCastMarketData = {
  id?: string;
  zipCode: string;
  rentalData?: RentCastRentalData;
  saleData?: {
    lastUpdatedDate?: string;
    averagePrice?: number;
    medianPrice?: number;
    totalListings?: number;
  };
};

/** Rental benchmarks attached to each listing. */
export type RentalBenchmarks = {
  medianRent: number | null;
  averageRent: number | null;
  minRent: number | null;
  maxRent: number | null;
  bedroomCount: number | null;
  matchType: "bedroom" | "zip_aggregate";
  dataSource: "rentcast";
};

/** Standardized property record returned to client components. */
export type EnrichedPropertyListing = {
  id: string;
  formattedAddress: string;
  addressLine1: string | null;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  latitude: number | null;
  longitude: number | null;
  propertyType: string | null;
  listedDate: string | null;
  daysOnMarket: number | null;
  mlsNumber: string | null;
  /** Lot area in square feet (from listing or property record). */
  lotSizeSqFt: number | null;
  /** County view type — may include Waterfront, Pond, River, etc. */
  viewType: string | null;
  legalDescription: string | null;
  zoning: string | null;
  rentalBenchmarks: RentalBenchmarks;
  lastUpdated: string;
};

export type PropertySearchErrorCode =
  | "MISSING_ZIP_CODE"
  | "INVALID_ZIP_CODE"
  | "MISSING_API_KEY"
  | "RENTCAST_UNAUTHORIZED"
  | "RENTCAST_RATE_LIMITED"
  | "RENTCAST_ERROR"
  | "PARTIAL_DATA";

export type PropertySearchError = {
  code: PropertySearchErrorCode;
  message: string;
};

export type PropertySearchDataSource = "rentcast" | "mls_fixture";

export type MlsFixtureMeta = {
  sourceZipCode: string;
  capturedDate: string;
  sourceLabel: string;
};

export type PropertySearchMeta = {
  zipCode: string;
  listingCount: number;
  /** Homes and rentals included in Property Finder. */
  propertyCount: number;
  /** Land and vacant lots included in Lot Finder. */
  lotCount: number;
  /** Whether the first page only or full pagination was loaded. */
  listingsScope: "first_page" | "all";
  /** True when more listings may exist beyond the first page. */
  hasMoreListings: boolean;
  /** Filters applied to the RentCast listing queries. */
  appliedFilters: ListingSearchFilters;
  dataSource: PropertySearchDataSource;
  mlsFixture?: MlsFixtureMeta;
  partial: boolean;
  warnings: string[];
};

/** Standardized API response for GET /api/properties/search. */
export type PropertySearchResponse = {
  success: boolean;
  lastUpdated: string;
  zipCode: string;
  properties: EnrichedPropertyListing[];
  marketSummary: {
    zipCode: string;
    rental: {
      medianRent: number | null;
      averageRent: number | null;
      minRent: number | null;
      maxRent: number | null;
      lastUpdatedDate: string | null;
      totalListings: number | null;
    };
  } | null;
  meta: PropertySearchMeta;
  error?: PropertySearchError;
};

export type PropertySearchFallbackResponse = PropertySearchResponse;

export function createEmptySearchResponse(
  zipCode: string,
  error: PropertySearchError,
): PropertySearchFallbackResponse {
  const lastUpdated = new Date().toISOString();

  return {
    success: false,
    lastUpdated,
    zipCode,
    properties: [],
    marketSummary: null,
    meta: {
      zipCode,
      listingCount: 0,
      propertyCount: 0,
      lotCount: 0,
      listingsScope: "first_page",
      hasMoreListings: false,
      appliedFilters: { ...DEFAULT_LISTING_SEARCH_FILTERS },
      dataSource: "rentcast",
      partial: false,
      warnings: [],
    },
    error,
  };
}
