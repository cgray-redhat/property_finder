"use client";

import { useState } from "react";
import {
  PROPERTY_SEARCH_API,
  type PropertySearchQuery,
  type PropertySearchResponse,
} from "@/lib/api/search";

function buildSearchUrl(query: PropertySearchQuery): string {
  const params = new URLSearchParams();
  const zipCode = query.zipCode?.trim() || query.zip?.trim() || query.location?.trim();

  if (zipCode) {
    params.set("zipCode", zipCode);
  }

  return `${PROPERTY_SEARCH_API}?${params.toString()}`;
}

function formatCurrency(value: number | null): string {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function PropertySearchPanel() {
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PropertySearchResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!zipCode.trim()) {
      setError("Enter a 5-digit zip code.");
      return;
    }

    if (!/^\d{5}$/.test(zipCode.trim())) {
      setError("Zip code must be exactly 5 digits.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildSearchUrl({ zipCode }));

      const data = (await response.json()) as PropertySearchResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message ?? "Search failed");
      }

      setResults(data);
    } catch (err) {
      setResults(null);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900">Search properties</h2>
          <p className="text-sm text-zinc-600">
            Enter a US zip code to load active for-sale listings from RentCast,
            enriched with local rental market benchmarks.
          </p>
        </div>

        <div className="mt-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Zip code</span>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="78723"
              maxLength={5}
              inputMode="numeric"
              className={inputClassName}
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Searching…" : "Search listings"}
        </button>
      </form>

      {results && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">
                {results.meta.listingCount} listing
                {results.meta.listingCount === 1 ? "" : "s"} in {results.zipCode}
              </h3>
              {results.marketSummary && (
                <p className="text-sm text-zinc-600">
                  Zip median rent:{" "}
                  {formatCurrency(results.marketSummary.rental.medianRent)}/mo
                </p>
              )}
              {results.meta.warnings.length > 0 && (
                <ul className="mt-2 text-sm text-amber-700">
                  {results.meta.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Last updated {formatDate(results.lastUpdated)}
            </p>
          </div>

          <div className="grid gap-4">
            {results.properties.map((property) => (
              <article
                key={property.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-zinc-900">
                      {property.formattedAddress}
                    </h4>
                    <p className="text-sm text-zinc-600">
                      {property.propertyType ?? "Residential"}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-emerald-800">
                    {formatCurrency(property.price)}
                  </p>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-zinc-500">Beds / baths</dt>
                    <dd className="font-medium text-zinc-900">
                      {property.bedrooms ?? "—"} bd · {property.bathrooms ?? "—"} ba
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Size</dt>
                    <dd className="font-medium text-zinc-900">
                      {property.squareFootage
                        ? `${property.squareFootage.toLocaleString()} sqft`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Median rent (zip)</dt>
                    <dd className="font-medium text-zinc-900">
                      {formatCurrency(property.rentalBenchmarks.medianRent)}/mo
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Rent benchmark</dt>
                    <dd className="font-medium text-zinc-900">
                      {property.rentalBenchmarks.matchType === "bedroom"
                        ? `${property.rentalBenchmarks.bedroomCount} bd comps`
                        : "Zip aggregate"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
