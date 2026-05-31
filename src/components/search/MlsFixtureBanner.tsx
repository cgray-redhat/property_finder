"use client";

import { useInvestLocateStore } from "@/store/invest-locate-store";

const fixtureModeEnabled =
  process.env.NEXT_PUBLIC_USE_MLS_FIXTURE_DATA === "true";
const fixtureZip = process.env.NEXT_PUBLIC_MLS_FIXTURE_ZIP ?? "27519";

function formatFixtureDate(value: string | undefined): string {
  if (!value) {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function MlsFixtureBanner() {
  const searchResults = useInvestLocateStore((state) => state.searchResults);
  const fixtureMeta = searchResults?.meta.mlsFixture;
  const showBanner =
    fixtureModeEnabled || searchResults?.meta.dataSource === "mls_fixture";

  if (!showBanner) {
    return null;
  }

  const capturedDate = formatFixtureDate(fixtureMeta?.capturedDate);
  const sourceZip = fixtureMeta?.sourceZipCode ?? fixtureZip;

  return (
    <div
      role="status"
      className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-medium">MLS test data mode</p>
      <p className="mt-1">
        Showing saved MLS listings for zip {sourceZip} captured on{" "}
        {capturedDate}. Live RentCast API calls are paused while this fixture
        set is active.
      </p>
    </div>
  );
}
