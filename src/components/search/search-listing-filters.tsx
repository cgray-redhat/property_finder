"use client";

import type { ListingSearchFilters } from "@/lib/rentcast/listing-filters";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

type SearchListingFiltersProps = {
  filters: ListingSearchFilters;
  onChange: (filters: ListingSearchFilters) => void;
  disabled?: boolean;
};

function parseOptionalPrice(value: string): number | undefined {
  const trimmed = value.trim().replace(/[$,]/g, "");

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

function formatPriceInput(value: number | undefined): string {
  return value != null ? String(value) : "";
}

export function SearchListingFilters({
  filters,
  onChange,
  disabled = false,
}: SearchListingFiltersProps) {
  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <fieldset className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
        <legend className="px-1 text-sm font-semibold text-emerald-950">
          Property Finder filters
        </legend>
        <p className="mb-3 text-xs text-emerald-900/80">
          Sent to RentCast for homes and rentals (1+ beds excludes vacant lots).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Min beds</span>
            <select
              value={String(filters.propertyMinBedrooms ?? 1)}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...filters,
                  propertyMinBedrooms: Number(event.target.value),
                })
              }
              className={inputClassName}
            >
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Max price</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="No limit"
              disabled={disabled}
              value={formatPriceInput(filters.propertyMaxPrice)}
              onChange={(event) =>
                onChange({
                  ...filters,
                  propertyMaxPrice: parseOptionalPrice(event.target.value),
                })
              }
              className={inputClassName}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
        <legend className="px-1 text-sm font-semibold text-indigo-950">
          Lot Finder filters
        </legend>
        <p className="mb-3 text-xs text-indigo-900/80">
          Land listings only — property type filtered at RentCast.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Max price</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="No limit"
            disabled={disabled}
            value={formatPriceInput(filters.lotMaxPrice)}
            onChange={(event) =>
              onChange({
                ...filters,
                lotMaxPrice: parseOptionalPrice(event.target.value),
              })
            }
            className={inputClassName}
          />
        </label>
      </fieldset>
    </div>
  );
}
