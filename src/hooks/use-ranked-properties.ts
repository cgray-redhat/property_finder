import { useMemo } from "react";
import {
  filterForAppMode,
  rankLotListings,
  type AppMode,
} from "@/lib/property-classification";
import { rankProperties, type RankedProperty } from "@/lib/rank-properties";
import { useInvestLocateStore } from "@/store/invest-locate-store";
import type { EnrichedPropertyListing } from "@/types/property";

export function useAppMode(): AppMode {
  return useInvestLocateStore((state) => state.appMode);
}

export function useRankedProperties(): RankedProperty[] {
  const searchResults = useInvestLocateStore((state) => state.searchResults);
  const appMode = useInvestLocateStore((state) => state.appMode);
  const downPaymentPercent = useInvestLocateStore(
    (state) => state.downPaymentPercent,
  );
  const interestRateAnnual = useInvestLocateStore(
    (state) => state.interestRateAnnual,
  );
  const rentOverrides = useInvestLocateStore((state) => state.rentOverrides);

  return useMemo(() => {
    if (!searchResults || appMode !== "property_finder") {
      return [];
    }

    const properties = filterForAppMode(
      searchResults.properties,
      "property_finder",
    );

    return rankProperties(properties, {
      downPaymentPercent,
      interestRateAnnual,
      rentOverrides,
      zipMedianRent: searchResults.marketSummary?.rental.medianRent ?? null,
    });
  }, [
    searchResults,
    appMode,
    downPaymentPercent,
    interestRateAnnual,
    rentOverrides,
  ]);
}

export function useLotListings(): EnrichedPropertyListing[] {
  const searchResults = useInvestLocateStore((state) => state.searchResults);
  const appMode = useInvestLocateStore((state) => state.appMode);

  return useMemo(() => {
    if (!searchResults || appMode !== "lot_finder") {
      return [];
    }

    const lots = filterForAppMode(searchResults.properties, "lot_finder");
    return rankLotListings(lots);
  }, [searchResults, appMode]);
}

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

export function useSelectedLotListing(): EnrichedPropertyListing | null {
  const lotListings = useLotListings();
  const selectedPropertyId = useInvestLocateStore(
    (state) => state.selectedPropertyId,
  );

  return useMemo(
    () =>
      lotListings.find((property) => property.id === selectedPropertyId) ??
      null,
    [lotListings, selectedPropertyId],
  );
}
