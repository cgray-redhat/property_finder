import {
  buildRealtorDetailSlug,
  buildRealtorSearchFallbackUrl,
  type ListingLinkAddress,
} from "@/lib/listing-links";
import { TtlCache } from "@/lib/rentcast/ttl-cache";

const REALTOR_SUGGEST_URL = "https://parser-external.geo.moveaws.com/suggest";
const REALTOR_LINK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type RealtorSuggestResponse = {
  autocomplete?: Array<{
    area_type?: string;
    mpr_id?: string;
    line?: string;
    city?: string;
    postal_code?: string;
    state_code?: string;
  }>;
};

export type RealtorSuggestAddress = {
  mpr_id: string;
  line: string;
  city: string;
  postal_code: string;
  state_code: string;
};

const realtorLinkCache = new TtlCache<string>();

export function formatRealtorMprId(mprId: string): string {
  const digits = mprId.replace(/\D/g, "").padStart(10, "0");
  return `M${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function buildRealtorDetailUrlFromSuggest(
  address: RealtorSuggestAddress,
): string {
  const slug = buildRealtorDetailSlug(
    address.line,
    address.city,
    address.state_code,
    address.postal_code,
  );

  return `https://www.realtor.com/realestateandhomes-detail/${slug}_${formatRealtorMprId(address.mpr_id)}`;
}

export function formatAddressForRealtorSuggest(
  address: ListingLinkAddress,
): string {
  if (address.addressLine1 && address.city && address.state && address.zipCode) {
    return `${address.addressLine1}, ${address.city}, ${address.state} ${address.zipCode}`;
  }

  return address.formattedAddress;
}

export async function fetchRealtorAddressSuggest(
  query: string,
): Promise<RealtorSuggestAddress | null> {
  const params = new URLSearchParams({
    input: query,
    client_id: "rdc-x",
  });

  const response = await fetch(`${REALTOR_SUGGEST_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as RealtorSuggestResponse;
  const match = data.autocomplete?.find(
    (item) => item.area_type === "address" && item.mpr_id && item.line,
  );

  if (
    !match?.mpr_id ||
    !match.line ||
    !match.city ||
    !match.postal_code ||
    !match.state_code
  ) {
    return null;
  }

  return {
    mpr_id: match.mpr_id,
    line: match.line,
    city: match.city,
    postal_code: match.postal_code,
    state_code: match.state_code,
  };
}

export async function resolveRealtorComUrl(
  address: ListingLinkAddress,
): Promise<string> {
  const cacheKey = formatAddressForRealtorSuggest(address);
  const cached = realtorLinkCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const match = await fetchRealtorAddressSuggest(cacheKey);
  const url = match
    ? buildRealtorDetailUrlFromSuggest(match)
    : buildRealtorSearchFallbackUrl(address);

  realtorLinkCache.set(cacheKey, url, REALTOR_LINK_CACHE_TTL_MS);

  return url;
}
