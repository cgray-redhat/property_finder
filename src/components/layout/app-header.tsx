export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
            InvestLocate
          </p>
          <h1 className="text-lg font-semibold text-zinc-900">
            Property Finder
          </h1>
        </div>
        <p className="text-sm text-zinc-500">Cash-flow analysis</p>
      </div>
    </header>
  );
}
