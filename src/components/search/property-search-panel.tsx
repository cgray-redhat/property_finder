"use client";

import { useState } from "react";
import {
  PROPERTY_SEARCH_API,
  type PropertySearchQuery,
  type PropertySearchResponse,
} from "@/lib/api/search";
import { useInvestLocateStore } from "@/store/invest-locate-store";

function buildSearchUrl(query: PropertySearchQuery): string {
  const params = new URLSearchParams();
  const zipCode = query.zipCode?.trim() || query.zip?.trim() || query.location?.trim();

  if (zipCode) {
    params.set("zipCode", zipCode);
  }

  return `${PROPERTY_SEARCH_API}?${params.toString()}`;
}

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function PropertySearchPanel() {
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSearchResults = useInvestLocateStore((state) => state.setSearchResults);
  const searchResults = useInvestLocateStore((state) => state.searchResults);

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

      setSearchResults(data);
    } catch (err) {
      setSearchResults(null);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-900">Search properties</h2>
        <p className="text-sm text-zinc-600">
          Enter a US zip code to load active listings and stack-rank them by
          investment returns.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
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

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mb-0.5"
        >
          {isLoading ? "Searching…" : "Search listings"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {searchResults?.meta.warnings.length ? (
        <ul className="mt-4 text-sm text-amber-700">
          {searchResults.meta.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
