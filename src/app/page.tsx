import {
  AppHeader,
  DashboardList,
  PropertySearchPanel,
  WhatIfSidebar,
} from "@/components";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Real estate cash-flow analysis
          </h2>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Property Finder (internal code: InvestLocate) helps investors
            discover active listings, run cash-flow scenarios, and build
            shortlists for comparison.
          </p>
        </section>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <PropertySearchPanel />
            <DashboardList />
          </div>
          <WhatIfSidebar />
        </div>
      </main>
    </>
  );
}
