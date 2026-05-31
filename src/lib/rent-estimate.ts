import type { EnrichedPropertyListing } from "@/types/property";

/** Monthly rent estimate source for underwriting transparency. */
export type RentEstimateSource =
  | "api"
  | "override"
  | "zip_fallback"
  | "one_percent_rule";

export type RentEstimate = {
  monthlyRent: number;
  source: RentEstimateSource;
  isFallback: boolean;
  isSparse: boolean;
};

/** Default monthly rent fallback: 1% of purchase price (common investor heuristic). */
export const DEFAULT_RENT_FALLBACK_RATE = 0.01;

type ResolveRentInput = {
  property: EnrichedPropertyListing;
  rentOverride?: number | null;
  zipMedianRent?: number | null;
};

/**
 * Resolve monthly rent with override → API → zip aggregate → 1% rule fallback chain.
 */
export function resolveMonthlyRent(input: ResolveRentInput): RentEstimate {
  const { property, rentOverride, zipMedianRent } = input;

  if (rentOverride != null && rentOverride > 0) {
    return {
      monthlyRent: rentOverride,
      source: "override",
      isFallback: false,
      isSparse: false,
    };
  }

  const { medianRent, averageRent, matchType } = property.rentalBenchmarks;

  if (medianRent != null && medianRent > 0) {
    return {
      monthlyRent: medianRent,
      source: "api",
      isFallback: false,
      isSparse: matchType === "zip_aggregate",
    };
  }

  if (averageRent != null && averageRent > 0) {
    return {
      monthlyRent: averageRent,
      source: "api",
      isFallback: true,
      isSparse: true,
    };
  }

  if (zipMedianRent != null && zipMedianRent > 0) {
    return {
      monthlyRent: zipMedianRent,
      source: "zip_fallback",
      isFallback: true,
      isSparse: true,
    };
  }

  const ruleBasedRent = Math.round(property.price * DEFAULT_RENT_FALLBACK_RATE);

  return {
    monthlyRent: ruleBasedRent,
    source: "one_percent_rule",
    isFallback: true,
    isSparse: true,
  };
}

export function hasReliableRentData(property: EnrichedPropertyListing): boolean {
  return (
    property.rentalBenchmarks.medianRent != null &&
    property.rentalBenchmarks.medianRent > 0
  );
}

export function countSparseRentProperties(
  properties: EnrichedPropertyListing[],
): number {
  return properties.filter((property) => !hasReliableRentData(property)).length;
}

export function rentSourceLabel(source: RentEstimateSource): string {
  switch (source) {
    case "api":
      return "RentCast benchmark";
    case "override":
      return "Manual override";
    case "zip_fallback":
      return "Zip median fallback";
    case "one_percent_rule":
      return "1% purchase-price rule";
  }
}
