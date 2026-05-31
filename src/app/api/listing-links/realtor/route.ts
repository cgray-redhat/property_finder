import {
  buildRealtorSearchFallbackUrl,
  type ListingLinkAddress,
} from "@/lib/listing-links";
import { resolveRealtorComUrl } from "@/lib/realtor-suggest";

function parseAddressFromSearchParams(
  searchParams: URLSearchParams,
): ListingLinkAddress | null {
  const formattedAddress = searchParams.get("formattedAddress")?.trim();

  if (!formattedAddress) {
    return null;
  }

  return {
    formattedAddress,
    addressLine1: searchParams.get("addressLine1")?.trim() || null,
    city: searchParams.get("city")?.trim() || null,
    state: searchParams.get("state")?.trim() || null,
    zipCode: searchParams.get("zipCode")?.trim() || null,
  };
}

export async function GET(request: Request) {
  const address = parseAddressFromSearchParams(new URL(request.url).searchParams);

  if (!address) {
    return Response.json(
      { error: "formattedAddress is required." },
      { status: 400 },
    );
  }

  try {
    const destination = await resolveRealtorComUrl(address);
    return Response.redirect(destination, 302);
  } catch {
    return Response.redirect(buildRealtorSearchFallbackUrl(address), 302);
  }
}
