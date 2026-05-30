import { create } from "zustand";
import {
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_INTEREST_RATE_ANNUAL,
} from "@/lib/calculations";
import type { PropertySearchResponse } from "@/types/property";

type InvestLocateState = {
  downPaymentPercent: number;
  interestRateAnnual: number;
  searchResults: PropertySearchResponse | null;
  selectedPropertyId: string | null;
  setDownPaymentPercent: (value: number) => void;
  setInterestRateAnnual: (value: number) => void;
  setSearchResults: (results: PropertySearchResponse | null) => void;
  setSelectedPropertyId: (id: string | null) => void;
};

export const useInvestLocateStore = create<InvestLocateState>((set) => ({
  downPaymentPercent: DEFAULT_DOWN_PAYMENT_PERCENT,
  interestRateAnnual: DEFAULT_INTEREST_RATE_ANNUAL,
  searchResults: null,
  selectedPropertyId: null,
  setDownPaymentPercent: (downPaymentPercent) => set({ downPaymentPercent }),
  setInterestRateAnnual: (interestRateAnnual) => set({ interestRateAnnual }),
  setSearchResults: (searchResults) =>
    set({ searchResults, selectedPropertyId: null }),
  setSelectedPropertyId: (selectedPropertyId) => set({ selectedPropertyId }),
}));

/** Convenience selectors for financing params used by the calculation engine. */
export function useFinancingParams() {
  return useInvestLocateStore((state) => ({
    downPaymentPercent: state.downPaymentPercent,
    interestRateAnnual: state.interestRateAnnual,
  }));
}
