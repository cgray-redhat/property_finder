export const MLS_FIXTURE_DEFAULT_ZIP = "27519";

export function isPublicMlsFixtureModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MLS_FIXTURE_DATA === "true";
}

export function getPublicMlsFixtureZip(): string {
  return process.env.NEXT_PUBLIC_MLS_FIXTURE_ZIP ?? MLS_FIXTURE_DEFAULT_ZIP;
}
