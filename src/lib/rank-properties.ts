import { runUnderwriting, type UnderwritingResult } from "@/lib/calculations";
import type { EnrichedPropertyListing } from "@/types/property";

export type RankedProperty = EnrichedPropertyListing & {
  estimatedMonthlyRent: number;
  underwriting: UnderwritingResult;
};

type RankPropertiesOptions = {
  downPaymentPercent: number;
  interestRateAnnual: number;
};

/**
 * Underwrite each listing and stack-rank by Cash-on-Cash return (descending).
 * Cap Rate is included in underwriting but CoC drives re-sort on What-If changes.
 */
export function rankProperties(
  properties: EnrichedPropertyListing[],
  options: RankPropertiesOptions,
): RankedProperty[] {
  const ranked = properties
    .map((property) => {
      const estimatedMonthlyRent = property.rentalBenchmarks.medianRent;

      if (estimatedMonthlyRent == null || estimatedMonthlyRent <= 0) {
        return null;
      }

      const underwriting = runUnderwriting({
        property: {
          purchasePrice: property.price,
          monthlyRent: estimatedMonthlyRent,
        },
        financing: {
          downPaymentPercent: options.downPaymentPercent,
          interestRateAnnual: options.interestRateAnnual,
        },
      });

      return {
        ...property,
        estimatedMonthlyRent,
        underwriting,
      };
    })
    .filter((property): property is RankedProperty => property !== null);

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
