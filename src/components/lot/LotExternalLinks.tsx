import type { EnrichedPropertyListing } from "@/types/property";
import {
  buildGoogleMapsUrl,
  buildRealtorComUrl,
  buildZillowHomesUrl,
} from "@/lib/listing-links";
import { trackEvent } from "@/lib/analytics";

type LotExternalLinksProps = {
  lot: EnrichedPropertyListing;
  compact?: boolean;
  onNavigate?: () => void;
};

function handleLinkClick(
  lot: EnrichedPropertyListing,
  destination: "google_maps" | "zillow" | "realtor",
) {
  trackEvent("Property Listing Clicked", {
    property_id: lot.id,
    address: lot.formattedAddress,
    action: "external_link",
    destination,
    mode: "lot_finder",
  });
}

export function LotExternalLinks({
  lot,
  compact = false,
  onNavigate,
}: LotExternalLinksProps) {
  const googleMapsUrl = buildGoogleMapsUrl(
    lot.formattedAddress,
    lot.latitude,
    lot.longitude,
  );
  const zillowUrl = buildZillowHomesUrl(lot.formattedAddress);
  const realtorUrl = buildRealtorComUrl({
    formattedAddress: lot.formattedAddress,
    addressLine1: lot.addressLine1,
    city: lot.city,
    state: lot.state,
    zipCode: lot.zipCode,
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
          handleLinkClick(lot, "google_maps");
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
          handleLinkClick(lot, "zillow");
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
          handleLinkClick(lot, "realtor");
          onNavigate?.();
        }}
      >
        {compact ? "Realtor.com" : "Search on Realtor.com"}
      </a>
    </div>
  );
}
