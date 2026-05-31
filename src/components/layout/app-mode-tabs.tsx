"use client";

import type { AppMode } from "@/lib/property-classification";
import { useAppMode } from "@/hooks/use-ranked-properties";
import { useInvestLocateStore } from "@/store/invest-locate-store";

const tabs: { mode: AppMode; label: string; description: string }[] = [
  {
    mode: "property_finder",
    label: "Property Finder",
    description: "Rental investments — excludes land and vacant lots",
  },
  {
    mode: "lot_finder",
    label: "Lot Finder",
    description: "Land and vacant lots only",
  },
];

export function AppModeTabs() {
  const appMode = useAppMode();
  const setAppMode = useInvestLocateStore((state) => state.setAppMode);
  const activeTab = tabs.find((tab) => tab.mode === appMode) ?? tabs[0];

  return (
    <div className="flex flex-col gap-2">
      <div
        role="tablist"
        aria-label="Search mode"
        className="inline-flex w-fit rounded-xl border border-zinc-200 bg-zinc-100 p-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.mode === appMode;

          return (
            <button
              key={tab.mode}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setAppMode(tab.mode)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-emerald-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-zinc-600">{activeTab.description}</p>
    </div>
  );
}
