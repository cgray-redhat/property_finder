import { create } from "zustand";
import {
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_INTEREST_RATE_ANNUAL,
} from "@/lib/calculations";
import type { PropertySearchResponse } from "@/types/property";
import type { AppMode } from "@/lib/property-classification";

export type { AppMode };

type InvestLocateState = {
  appMode: AppMode;
  downPaymentPercent: number;
  interestRateAnnual: number;
  searchResults: PropertySearchResponse | null;
  selectedPropertyId: string | null;
  /** Manual monthly rent overrides keyed by property id. */
  rentOverrides: Record<string, number>;
  setAppMode: (mode: AppMode) => void;
  setDownPaymentPercent: (value: number) => void;
  setInterestRateAnnual: (value: number) => void;
  setSearchResults: (results: PropertySearchResponse | null) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setRentOverride: (propertyId: string, monthlyRent: number) => void;
  clearRentOverride: (propertyId: string) => void;
};

export const useInvestLocateStore = create<InvestLocateState>((set) => ({
  appMode: "property_finder",
  downPaymentPercent: DEFAULT_DOWN_PAYMENT_PERCENT,
  interestRateAnnual: DEFAULT_INTEREST_RATE_ANNUAL,
  searchResults: null,
  selectedPropertyId: null,
  rentOverrides: {},
  setAppMode: (appMode) => set({ appMode, selectedPropertyId: null }),
  setDownPaymentPercent: (downPaymentPercent) => set({ downPaymentPercent }),
  setInterestRateAnnual: (interestRateAnnual) => set({ interestRateAnnual }),
  setSearchResults: (searchResults) =>
    set({ searchResults, selectedPropertyId: null, rentOverrides: {} }),
  setSelectedPropertyId: (selectedPropertyId) => set({ selectedPropertyId }),
  setRentOverride: (propertyId, monthlyRent) =>
    set((state) => ({
      rentOverrides: {
        ...state.rentOverrides,
        [propertyId]: monthlyRent,
      },
    })),
  clearRentOverride: (propertyId) =>
    set((state) => {
      const next = { ...state.rentOverrides };
      delete next[propertyId];
      return { rentOverrides: next };
    }),
}));

/** Convenience selectors for financing params used by the calculation engine. */
export function useFinancingParams() {
  return useInvestLocateStore((state) => ({
    downPaymentPercent: state.downPaymentPercent,
    interestRateAnnual: state.interestRateAnnual,
  }));
}
