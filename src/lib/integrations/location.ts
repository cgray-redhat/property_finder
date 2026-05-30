import type { LocationType, SearchLocation } from "./types";

const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

/** Known location centroids for stub geocoding. */
const LOCATION_CENTROIDS: Record<string, { latitude: number; longitude: number; city: string; state: string }> = {
  "94110": { latitude: 37.7485, longitude: -122.4158, city: "San Francisco", state: "CA" },
  "78701": { latitude: 30.2672, longitude: -97.7431, city: "Austin", state: "TX" },
  "80202": { latitude: 39.7527, longitude: -104.9997, city: "Denver", state: "CO" },
  "san francisco,ca": { latitude: 37.7749, longitude: -122.4194, city: "San Francisco", state: "CA" },
  "austin,tx": { latitude: 30.2672, longitude: -97.7431, city: "Austin", state: "TX" },
  "denver,co": { latitude: 39.7392, longitude: -104.9903, city: "Denver", state: "CO" },
  "mission district": { latitude: 37.7599, longitude: -122.4148, city: "San Francisco", state: "CA" },
  "south congress": { latitude: 30.2493, longitude: -97.7497, city: "Austin", state: "TX" },
};

type LocationInput = {
  location?: string | null;
  zip?: string | null;
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveCentroid(key: string) {
  return LOCATION_CENTROIDS[normalizeKey(key)];
}

function detectLocationType(input: LocationInput): LocationType {
  if (input.neighborhood?.trim()) {
    return "neighborhood";
  }

  const candidate = input.zip?.trim() ?? input.location?.trim() ?? "";

  if (ZIP_PATTERN.test(candidate)) {
    return "zip";
  }

  if (input.city?.trim()) {
    return "city";
  }

  if (candidate.includes(",") || !ZIP_PATTERN.test(candidate)) {
    return "city";
  }

  return "city";
}

/**
 * Parse and geocode a search location from query params.
 * Supports city, zip, or neighborhood searches.
 */
export function parseSearchLocation(input: LocationInput): SearchLocation {
  const type = detectLocationType(input);
  const query =
    input.location?.trim() ??
    input.neighborhood?.trim() ??
    input.zip?.trim() ??
    [input.city, input.state].filter(Boolean).join(", ");

  if (!query) {
    throw new Error("A location query is required (city, zip, or neighborhood).");
  }

  let zipCode = input.zip?.trim();
  let city = input.city?.trim();
  let state = input.state?.trim();
  const neighborhood = input.neighborhood?.trim();
  let centroid =
    resolveCentroid(query) ??
    (zipCode ? resolveCentroid(zipCode) : undefined) ??
    (city && state ? resolveCentroid(`${city},${state}`) : undefined) ??
    (neighborhood ? resolveCentroid(neighborhood) : undefined);

  if (type === "zip" && ZIP_PATTERN.test(query)) {
    zipCode = query.slice(0, 5);
  }

  if (centroid) {
    city = city ?? centroid.city;
    state = state ?? centroid.state;
  } else {
    // Fallback centroid when geocoding stub has no match
    centroid = { latitude: 37.7749, longitude: -122.4194, city: city ?? "San Francisco", state: state ?? "CA" };
    city = city ?? centroid.city;
    state = state ?? centroid.state;
  }

  return {
    type,
    query,
    city,
    state,
    zipCode,
    neighborhood,
    latitude: centroid.latitude,
    longitude: centroid.longitude,
  };
}
