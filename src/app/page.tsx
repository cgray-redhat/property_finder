import { AppHeader } from "@/components";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Real estate cash-flow analysis
          </h2>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Property Finder (internal code: InvestLocate) helps investors
            discover active listings, run cash-flow scenarios, and build
            shortlists for comparison. Spatial search is powered by PostGIS.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Discover",
              body: "Search active listings by market, price, and proximity.",
            },
            {
              title: "Analyze",
              body: "Model cash flow, cap rate, and ROI for each property.",
            },
            {
              title: "Shortlist",
              body: "Save and compare properties across your target markets.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-6"
            >
              <h3 className="font-medium text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{item.body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
