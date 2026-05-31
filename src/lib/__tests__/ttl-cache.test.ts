import { TtlCache } from "@/lib/rentcast/ttl-cache";

describe("TtlCache", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns a value before TTL expires", () => {
    const cache = new TtlCache<string>();
    cache.set("zip:78723", "payload", 30_000);

    expect(cache.get("zip:78723")).toBe("payload");
  });

  it("expires entries after TTL", () => {
    const cache = new TtlCache<string>();
    cache.set("zip:78723", "payload", 30_000);

    jest.advanceTimersByTime(31_000);

    expect(cache.get("zip:78723")).toBeNull();
  });
});
