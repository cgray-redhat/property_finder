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

/** Realtor.com detail URL from address (opens matching listing when available). */
export function buildRealtorComUrl({
  formattedAddress,
  addressLine1,
  city,
  state,
  zipCode,
}: ListingLinkAddress): string {
  if (addressLine1 && city && state && zipCode) {
    return `https://www.realtor.com/realestateandhomes-detail/${buildRealtorDetailSlug(addressLine1, city, state, zipCode)}`;
  }

  const parsed = formattedAddress.match(
    /^(.+?),\s*([^,]+),\s*([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)$/,
  );

  if (parsed) {
    const [, street, parsedCity, parsedState, parsedZip] = parsed;
    return `https://www.realtor.com/realestateandhomes-detail/${buildRealtorDetailSlug(street, parsedCity, parsedState, parsedZip)}`;
  }

  if (city && state) {
    return `https://www.realtor.com/realestateandhomes-search/${toRealtorSlugPart(city)}_${state.trim().toUpperCase()}`;
  }

  return `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(formattedAddress)}`;
}
