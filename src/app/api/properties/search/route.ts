import { NextResponse } from "next/server";
import { parseSearchLocation } from "@/lib/integrations";
import { runPropertySearchPipeline } from "@/lib/pipeline/property-search";

export const runtime = "nodejs";

type SearchParams = {
  location?: string;
  zip?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
};

function getSearchParams(request: Request): SearchParams {
  const { searchParams } = new URL(request.url);

  return {
    location: searchParams.get("location") ?? undefined,
    zip: searchParams.get("zip") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    neighborhood: searchParams.get("neighborhood") ?? undefined,
  };
}

/**
 * GET /api/properties/search
 *
 * Query by city, zip, or neighborhood:
 *   ?location=94110
 *   ?location=Austin,TX
 *   ?neighborhood=Mission District&city=San Francisco&state=CA
 *   ?zip=78701
 */
export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);

    if (
      !params.location &&
      !params.zip &&
      !params.city &&
      !params.neighborhood
    ) {
      return NextResponse.json(
        {
          error: "Missing location query",
          message:
            "Provide location, zip, city, or neighborhood query parameters.",
          examples: [
            "/api/properties/search?location=94110",
            "/api/properties/search?location=Austin,TX",
            "/api/properties/search?neighborhood=Mission District&city=San Francisco&state=CA",
          ],
        },
        { status: 400 },
      );
    }

    const searchLocation = parseSearchLocation(params);
    const result = await runPropertySearchPipeline(searchLocation);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Last-Updated": result.lastUpdated,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Property search failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
