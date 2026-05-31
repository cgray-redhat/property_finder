import { NextResponse } from "next/server";
import {
  buildSearchResponse,
  enrichListingsWithMarketData,
} from "@/lib/rentcast/enrich";
import {
  getCachedListings,
  getCachedMarketData,
} from "@/lib/rentcast/cached-fetch";
import {
  LISTINGS_CACHE_TTL_MS,
  LISTINGS_MAX_RESULTS,
} from "@/lib/rentcast/cache-policy";
import { parseListingFiltersFromSearchParams } from "@/lib/rentcast/listing-filters";
import {
  createEmptySearchResponse,
  type PropertySearchErrorCode,
  type PropertySearchResponse,
} from "@/types/property";

export const runtime = "nodejs";

const ZIP_PATTERN = /^\d{5}$/;

function resolveZipCode(searchParams: URLSearchParams): string | null {
  return (
    searchParams.get("zipCode")?.trim() ??
    searchParams.get("zip")?.trim() ??
    (ZIP_PATTERN.test(searchParams.get("location")?.trim() ?? "")
      ? searchParams.get("location")!.trim()
      : null)
  );
}

function errorStatus(code: PropertySearchErrorCode): number {
  switch (code) {
    case "MISSING_ZIP_CODE":
    case "INVALID_ZIP_CODE":
      return 400;
    case "MISSING_API_KEY":
      return 503;
    case "RENTCAST_UNAUTHORIZED":
      return 401;
    case "RENTCAST_RATE_LIMITED":
      return 429;
    default:
      return 502;
  }
}

function jsonResponse(body: PropertySearchResponse, status = 200) {
  const maxAgeSeconds = Math.floor(LISTINGS_CACHE_TTL_MS / 1000);

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`,
      "X-Data-Last-Updated": body.lastUpdated,
    },
  });
}

/**
 * GET /api/properties/search?zipCode=78723
 * GET /api/properties/search?zipCode=78723&loadAll=true
 * GET /api/properties/search?zipCode=78723&propertyMinBedrooms=3&propertyMaxPrice=500000
 *
 * Fetches filtered property + land listing streams and zip market benchmarks.
 */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const zipCode = resolveZipCode(searchParams);
  const loadAll = searchParams.get("loadAll") === "true";
  const filters = parseListingFiltersFromSearchParams(searchParams);

  if (!zipCode) {
    return jsonResponse(
      createEmptySearchResponse("", {
        code: "MISSING_ZIP_CODE",
        message:
          "A zipCode query parameter is required (e.g. ?zipCode=78723).",
      }),
      400,
    );
  }

  if (!ZIP_PATTERN.test(zipCode)) {
    return jsonResponse(
      createEmptySearchResponse(zipCode, {
        code: "INVALID_ZIP_CODE",
        message: "zipCode must be a 5-digit US zip code.",
      }),
      400,
    );
  }

  try {
    const [listingsResult, marketResult] = await Promise.all([
      getCachedListings(zipCode, loadAll, filters),
      getCachedMarketData(zipCode),
    ]);

    if (!listingsResult.ok) {
      return jsonResponse(
        createEmptySearchResponse(zipCode, {
          code: listingsResult.code as PropertySearchErrorCode,
          message: listingsResult.message,
        }),
        errorStatus(listingsResult.code as PropertySearchErrorCode),
      );
    }

    const warnings: string[] = [...(listingsResult.warnings ?? [])];
    let marketData = null;

    if (!marketResult.ok) {
      if (marketResult.code === "RENTCAST_UNAUTHORIZED") {
        return jsonResponse(
          createEmptySearchResponse(zipCode, {
            code: "RENTCAST_UNAUTHORIZED",
            message: marketResult.message,
          }),
          401,
        );
      }

      if (marketResult.code === "RENTCAST_RATE_LIMITED") {
        return jsonResponse(
          createEmptySearchResponse(zipCode, {
            code: "RENTCAST_RATE_LIMITED",
            message: marketResult.message,
          }),
          429,
        );
      }

      warnings.push(`Market data unavailable: ${marketResult.message}`);
    } else {
      marketData = marketResult.data;
    }

    const { listings, scope, hasMoreListings, fetchedAt, filters: appliedFilters } =
      listingsResult.data;

    if (listings.length === 0) {
      warnings.push(
        "No listings matched your zip and filters. Try widening price or bed criteria.",
      );
    }

    if (loadAll && listings.length >= LISTINGS_MAX_RESULTS) {
      warnings.push(
        "Listing results were capped at 5,000 records. Some MLS listings may not be included.",
      );
    }

    if (!loadAll && hasMoreListings) {
      warnings.push(
        `Showing the first page of filtered results. Use "Load all listings" to fetch additional pages.`,
      );
    }

    const properties = enrichListingsWithMarketData(
      listings,
      marketData,
      fetchedAt,
    );

    const response = buildSearchResponse(
      zipCode,
      properties,
      marketData,
      warnings,
      {
        listingsScope: scope,
        hasMoreListings: loadAll ? false : hasMoreListings,
        appliedFilters,
      },
    );

    return jsonResponse(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Property search failed";

    return jsonResponse(
      createEmptySearchResponse(zipCode, {
        code: "RENTCAST_ERROR",
        message,
      }),
      502,
    );
  }
}
