import type { AppMode } from "@/lib/property-classification";
import {
  buildGoogleMapsUrl,
  buildRealtorComUrl,
  buildZillowHomesUrl,
} from "@/lib/listing-links";
import { trackEvent } from "@/lib/analytics";
import type { EnrichedPropertyListing } from "@/types/property";

type ListingExternalLinksProps = {
  listing: EnrichedPropertyListing;
  mode: AppMode;
  compact?: boolean;
  onNavigate?: () => void;
};

function handleLinkClick(
  listing: EnrichedPropertyListing,
  mode: AppMode,
  destination: "google_maps" | "zillow" | "realtor",
) {
  trackEvent("Property Listing Clicked", {
    property_id: listing.id,
    address: listing.formattedAddress,
    action: "external_link",
    destination,
    mode,
  });
}

export function ListingExternalLinks({
  listing,
  mode,
  compact = false,
  onNavigate,
}: ListingExternalLinksProps) {
  const googleMapsUrl = buildGoogleMapsUrl(
    listing.formattedAddress,
    listing.latitude,
    listing.longitude,
  );
  const zillowUrl = buildZillowHomesUrl(listing.formattedAddress);
  const realtorUrl = buildRealtorComUrl({
    formattedAddress: listing.formattedAddress,
    addressLine1: listing.addressLine1,
    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
  });

  const linkClass = compact
    ? "inline-flex rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-900"
    : "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50";

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          : "flex flex-wrap gap-2"
      }
    >
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        onClick={(event) => {
          event.stopPropagation();
          handleLinkClick(listing, mode, "google_maps");
          onNavigate?.();
        }}
      >
        {compact ? "Google Maps" : "Open in Google Maps"}
      </a>
      <a
        href={zillowUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        onClick={(event) => {
          event.stopPropagation();
          handleLinkClick(listing, mode, "zillow");
          onNavigate?.();
        }}
      >
        {compact ? "Zillow" : "Search on Zillow"}
      </a>
      <a
        href={realtorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        onClick={(event) => {
          event.stopPropagation();
          handleLinkClick(listing, mode, "realtor");
          onNavigate?.();
        }}
      >
        {compact ? "Realtor.com" : "Search on Realtor.com"}
      </a>
    </div>
  );
}
