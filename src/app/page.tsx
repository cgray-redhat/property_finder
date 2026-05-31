"use client";

import {
  AppHeader,
  DashboardList,
  PropertySearchPanel,
  WhatIfSidebar,
} from "@/components";
import { AppModeTabs } from "@/components/layout/app-mode-tabs";
import { useAppMode } from "@/hooks/use-ranked-properties";

export default function Home() {
  const appMode = useAppMode();
  const isLotMode = appMode === "lot_finder";

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Real estate cash-flow analysis
          </h2>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Property Finder analyzes rental investments. Lot Finder surfaces
            vacant land and parcels without bed/bath data.
          </p>
        </section>

        <AppModeTabs />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <PropertySearchPanel />
            <DashboardList />
          </div>
          {!isLotMode && <WhatIfSidebar />}
        </div>
      </main>
    </>
  );
}
