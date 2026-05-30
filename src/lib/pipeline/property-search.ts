import { isWithinRadiusMeters, milesToMeters } from "@/lib/geo/distance";
import {
  fetchActiveListings,
  fetchRentalComps,
  type IntegrationMeta,
  type ListingRecord,
  type RentalCompRecord,
  type SearchLocation,
} from "@/lib/integrations";

export const RENTAL_COMP_RADIUS_MILES = 2;

export type RentalMarketSummary = {
  medianRent: number;
  averageRent: number;
  minRent: number;
  maxRent: number;
  compCount: number;
  radiusMiles: typeof RENTAL_COMP_RADIUS_MILES;
  bedroomCount: number;
  zipCode: string;
  dataSource: "rentcast";
};

export type EnrichedProperty = {
  id: string;
  externalId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  listingPrice: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  latitude: number;
  longitude: number;
  listedAt: string;
  listingSource: ListingRecord["source"];
  rentalMarket: RentalMarketSummary;
  lastUpdated: string;
};

export type PropertySearchPipelineResult = {
  lastUpdated: string;
  search: SearchLocation;
  properties: EnrichedProperty[];
  meta: {
    totalResults: number;
    rentalCompRadiusMiles: typeof RENTAL_COMP_RADIUS_MILES;
    integrations: {
      listings: IntegrationMeta;
      marketData: IntegrationMeta;
    };
  };
};

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function summarizeRentalComps(
  listing: ListingRecord,
  comps: RentalCompRecord[],
): RentalMarketSummary {
  const radiusMeters = milesToMeters(RENTAL_COMP_RADIUS_MILES);

  const nearbyComps = comps.filter(
    (comp) =>
      comp.bedrooms === listing.bedrooms &&
      isWithinRadiusMeters(
        listing.latitude,
        listing.longitude,
        comp.latitude,
        comp.longitude,
        radiusMeters,
      ),
  );

  const rents = nearbyComps.map((comp) => comp.monthlyRent);

  if (rents.length === 0) {
    // Fall back to zip-level bedroom-matched comps when none fall within radius
    const zipComps = comps.filter(
      (comp) =>
        comp.zipCode === listing.zipCode && comp.bedrooms === listing.bedrooms,
    );
    const zipRents = zipComps.map((comp) => comp.monthlyRent);

    return {
      medianRent: median(zipRents),
      averageRent:
        zipRents.length > 0
          ? Math.round(zipRents.reduce((sum, rent) => sum + rent, 0) / zipRents.length)
          : 0,
      minRent: zipRents.length > 0 ? Math.min(...zipRents) : 0,
      maxRent: zipRents.length > 0 ? Math.max(...zipRents) : 0,
      compCount: zipComps.length,
      radiusMiles: RENTAL_COMP_RADIUS_MILES,
      bedroomCount: listing.bedrooms,
      zipCode: listing.zipCode,
      dataSource: "rentcast",
    };
  }

  return {
    medianRent: median(rents),
    averageRent: Math.round(rents.reduce((sum, rent) => sum + rent, 0) / rents.length),
    minRent: Math.min(...rents),
    maxRent: Math.max(...rents),
    compCount: nearbyComps.length,
    radiusMiles: RENTAL_COMP_RADIUS_MILES,
    bedroomCount: listing.bedrooms,
    zipCode: listing.zipCode,
    dataSource: "rentcast",
  };
}

/**
 * Week 1 pipeline: fetch active listings, pull rental market comps,
 * and cross-reference each listing with local rental averages within 2 miles.
 */
export async function runPropertySearchPipeline(
  location: SearchLocation,
): Promise<PropertySearchPipelineResult> {
  const pipelineStartedAt = new Date().toISOString();

  const [listingsResult, rentalResult] = await Promise.all([
    fetchActiveListings(location),
    fetchRentalComps(location),
  ]);

  const properties: EnrichedProperty[] = listingsResult.listings.map((listing) => ({
    id: listing.id,
    externalId: listing.externalId,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
    listingPrice: listing.listingPrice,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    latitude: listing.latitude,
    longitude: listing.longitude,
    listedAt: listing.listedAt,
    listingSource: listing.source,
    rentalMarket: summarizeRentalComps(listing, rentalResult.comps),
    lastUpdated: pipelineStartedAt,
  }));

  return {
    lastUpdated: pipelineStartedAt,
    search: location,
    properties,
    meta: {
      totalResults: properties.length,
      rentalCompRadiusMiles: RENTAL_COMP_RADIUS_MILES,
      integrations: {
        listings: listingsResult.meta,
        marketData: rentalResult.meta,
      },
    },
  };
}
