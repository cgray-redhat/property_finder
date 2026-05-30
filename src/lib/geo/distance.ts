const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_MILE = 1_609.344;

/** Convert miles to meters for spatial radius checks. */
export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE;
}

/**
 * Haversine distance between two WGS84 coordinates in meters.
 */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export function isWithinRadiusMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusMeters: number,
): boolean {
  return distanceMeters(lat1, lon1, lat2, lon2) <= radiusMeters;
}
