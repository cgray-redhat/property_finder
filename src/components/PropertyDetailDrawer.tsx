"use client";

import { useState } from "react";
import {
  useAppMode,
  useSelectedLotListing,
  useSelectedRankedProperty,
} from "@/hooks/use-ranked-properties";
import { useInvestLocateStore } from "@/store/invest-locate-store";
import {
  DEFAULT_MAINTENANCE_RATE,
  DEFAULT_VACANCY_RATE,
} from "@/lib/calculations";
import { rentSourceLabel } from "@/lib/rent-estimate";
import { trackEvent } from "@/lib/analytics";

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

type LineItemProps = {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
};

function LineItem({ label, value, detail, emphasis }: LineItemProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p
          className={`text-sm ${emphasis ? "font-semibold text-zinc-900" : "text-zinc-700"}`}
        >
          {label}
        </p>
        {detail && <p className="text-xs text-zinc-500">{detail}</p>}
      </div>
      <p
        className={`shrink-0 text-sm tabular-nums ${emphasis ? "font-semibold text-zinc-900" : "text-zinc-800"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function PropertyDetailDrawer() {
  const appMode = useAppMode();
  const lot = useSelectedLotListing();
  const property = useSelectedRankedProperty();
  const setSelectedPropertyId = useInvestLocateStore(
    (state) => state.setSelectedPropertyId,
  );
  const setRentOverride = useInvestLocateStore((state) => state.setRentOverride);
  const clearRentOverride = useInvestLocateStore(
    (state) => state.clearRentOverride,
  );
  const rentOverrides = useInvestLocateStore((state) => state.rentOverrides);
  const [overrideInput, setOverrideInput] = useState("");

  if (appMode === "lot_finder") {
    if (!lot) {
      return null;
    }

    return (
      <>
        <button
          type="button"
          aria-label="Close property details"
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setSelectedPropertyId(null)}
        />

        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-indigo-700">
                Lot Finder
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                {lot.formattedAddress}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {lot.propertyType ?? "Land / Lot"} · {formatCurrency(lot.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPropertyId(null)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <section className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
              <p className="font-medium">Land listing</p>
              <p className="mt-1">
                Rental cash-flow metrics are not applied to vacant lots. Use
                Property Finder for income-producing homes and rentals.
              </p>
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Parcel details
              </h3>
              <div className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 px-4">
                <LineItem label="List price" value={formatCurrency(lot.price)} emphasis />
                <LineItem
                  label="Square footage"
                  value={
                    lot.squareFootage
                      ? lot.squareFootage.toLocaleString()
                      : "Not listed"
                  }
                />
                <LineItem
                  label="Bedrooms / baths"
                  value={`${lot.bedrooms ?? 0} bd · ${lot.bathrooms ?? 0} ba`}
                  detail="Identified as land — no residential bed/bath count"
                />
                <LineItem
                  label="Days on market"
                  value={
                    lot.daysOnMarket != null ? String(lot.daysOnMarket) : "—"
                  }
                />
              </div>
            </section>
          </div>
        </aside>
      </>
    );
  }

  if (!property) {
    return null;
  }

  const propertyId = property.id;

  function handleApplyOverride() {
    const value = Number(overrideInput);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    setRentOverride(propertyId, value);
    trackEvent("Property Listing Clicked", {
      property_id: propertyId,
      action: "rent_override_applied",
      monthly_rent: value,
    });
  }

  const { underwriting } = property;
  const { operatingExpenses } = underwriting;
  const hasOverride = propertyId in rentOverrides;

  return (
    <>
      <button
        type="button"
        aria-label="Close property details"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={() => setSelectedPropertyId(null)}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
              Deal breakdown
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900">
              {property.formattedAddress}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {property.propertyType ?? "Residential"} ·{" "}
              {formatCurrency(property.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPropertyId(null)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {property.rentEstimate.isFallback && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              <p className="font-medium">Estimated rent in use</p>
              <p className="mt-1">
                Market rent data is sparse for this address. Current estimate
                uses {rentSourceLabel(property.rentEstimate.source)}. Override
                below if you have local knowledge.
              </p>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Rental override
            </h3>
            <div className="mt-2 rounded-xl border border-zinc-200 p-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  Monthly rent override
                </span>
                <input
                  type="number"
                  min={1}
                  step={50}
                  placeholder={String(property.estimatedMonthlyRent)}
                  value={overrideInput}
                  onChange={(event) => setOverrideInput(event.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyOverride}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Apply override
                </button>
                {hasOverride && (
                  <button
                    type="button"
                    onClick={() => {
                      clearRentOverride(propertyId);
                      setOverrideInput("");
                    }}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Income
            </h3>
            <div className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 px-4">
              <LineItem
                label="Estimated monthly rent"
                value={`${formatCurrency(property.estimatedMonthlyRent)}/mo`}
                detail={rentSourceLabel(property.rentEstimate.source)}
              />
              <LineItem
                label="Gross annual rent"
                value={formatCurrency(underwriting.grossAnnualRent)}
                emphasis
              />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Operating expenses
            </h3>
            <div className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 px-4">
              <LineItem
                label="Vacancy allowance"
                value={`-${formatCurrency(operatingExpenses.vacancy)}`}
                detail={`${formatPercent(DEFAULT_VACANCY_RATE, 0)} of gross rent (PRD default)`}
              />
              <LineItem
                label="Maintenance reserve"
                value={`-${formatCurrency(operatingExpenses.maintenance)}`}
                detail={`${formatPercent(DEFAULT_MAINTENANCE_RATE, 0)} of purchase price (PRD default)`}
              />
              <LineItem
                label="Property taxes"
                value={
                  operatingExpenses.propertyTaxes > 0
                    ? `-${formatCurrency(operatingExpenses.propertyTaxes)}`
                    : "Not estimated"
                }
                detail={
                  operatingExpenses.propertyTaxes > 0
                    ? "Local tax estimate applied"
                    : "Add local tax data when available"
                }
              />
              <LineItem
                label="Insurance"
                value={
                  operatingExpenses.insurance > 0
                    ? `-${formatCurrency(operatingExpenses.insurance)}`
                    : "Not estimated"
                }
                detail={
                  operatingExpenses.insurance > 0
                    ? "Insurance estimate applied"
                    : "Add insurance data when available"
                }
              />
              <LineItem
                label="Total operating expenses"
                value={`-${formatCurrency(operatingExpenses.total)}`}
                emphasis
              />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Returns
            </h3>
            <div className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 px-4">
              <LineItem
                label="Net Operating Income (NOI)"
                value={formatCurrency(underwriting.noi)}
                detail="Excludes mortgage payments"
                emphasis
              />
              <LineItem
                label="Annual debt service"
                value={`-${formatCurrency(underwriting.annualMortgagePayment)}`}
                detail="Based on current What-If financing"
              />
              <LineItem
                label="Annual cash flow"
                value={formatCurrency(underwriting.annualCashFlow)}
                emphasis
              />
              <LineItem
                label="Cap rate"
                value={formatPercent(underwriting.capRate)}
              />
              <LineItem
                label="Cash-on-Cash return"
                value={formatPercent(underwriting.cashOnCashReturn)}
                emphasis
              />
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
