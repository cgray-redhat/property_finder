/** External listing / map URLs derived from address (RentCast has no Zillow URL field). */

export type ListingLinkAddress = {
  formattedAddress: string;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

function toRealtorSlugPart(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join("-");
}

function buildRealtorDetailSlug(
  street: string,
  city: string,
  state: string,
  zipCode: string,
): string {
  return [
    toRealtorSlugPart(street),
    toRealtorSlugPart(city),
    state.trim().toUpperCase(),
    zipCode.trim().split("-")[0] ?? zipCode.trim(),
  ].join("_");
}

export { buildRealtorDetailSlug };

export function buildGoogleMapsUrl(
  formattedAddress: string,
  latitude?: number | null,
  longitude?: number | null,
): string {
  const query =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : formattedAddress;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Zillow homes search URL for an address (opens matching listing when available). */
export function buildZillowHomesUrl(formattedAddress: string): string {
  const slug = formattedAddress
    .replace(/[^\w\s,-]/g, "")
    .replace(/,/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join("-");

  return `https://www.zillow.com/homes/${slug}/`;
}

/** Realtor.com search fallback when address cannot be resolved to a listing id. */
export function buildRealtorSearchFallbackUrl({
  formattedAddress,
  city,
  state,
  zipCode,
}: ListingLinkAddress): string {
  if (zipCode) {
    return `https://www.realtor.com/realestateandhomes-search/${zipCode.trim().split("-")[0]}`;
  }

  if (city && state) {
    return `https://www.realtor.com/realestateandhomes-search/${toRealtorSlugPart(city)}_${state.trim().toUpperCase()}`;
  }

  return `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(formattedAddress)}`;
}

/** Server redirect route that resolves Realtor.com listing ids before opening. */
export function buildRealtorComRedirectPath({
  formattedAddress,
  addressLine1,
  city,
  state,
  zipCode,
}: ListingLinkAddress): string {
  const params = new URLSearchParams({
    formattedAddress,
  });

  if (addressLine1) {
    params.set("addressLine1", addressLine1);
  }

  if (city) {
    params.set("city", city);
  }

  if (state) {
    params.set("state", state);
  }

  if (zipCode) {
    params.set("zipCode", zipCode);
  }

  return `/api/listing-links/realtor?${params.toString()}`;
}

/** @deprecated Use buildRealtorComRedirectPath — detail slugs without listing ids 404. */
export function buildRealtorComUrl(address: ListingLinkAddress): string {
  return buildRealtorComRedirectPath(address);
}
