"use client";

import {
  capRateToneClasses,
  getCapRateTone,
} from "@/lib/rank-properties";
import { useRankedProperties } from "@/hooks/use-ranked-properties";
import { useInvestLocateStore } from "@/store/invest-locate-store";

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

  if (!searchResults) {
    return (
      <section className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Stack-ranked deals will appear here
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            Search a zip code to load listings, then click a row or map pin for
            a full expense breakdown.
          </p>
        </div>
      </section>
    );
  }

  if (rankedProperties.length === 0) {
    return (
      <section className="flex h-full items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            No underwritable listings
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            Listings in {searchResults.zipCode} are missing rental benchmark
            data needed for ROI calculations.
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
                  onClick={() => setSelectedPropertyId(property.id)}
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
