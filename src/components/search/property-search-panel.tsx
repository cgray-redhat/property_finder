"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildSearchUrl,
  LISTINGS_PAGE_SIZE,
  type PropertySearchQuery,
  type PropertySearchResponse,
} from "@/lib/api/search";
import { describeListingFilters } from "@/lib/rentcast/listing-filters";
import {
  getPublicMlsFixtureZip,
  isPublicMlsFixtureModeEnabled,
} from "@/lib/fixtures/public-fixture-config";
import { isCachedSearchFresh } from "@/lib/search-freshness";
import { MlsFixtureBanner } from "@/components/search/MlsFixtureBanner";
import { SearchListingFilters } from "@/components/search/search-listing-filters";
import { useInvestLocateStore } from "@/store/invest-locate-store";

const fixtureModeEnabled = isPublicMlsFixtureModeEnabled();
const fixtureZipCode = getPublicMlsFixtureZip();

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function PropertySearchPanel() {
  const [zipCode, setZipCode] = useState(fixtureModeEnabled ? fixtureZipCode : "");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);
  const autoSearchStarted = useRef(false);
  const setSearchResults = useInvestLocateStore((state) => state.setSearchResults);
  const searchResults = useInvestLocateStore((state) => state.searchResults);
  const searchFilters = useInvestLocateStore((state) => state.searchFilters);
  const setSearchFilters = useInvestLocateStore((state) => state.setSearchFilters);

  useEffect(() => {
    if (searchResults?.zipCode) {
      setZipCode(searchResults.zipCode);
    }
  }, [searchResults?.zipCode]);

  useEffect(() => {
    if (searchResults?.meta.appliedFilters) {
      setSearchFilters(searchResults.meta.appliedFilters);
    }
  }, [searchResults?.meta.appliedFilters, setSearchFilters]);

  useEffect(() => {
    if (!fixtureModeEnabled || autoSearchStarted.current) {
      return;
    }

    autoSearchStarted.current = true;

    async function loadFixtureSearch() {
      setIsLoading(true);
      setError(null);

      try {
        await runSearch({
          zipCode: fixtureZipCode,
          loadAll: true,
          filters: searchFilters,
        });
      } catch (err) {
        setSearchResults(null);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    }

    void loadFixtureSearch();
  }, [searchFilters, setSearchResults]);

  async function runSearch(query: PropertySearchQuery) {
    setError(null);
    setCacheNotice(null);

    const response = await fetch(buildSearchUrl(query));
    const data = (await response.json()) as PropertySearchResponse;

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message ?? "Search failed");
    }

    setSearchResults(data);
    return data;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!zipCode.trim()) {
      setError("Enter a 5-digit zip code.");
      return;
    }

    if (!/^\d{5}$/.test(zipCode.trim())) {
      setError("Zip code must be exactly 5 digits.");
      return;
    }

    if (
      isCachedSearchFresh(searchResults, zipCode.trim(), {
        filters: searchFilters,
      })
    ) {
      setCacheNotice(
        `Using cached results for ${zipCode.trim()} with the current filters.`,
      );
      return;
    }

    setIsLoading(true);

    try {
      await runSearch({
        zipCode: zipCode.trim(),
        loadAll: fixtureModeEnabled,
        filters: searchFilters,
      });
    } catch (err) {
      setSearchResults(null);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadAll() {
    if (!searchResults?.zipCode) {
      return;
    }

    const filters = searchResults.meta.appliedFilters ?? searchFilters;

    if (
      isCachedSearchFresh(searchResults, searchResults.zipCode, {
        requireAllListings: true,
        filters,
      })
    ) {
      setCacheNotice("All filtered listings for this zip are already loaded.");
      return;
    }

    setIsLoadingAll(true);
    setError(null);
    setCacheNotice(null);

    try {
      await runSearch({
        zipCode: searchResults.zipCode,
        loadAll: true,
        filters,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load all listings");
    } finally {
      setIsLoadingAll(false);
    }
  }

  const showLoadAll =
    !fixtureModeEnabled &&
    searchResults?.success &&
    searchResults.meta.hasMoreListings &&
    searchResults.meta.listingsScope === "first_page";

  const filterSummary = describeListingFilters(searchFilters);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-900">Search by zip code</h2>
        <p className="text-sm text-zinc-600">
          {fixtureModeEnabled
            ? `Fixture mode is active. Search zip ${fixtureZipCode} to load saved MLS test listings with filters applied locally.`
            : `Filters are applied at RentCast before results are downloaded — up to ${LISTINGS_PAGE_SIZE.toLocaleString()} listings per stream (properties + land). Both modes share one search. Cached for 30 minutes per zip + filter combination.`}
        </p>
      </div>

      <MlsFixtureBanner />

      <div className="mt-4">
        <SearchListingFilters
          filters={searchFilters}
          onChange={setSearchFilters}
          disabled={isLoading || isLoadingAll}
        />

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Zip code</span>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder={fixtureModeEnabled ? fixtureZipCode : "78723"}
            maxLength={5}
            inputMode="numeric"
            className={inputClassName}
          />
        </label>

        <button
          type="submit"
          disabled={isLoading || isLoadingAll}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mb-0.5"
        >
          {isLoading ? "Searching…" : "Search listings"}
        </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Property stream: {filterSummary.property}. Lot stream: {filterSummary.lot}.
        </p>
      </div>

      {searchResults?.success && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Loaded {searchResults.meta.listingCount} listing
            {searchResults.meta.listingCount === 1 ? "" : "s"} for{" "}
            {searchResults.zipCode}: {searchResults.meta.propertyCount} rental
            propert{searchResults.meta.propertyCount === 1 ? "y" : "ies"} and{" "}
            {searchResults.meta.lotCount} lot
            {searchResults.meta.lotCount === 1 ? "" : "s"}.
            {searchResults.meta.listingsScope === "first_page" &&
              searchResults.meta.hasMoreListings &&
              " More filtered listings may be available."}
          </p>

          {showLoadAll && (
            <button
              type="button"
              onClick={handleLoadAll}
              disabled={isLoadingAll || isLoading}
              className="w-fit rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-900 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingAll ? "Loading all listings…" : "Load all listings"}
            </button>
          )}
        </div>
      )}

      {cacheNotice && (
        <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {cacheNotice}
        </p>
      )}

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
