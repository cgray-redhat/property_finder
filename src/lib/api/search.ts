export type PropertySearchQuery = {
  location?: string;
  zip?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
};

export type PropertySearchResponse = import("@/lib/pipeline/property-search").PropertySearchPipelineResult;

export const PROPERTY_SEARCH_API = "/api/properties/search";
