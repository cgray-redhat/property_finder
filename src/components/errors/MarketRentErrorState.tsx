"use client";

type MarketRentErrorStateProps = {
  zipCode: string;
  sparseCount: number;
  totalCount: number;
  warnings: string[];
  marketDataMissing: boolean;
};

export function MarketRentErrorState({
  zipCode,
  sparseCount,
  totalCount,
  warnings,
  marketDataMissing,
}: MarketRentErrorStateProps) {
  const allMissing = sparseCount === totalCount && totalCount > 0;

  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${
        allMissing || marketDataMissing
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-sky-200 bg-sky-50 text-sky-950"
      }`}
    >
      <p className="font-medium">
        {allMissing || marketDataMissing
          ? "Limited rental market data"
          : "Some listings use estimated rent"}
      </p>
      <p className="mt-1">
        {allMissing ? (
          <>
            RentCast returned sparse or missing comps for {zipCode}. Fallback
            calculations (zip median or 1% rule) are applied until you set a
            manual rental override on each property.
          </>
        ) : (
          <>
            {sparseCount} of {totalCount} listings in {zipCode} lack bedroom-level
            rent comps. Review flagged rows or override rent in the property
            drawer.
          </>
        )}
      </p>
      {warnings.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-xs">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
