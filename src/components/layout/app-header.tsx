import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
            InvestLocate
          </p>
          <h1 className="text-lg font-semibold text-zinc-900">
            Property Finder
          </h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-zinc-600 hover:text-zinc-900">
            Home
          </Link>
          <Link
            href="/dashboard"
            className="font-medium text-emerald-800 hover:text-emerald-900"
          >
            Deal Map
          </Link>
        </nav>
      </div>
    </header>
  );
}
