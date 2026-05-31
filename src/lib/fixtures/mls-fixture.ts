import zip27519Fixture from "@/data/fixtures/zip-27519-mls.json";
import {
  normalizeListingSearchFilters,
  type ListingSearchFilters,
} from "@/lib/rentcast/listing-filters";
import type {
  RentCastMarketData,
  RentCastPropertyRecord,
  RentCastSaleListing,
} from "@/types/property";

export const MLS_FIXTURE_ZIP_CODE = "27519";

export type MlsFixtureFile = {
  zipCode: string;
  sourceLabel: string;
  capturedAt: string;
  listings: RentCastSaleListing[];
  marketData: RentCastMarketData;
  propertyRecords: Record<string, RentCastPropertyRecord>;
};

const fixture = zip27519Fixture as MlsFixtureFile;

export function isMlsFixtureModeEnabled(): boolean {
  return process.env.USE_MLS_FIXTURE_DATA === "true";
}

export function isPublicMlsFixtureModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MLS_FIXTURE_DATA === "true";
}

export function getMlsFixtureZipCode(): string {
  return MLS_FIXTURE_ZIP_CODE;
}

export function getMlsFixture(): MlsFixtureFile {
  return fixture;
}

export function getMlsFixtureCapturedDate(): string {
  return fixture.capturedAt.slice(0, 10);
}

function isLandListing(listing: RentCastSaleListing): boolean {
  return (listing.propertyType ?? "").toLowerCase() === "land";
}

export function filterMlsFixtureListings(
  filters: ListingSearchFilters = {},
): RentCastSaleListing[] {
  const normalized = normalizeListingSearchFilters(filters);

  const propertyListings = fixture.listings.filter((listing) => {
    if (isLandListing(listing)) {
      return false;
    }

    const bedrooms = listing.bedrooms ?? 0;

    if (bedrooms < (normalized.propertyMinBedrooms ?? 1)) {
      return false;
    }

    if (
      normalized.propertyMaxPrice != null &&
      listing.price > normalized.propertyMaxPrice
    ) {
      return false;
    }

    return true;
  });

  const lotListings = fixture.listings.filter((listing) => {
    if (!isLandListing(listing)) {
      return false;
    }

    if (
      normalized.lotMaxPrice != null &&
      listing.price > normalized.lotMaxPrice
    ) {
      return false;
    }

    return true;
  });

  const seen = new Set<string>();

  return [...propertyListings, ...lotListings].filter((listing) => {
    if (seen.has(listing.id)) {
      return false;
    }

    seen.add(listing.id);
    return true;
  });
}

export function getMlsFixtureMarketData(): RentCastMarketData {
  return fixture.marketData;
}

export function getMlsFixturePropertyRecord(
  listingId: string,
): RentCastPropertyRecord | null {
  return fixture.propertyRecords[listingId] ?? null;
}

export function getMlsFixtureMeta() {
  return {
    sourceZipCode: fixture.zipCode,
    capturedDate: getMlsFixtureCapturedDate(),
    sourceLabel: fixture.sourceLabel,
  };
}
