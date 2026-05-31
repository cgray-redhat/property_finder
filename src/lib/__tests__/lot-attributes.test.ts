import {
  formatLotSize,
  getLotBadges,
  getWaterViewTypes,
  hasWaterFeature,
  parseViewTypes,
} from "@/lib/lot-attributes";

describe("lot attributes", () => {
  it("parses slash-separated view types", () => {
    expect(parseViewTypes("Waterfront / Pond")).toEqual(["Waterfront", "Pond"]);
  });

  it("identifies water-related view types", () => {
    expect(getWaterViewTypes("Lake / City")).toEqual(["Lake"]);
    expect(hasWaterFeature("River")).toBe(true);
    expect(hasWaterFeature("City")).toBe(false);
  });

  it("builds water badges for waterfront lots", () => {
    expect(
      getLotBadges({ viewType: "Waterfront / Creek", lotSizeSqFt: 87_120 }),
    ).toEqual([
      { label: "Waterfront", tone: "water" },
      { label: "Creek", tone: "water" },
    ]);
  });

  it("formats lot size in acres when large enough", () => {
    expect(formatLotSize(87_120)).toBe("2.0 ac (87,120 sqft)");
    expect(formatLotSize(10_000)).toBe("10,000 sqft");
    expect(formatLotSize(null)).toBe("Not listed");
  });
});
