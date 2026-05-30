import { db } from "@/lib/db";

export type NearbyProperty = {
  id: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  listingPrice: string;
  distanceMeters: number;
};

/**
 * Find active properties within a radius (meters) of a point using PostGIS.
 * Requires the PostGIS extension and GIST index on properties.location.
 */
export async function findPropertiesNearby(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  limit = 50,
): Promise<NearbyProperty[]> {
  return db.$queryRaw<NearbyProperty[]>`
    SELECT
      p.id,
      p.address,
      p.city,
      p.state,
      p.latitude,
      p.longitude,
      p.listing_price::text AS "listingPrice",
      ST_Distance(
        p.location::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) AS "distanceMeters"
    FROM properties p
    WHERE p.status = 'ACTIVE'
      AND p.location IS NOT NULL
      AND ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY "distanceMeters"
    LIMIT ${limit}
  `;
}
