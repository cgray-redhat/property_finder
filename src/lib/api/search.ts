export type PropertySearchQuery = {
  zipCode?: string;
  /** @deprecated Use zipCode — kept for search form compatibility */
  zip?: string;
  location?: string;
};

export type { PropertySearchResponse } from "@/types/property";

export const PROPERTY_SEARCH_API = "/api/properties/search";
