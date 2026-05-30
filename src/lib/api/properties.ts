import type { PropertyStatus } from "@/generated/prisma/client";

export type PropertySummary = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  listingPrice: number;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  latitude: number;
  longitude: number;
  status: PropertyStatus;
};

export type PropertySearchParams = {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: PropertyStatus;
};

/** API route handlers and server-side fetch helpers live under src/lib/api. */
export const PROPERTIES_API_BASE = "/api/properties";
