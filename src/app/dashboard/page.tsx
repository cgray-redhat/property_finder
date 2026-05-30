"use client";

import { AppHeader } from "@/components/layout/app-header";
import { DashboardList } from "@/components/DashboardList";
import { DealMap } from "@/components/map/DealMap";
import { PropertyDetailDrawer } from "@/components/PropertyDetailDrawer";
import { PropertySearchPanel } from "@/components/search/property-search-panel";
import { WhatIfSidebar } from "@/components/WhatIfSidebar";

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex h-[calc(100vh-4.5rem)] max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6">
        <PropertySearchPanel />

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_17rem]">
          <DealMap />
          <DashboardList compact />
          <WhatIfSidebar />
        </div>
      </main>
      <PropertyDetailDrawer />
    </>
  );
}
