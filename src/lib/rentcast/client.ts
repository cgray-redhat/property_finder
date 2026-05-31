import type {
  RentCastMarketData,
  RentCastSaleListing,
} from "@/types/property";
import {
  LISTINGS_MAX_RESULTS,
  LISTINGS_PAGE_SIZE,
} from "@/lib/rentcast/cache-policy";

export { LISTINGS_PAGE_SIZE, LISTINGS_MAX_RESULTS };

const RENTCAST_BASE_URL = "https://api.rentcast.io/v1";

export type FetchListingsOptions = {
  /** When false (default), only the first page (500) is fetched. */
  loadAll?: boolean;
};

export type RentCastFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; code: string; message: string };

function getApiKey(): string | undefined {
  return process.env.RENTCAST_API_KEY?.trim() || undefined;
}

async function rentCastFetch<T>(
  path: string,
  apiKey: string,
): Promise<RentCastFetchResult<T>> {
  const response = await fetch(`${RENTCAST_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Api-Key": apiKey,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return {
      ok: false,
      status: 401,
      code: "RENTCAST_UNAUTHORIZED",
      message: "RentCast API key is invalid or unauthorized.",
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      status: 429,
      code: "RENTCAST_RATE_LIMITED",
      message: "RentCast API rate limit exceeded. Try again later.",
    };
  }

  if (!response.ok) {
    let message = `RentCast request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore JSON parse errors on error responses
    }

    return {
      ok: false,
      status: response.status,
      code: "RENTCAST_ERROR",
      message,
    };
  }

  const data = (await response.json()) as T;

  return { ok: true, data, status: response.status };
}

export async function fetchRentCastSaleListings(
  zipCode: string,
  options: FetchListingsOptions = {},
): Promise<RentCastFetchResult<RentCastSaleListing[]>> {
  const { loadAll = false } = options;
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      code: "MISSING_API_KEY",
      message: "RENTCAST_API_KEY is not configured on the server.",
    };
  }

  const allListings: RentCastSaleListing[] = [];
  let offset = 0;

  do {
    const params = new URLSearchParams({
      zipCode,
      status: "Active",
      limit: String(LISTINGS_PAGE_SIZE),
      offset: String(offset),
    });

    const pageResult = await rentCastFetch<RentCastSaleListing[]>(
      `/listings/sale?${params.toString()}`,
      apiKey,
    );

    if (!pageResult.ok) {
      return offset === 0
        ? pageResult
        : {
            ok: true,
            data: allListings,
            status: pageResult.status,
          };
    }

    const page = Array.isArray(pageResult.data) ? pageResult.data : [];
    allListings.push(...page);

    if (page.length < LISTINGS_PAGE_SIZE) {
      break;
    }

    offset += LISTINGS_PAGE_SIZE;
  } while (loadAll && offset < LISTINGS_MAX_RESULTS);

  return { ok: true, data: allListings, status: 200 };
}

export async function fetchRentCastMarketData(
  zipCode: string,
): Promise<RentCastFetchResult<RentCastMarketData>> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      code: "MISSING_API_KEY",
      message: "RENTCAST_API_KEY is not configured on the server.",
    };
  }

  const params = new URLSearchParams({ zipCode });

  return rentCastFetch<RentCastMarketData>(
    `/markets?${params.toString()}`,
    apiKey,
  );
}

export function isRentCastConfigured(): boolean {
  return Boolean(getApiKey());
}
