import { isLotListing } from "@/lib/property-classification";
import { runUnderwriting, type UnderwritingResult } from "@/lib/calculations";
import {
  resolveMonthlyRent,
  type RentEstimate,
} from "@/lib/rent-estimate";
import type { EnrichedPropertyListing } from "@/types/property";

export type RankedProperty = EnrichedPropertyListing & {
  estimatedMonthlyRent: number;
  rentEstimate: RentEstimate;
  underwriting: UnderwritingResult;
};

type RankPropertiesOptions = {
  downPaymentPercent: number;
  interestRateAnnual: number;
  rentOverrides?: Record<string, number>;
  zipMedianRent?: number | null;
};

/**
 * Underwrite each listing and stack-rank by Cash-on-Cash return (descending).
 * Applies rental overrides and fallback estimates when API data is sparse.
 */
export function rankProperties(
  properties: EnrichedPropertyListing[],
  options: RankPropertiesOptions,
): RankedProperty[] {
  const ranked = properties
    .filter((property) => !isLotListing(property))
    .map((property) => {
    const rentEstimate = resolveMonthlyRent({
      property,
      rentOverride: options.rentOverrides?.[property.id],
      zipMedianRent: options.zipMedianRent,
    });

    const underwriting = runUnderwriting({
      property: {
        purchasePrice: property.price,
        monthlyRent: rentEstimate.monthlyRent,
      },
      financing: {
        downPaymentPercent: options.downPaymentPercent,
        interestRateAnnual: options.interestRateAnnual,
      },
    });

    return {
      ...property,
      estimatedMonthlyRent: rentEstimate.monthlyRent,
      rentEstimate,
      underwriting,
    };
  });

  return ranked.sort(
    (a, b) => b.underwriting.cashOnCashReturn - a.underwriting.cashOnCashReturn,
  );
}

export function getCapRateTone(
  capRate: number,
): "strong" | "weak" | "neutral" {
  if (capRate > 0.08) {
    return "strong";
  }

  if (capRate < 0.04) {
    return "weak";
  }

  return "neutral";
}

/** Map pin / UI colors aligned with PRD cap-rate thresholds. */
export function getCapRateColor(capRate: number): string {
  const tone = getCapRateTone(capRate);

  if (tone === "strong") {
    return "#059669";
  }

  if (tone === "weak") {
    return "#dc2626";
  }

  return "#52525b";
}

export const capRateToneClasses = {
  strong: "border-emerald-200 bg-emerald-50 ring-emerald-300",
  weak: "border-red-200 bg-red-50 ring-red-300",
  neutral: "border-zinc-200 bg-white ring-zinc-300",
} as const;
