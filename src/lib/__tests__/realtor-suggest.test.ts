import {
  buildRealtorDetailUrlFromSuggest,
  formatRealtorMprId,
} from "@/lib/realtor-suggest";

describe("formatRealtorMprId", () => {
  it("formats a 10-digit mpr id into Realtor listing suffix", () => {
    expect(formatRealtorMprId("1297447190")).toBe("M12974-47190");
    expect(formatRealtorMprId("2057077324")).toBe("M20570-77324");
  });
});

describe("buildRealtorDetailUrlFromSuggest", () => {
  it("builds a detail URL with the required listing id suffix", () => {
    expect(
      buildRealtorDetailUrlFromSuggest({
        mpr_id: "1297447190",
        line: "4328 Andes Way",
        city: "Denver",
        state_code: "CO",
        postal_code: "80249",
      }),
    ).toBe(
      "https://www.realtor.com/realestateandhomes-detail/4328-Andes-Way_Denver_CO_80249_M12974-47190",
    );
  });
});
