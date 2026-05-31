import {
  filterMlsFixtureListings,
  getMlsFixtureZipCode,
} from "@/lib/fixtures/mls-fixture";

describe("mls fixture", () => {
  it("targets zip 27519", () => {
    expect(getMlsFixtureZipCode()).toBe("27519");
  });

  it("returns the saved listing set with default filters", () => {
    const listings = filterMlsFixtureListings();

    expect(listings.length).toBeGreaterThan(0);
    expect(listings.every((listing) => listing.zipCode === "27519")).toBe(true);
  });

  it("applies property max price filters locally", () => {
    const listings = filterMlsFixtureListings({ propertyMaxPrice: 250000 });

    expect(
      listings.every(
        (listing) =>
          listing.propertyType === "Land" || listing.price <= 250000,
      ),
    ).toBe(true);
  });
});
