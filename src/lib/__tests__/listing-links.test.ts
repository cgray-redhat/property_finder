import {
  buildGoogleMapsUrl,
  buildRealtorComUrl,
  buildZillowHomesUrl,
} from "@/lib/listing-links";

describe("buildGoogleMapsUrl", () => {
  it("uses coordinates when provided", () => {
    expect(
      buildGoogleMapsUrl("123 Main St, Boston, MA 02101", 42.36, -71.06),
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=42.36%2C-71.06",
    );
  });

  it("falls back to encoded address", () => {
    expect(buildGoogleMapsUrl("123 Main St, Boston, MA 02101")).toBe(
      "https://www.google.com/maps/search/?api=1&query=123%20Main%20St%2C%20Boston%2C%20MA%2002101",
    );
  });
});

describe("buildZillowHomesUrl", () => {
  it("builds a slug-style homes URL", () => {
    expect(buildZillowHomesUrl("123 Main St, Boston, MA 02101")).toBe(
      "https://www.zillow.com/homes/123-Main-St-Boston-MA-02101/",
    );
  });
});

describe("buildRealtorComUrl", () => {
  it("builds a detail URL from address parts", () => {
    expect(
      buildRealtorComUrl({
        formattedAddress: "123 Main St, Boston, MA 02101",
        addressLine1: "123 Main St",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
      }),
    ).toBe(
      "https://www.realtor.com/realestateandhomes-detail/123-Main-St_Boston_MA_02101",
    );
  });

  it("parses formattedAddress when addressLine1 is missing", () => {
    expect(
      buildRealtorComUrl({
        formattedAddress: "456 Oak Ave, Hyannis, MA 02601",
        city: "Hyannis",
        state: "MA",
        zipCode: "02601",
      }),
    ).toBe(
      "https://www.realtor.com/realestateandhomes-detail/456-Oak-Ave_Hyannis_MA_02601",
    );
  });

  it("falls back to city search when address cannot be parsed", () => {
    expect(
      buildRealtorComUrl({
        formattedAddress: "Vacant lot",
        city: "Hyannis",
        state: "MA",
      }),
    ).toBe("https://www.realtor.com/realestateandhomes-search/Hyannis_MA");
  });
});
