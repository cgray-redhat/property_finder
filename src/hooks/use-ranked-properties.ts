import { useMemo } from "react";
import { rankProperties, type RankedProperty } from "@/lib/rank-properties";
import { useInvestLocateStore } from "@/store/invest-locate-store";

/** Ranked listings derived from search results and current What-If financing. */
export function useRankedProperties(): RankedProperty[] {
  const searchResults = useInvestLocateStore((state) => state.searchResults);
  const downPaymentPercent = useInvestLocateStore(
    (state) => state.downPaymentPercent,
  );
  const interestRateAnnual = useInvestLocateStore(
    (state) => state.interestRateAnnual,
  );
  const rentOverrides = useInvestLocateStore((state) => state.rentOverrides);

  return useMemo(
    () =>
      searchResults
        ? rankProperties(searchResults.properties, {
            downPaymentPercent,
            interestRateAnnual,
            rentOverrides,
            zipMedianRent:
              searchResults.marketSummary?.rental.medianRent ?? null,
          })
        : [],
    [searchResults, downPaymentPercent, interestRateAnnual, rentOverrides],
  );
}

/** Selected property for detail drawer. */
export function useSelectedRankedProperty(): RankedProperty | null {
  const rankedProperties = useRankedProperties();
  const selectedPropertyId = useInvestLocateStore(
    (state) => state.selectedPropertyId,
  );

  return useMemo(
    () =>
      rankedProperties.find((property) => property.id === selectedPropertyId) ??
      null,
    [rankedProperties, selectedPropertyId],
  );
}
