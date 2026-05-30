export type LocationType = "city" | "zip" | "neighborhood";

export type SearchLocation = {
  type: LocationType;
  query: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
};

/** Raw active listing from an external MLS/listings provider. */
export type ListingRecord = {
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
  source: "bridge_interactive";
};

/** Historical rental comp from a market data provider. */
export type RentalCompRecord = {
  id: string;
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  latitude: number;
  longitude: number;
  effectiveDate: string;
  source: "rentcast";
};

export type IntegrationMeta = {
  provider: string;
  fetchedAt: string;
  latencyMs: number;
  stubbed: true;
};
