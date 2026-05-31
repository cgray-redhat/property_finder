import {
  buildGoogleMapsUrl,
  buildRealtorComRedirectPath,
  buildRealtorSearchFallbackUrl,
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

describe("buildRealtorSearchFallbackUrl", () => {
  it("prefers zip search when available", () => {
    expect(
      buildRealtorSearchFallbackUrl({
        formattedAddress: "456 Oak Ave, Hyannis, MA 02601",
        city: "Hyannis",
        state: "MA",
        zipCode: "02601",
      }),
    ).toBe("https://www.realtor.com/realestateandhomes-search/02601");
  });

  it("falls back to city search when zip is missing", () => {
    expect(
      buildRealtorSearchFallbackUrl({
        formattedAddress: "Vacant lot",
        city: "Hyannis",
        state: "MA",
      }),
    ).toBe("https://www.realtor.com/realestateandhomes-search/Hyannis_MA");
  });
});

describe("buildRealtorComRedirectPath", () => {
  it("builds a redirect route with address params", () => {
    expect(
      buildRealtorComRedirectPath({
        formattedAddress: "123 Main St, Boston, MA 02101",
        addressLine1: "123 Main St",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
      }),
    ).toBe(
      "/api/listing-links/realtor?formattedAddress=123+Main+St%2C+Boston%2C+MA+02101&addressLine1=123+Main+St&city=Boston&state=MA&zipCode=02101",
    );
  });
});
