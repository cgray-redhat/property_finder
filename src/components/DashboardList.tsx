"use client";

import {
  capRateToneClasses,
  getCapRateTone,
} from "@/lib/rank-properties";
import { isLotListing } from "@/lib/property-classification";
import { countSparseRentProperties, rentSourceLabel } from "@/lib/rent-estimate";
import { trackEvent } from "@/lib/analytics";
import {
  useAppMode,
  useLotListings,
  useRankedProperties,
} from "@/hooks/use-ranked-properties";
import { useInvestLocateStore } from "@/store/invest-locate-store";
import { formatLotSize } from "@/lib/lot-attributes";
import { ListingExternalLinks } from "@/components/listing/ListingExternalLinks";
import { LotWaterBadges } from "@/components/lot/LotWaterBadges";
import { MarketRentErrorState } from "@/components/errors/MarketRentErrorState";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

type DashboardListProps = {
  compact?: boolean;
};

export function DashboardList({ compact = false }: DashboardListProps) {
  const appMode = useAppMode();
  const searchResults = useInvestLocateStore((state) => state.searchResults);
  const downPaymentPercent = useInvestLocateStore(
    (state) => state.downPaymentPercent,
  );
  const interestRateAnnual = useInvestLocateStore(
    (state) => state.interestRateAnnual,
  );
  const selectedPropertyId = useInvestLocateStore(
    (state) => state.selectedPropertyId,
  );
  const setSelectedPropertyId = useInvestLocateStore(
    (state) => state.setSelectedPropertyId,
  );
  const rankedProperties = useRankedProperties();
  const lotListings = useLotListings();
  const isLotMode = appMode === "lot_finder";

  function handlePropertyClick(propertyId: string, address: string, rank: number) {
    setSelectedPropertyId(propertyId);
    trackEvent("Property Listing Clicked", {
      property_id: propertyId,
      address,
      rank: rank + 1,
      zip_code: searchResults?.zipCode ?? null,
      source: "list",
      mode: appMode,
    });
  }

  if (!searchResults) {
    return (
      <section className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            {isLotMode ? "Land listings will appear here" : "Stack-ranked deals will appear here"}
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            Search a zip code to load listings, then click a row or map pin for
            details.
          </p>
        </div>
      </section>
    );
  }

  if (isLotMode) {
    if (lotListings.length === 0) {
      return (
        <section className="flex h-full items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              No land listings found
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              No vacant lots or land parcels matched in {searchResults.zipCode}.
              Try another zip or switch to Property Finder for homes and rentals.
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="flex h-full min-h-0 flex-col gap-3">
        {!compact && (
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              Lot Finder — sorted by price
            </h3>
            <p className="text-sm text-zinc-600">
              {lotListings.length} land listing
              {lotListings.length === 1 ? "" : "s"} in {searchResults.zipCode}
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Property</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell">Links</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="hidden px-3 py-3 font-medium md:table-cell">Lot size</th>
                <th className="hidden px-3 py-3 font-medium lg:table-cell">Water</th>
              </tr>
            </thead>
            <tbody>
              {lotListings.map((lot, index) => {
                const isSelected = lot.id === selectedPropertyId;

                return (
                  <tr
                    key={lot.id}
                    onClick={() =>
                      handlePropertyClick(lot.id, lot.formattedAddress, index)
                    }
                    className={`cursor-pointer border-b border-zinc-100 bg-indigo-50/40 transition-colors last:border-b-0 hover:bg-indigo-50 ${isSelected ? "ring-2 ring-inset ring-indigo-500" : ""}`}
                  >
                    <td className="px-3 py-3 font-semibold text-zinc-900">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-zinc-900">
                        {lot.formattedAddress}
                      </p>
                      <div className="mt-1 sm:hidden">
                        <ListingExternalLinks listing={lot} mode="lot_finder" compact />
                      </div>
                      <div className="mt-1 lg:hidden">
                        <LotWaterBadges lot={lot} compact />
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <ListingExternalLinks listing={lot} mode="lot_finder" compact />
                    </td>
                    <td className="px-3 py-3 text-zinc-700">
                      {lot.propertyType ?? "Land / Lot"}
                    </td>
                    <td className="px-3 py-3 font-medium tabular-nums text-zinc-900">
                      {formatCurrency(lot.price)}
                    </td>
                    <td className="hidden px-3 py-3 tabular-nums text-zinc-700 md:table-cell">
                      {formatLotSize(lot.lotSizeSqFt)}
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      <LotWaterBadges lot={lot} compact />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const sparseCount = countSparseRentProperties(
    searchResults.properties.filter((property) => !isLotListing(property)),
  );
  const marketDataMissing = searchResults.marketSummary == null;
  const showRentWarning = sparseCount > 0 || marketDataMissing;

  if (rankedProperties.length === 0) {
    return (
      <section className="flex h-full flex-col gap-4">
        {showRentWarning && (
          <MarketRentErrorState
            zipCode={searchResults.zipCode}
            sparseCount={sparseCount}
            totalCount={searchResults.properties.length}
            warnings={searchResults.meta.warnings}
            marketDataMissing={marketDataMissing}
          />
        )}
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              No rental properties to display
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              No homes with bed/bath data matched in {searchResults.zipCode}.
              Switch to Lot Finder to view land listings.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      {showRentWarning && (
        <MarketRentErrorState
          zipCode={searchResults.zipCode}
          sparseCount={sparseCount}
          totalCount={searchResults.properties.length}
          warnings={searchResults.meta.warnings}
          marketDataMissing={marketDataMissing}
        />
      )}

      {!compact && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Stack-ranked by Cash-on-Cash return
          </h3>
          <p className="text-sm text-zinc-600">
            {rankedProperties.length} listings ·{" "}
            {formatPercent(downPaymentPercent, 0)} down @{" "}
            {formatPercent(interestRateAnnual)} interest
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">Property</th>
              <th className="hidden px-3 py-3 font-medium sm:table-cell">Links</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="hidden px-3 py-3 font-medium sm:table-cell">Rent</th>
              <th className="px-3 py-3 font-medium">Cap</th>
              <th className="px-3 py-3 font-medium">CoC</th>
            </tr>
          </thead>
          <tbody>
            {rankedProperties.map((property, index) => {
              const tone = getCapRateTone(property.underwriting.capRate);
              const isSelected = property.id === selectedPropertyId;

              return (
                <tr
                  key={property.id}
                  onClick={() =>
                    handlePropertyClick(
                      property.id,
                      property.formattedAddress,
                      index,
                    )
                  }
                  className={`cursor-pointer border-b border-zinc-100 transition-colors last:border-b-0 hover:bg-zinc-50 ${capRateToneClasses[tone]} ${isSelected ? "ring-2 ring-inset ring-emerald-500" : ""}`}
                >
                  <td className="px-3 py-3 font-semibold text-zinc-900">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-zinc-900">
                      {property.formattedAddress}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {property.bedrooms ?? "—"} bd · {property.bathrooms ?? "—"}{" "}
                      ba
                    </p>
                    <div className="mt-1 sm:hidden">
                      <ListingExternalLinks
                        listing={property}
                        mode="property_finder"
                        compact
                      />
                    </div>
                    {property.rentEstimate.isFallback && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Est. rent · {rentSourceLabel(property.rentEstimate.source)}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <ListingExternalLinks
                      listing={property}
                      mode="property_finder"
                      compact
                    />
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {property.propertyType ?? "Residential"}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-zinc-900">
                    {formatCurrency(property.price)}
                  </td>
                  <td className="hidden px-3 py-3 tabular-nums text-zinc-700 sm:table-cell">
                    {formatCurrency(property.estimatedMonthlyRent)}
                  </td>
                  <td className="px-3 py-3 font-medium tabular-nums text-zinc-900">
                    {formatPercent(property.underwriting.capRate)}
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums text-emerald-800">
                    {formatPercent(property.underwriting.cashOnCashReturn)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
