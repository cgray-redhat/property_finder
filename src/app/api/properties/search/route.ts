import { NextResponse } from "next/server";
import {
  buildSearchResponse,
  enrichListingsWithMarketData,
} from "@/lib/rentcast/enrich";
import {
  fetchRentCastMarketData,
  fetchRentCastSaleListings,
} from "@/lib/rentcast/client";
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
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Data-Last-Updated": body.lastUpdated,
    },
  });
}

/**
 * GET /api/properties/search?zipCode=78723
 *
 * Fetches active for-sale listings and zip-level rental market benchmarks
 * from RentCast, then returns a blended standardized JSON payload.
 */
export async function GET(request: Request) {
  const zipCode = resolveZipCode(new URL(request.url).searchParams);

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
      fetchRentCastSaleListings(zipCode),
      fetchRentCastMarketData(zipCode),
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

    const warnings: string[] = [];
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

    const lastUpdated = new Date().toISOString();
    const listings = Array.isArray(listingsResult.data)
      ? listingsResult.data
      : [];

    if (listings.length === 0) {
      warnings.push("No active listings returned for this zip code.");
    }

    const properties = enrichListingsWithMarketData(
      listings,
      marketData,
      lastUpdated,
    );

    const response = buildSearchResponse(
      zipCode,
      properties,
      marketData,
      warnings,
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
