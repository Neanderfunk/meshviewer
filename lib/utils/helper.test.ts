import { describe, expect, it, vi } from "vitest";

vi.mock("snabbdom", () => ({
  h: (...args: any[]) => ({ args }),
}));

vi.mock("leaflet", () => ({}));

vi.mock("./language.js", () => ({
  _: {
    t: (key: string) => key,
  },
}));

import { linkBand, linkBandDashed, linkTypeLabel, mergeSpellingVariants } from "./helper.js";

describe("mergeSpellingVariants", () => {
  it("merges case variants and labels them with the most common spelling", () => {
    const merged = mergeSpellingVariants(
      new Map<unknown, number>([
        ["ZyXEL WSM20", 42],
        ["Zyxel WSM20", 12],
        ["TP-LINK Archer C7 v5", 1],
        ["TP-Link Archer C7 v5", 101],
      ]),
    );

    expect(merged).toEqual([
      ["TP-Link Archer C7 v5", 102],
      ["ZyXEL WSM20", 54],
    ]);
  });

  it("collapses padding whitespace in labels", () => {
    const merged = mergeSpellingVariants(new Map<unknown, number>([["FUJITSU      D2963-A1     ", 1]]));

    expect(merged).toEqual([["FUJITSU D2963-A1", 1]]);
  });

  it("labels a tie alphabetically rather than by input order", () => {
    const counts: [unknown, number][] = [
      ["Zyxel WSM20", 5],
      ["ZyXEL WSM20", 5],
    ];

    expect(mergeSpellingVariants(new Map(counts))).toEqual([["ZyXEL WSM20", 10]]);
    expect(mergeSpellingVariants(new Map(counts.reverse()))).toEqual([["ZyXEL WSM20", 10]]);
  });

  it("keeps genuinely different values apart", () => {
    const merged = mergeSpellingVariants(
      new Map<unknown, number>([
        ["ZyXEL WSM20", 42],
        ["ZyXEL NWA50AX", 3],
      ]),
    );

    expect(merged).toHaveLength(2);
  });
});

// Lokaler Zusatz: Band eines WLAN-Links aus der Frequenz (Grenzfaelle wie im
// Test von 4830.org, dazu 6 GHz)
describe("linkBand", () => {
  it("ordnet die Frequenz dem Band zu", () => {
    const fall = (source_frequency?: number, target_frequency?: number) =>
      linkBand({ source_frequency, target_frequency });
    expect(fall(2412)).toBe("2.4 GHz");
    expect(fall(2484)).toBe("2.4 GHz");
    expect(fall(undefined, 2412)).toBe("2.4 GHz");
    expect(fall(5180)).toBe("5 GHz");
    expect(fall(5885)).toBe("5 GHz");
    expect(fall(5955)).toBe("6 GHz");
    expect(fall(undefined)).toBeUndefined();
    expect(fall(0)).toBeUndefined();
    expect(fall(2500)).toBeUndefined();
    expect(fall(4900)).toBeUndefined();
  });

  it("haengt das Band an den Typ", () => {
    expect(linkTypeLabel({ type: "wifi", source_frequency: 5180 })).toBe("wifi (5 GHz)");
    expect(linkTypeLabel({ type: "wifi" })).toBe("wifi");
    expect(linkTypeLabel({ type: "other", target_frequency: 0 })).toBe("other");
  });

  it("strichelt 2.4 GHz nur mit linkBandStyle", () => {
    (globalThis as any).window = { config: { linkBandStyle: false } };
    expect(linkBandDashed({ source_frequency: 2412 })).toBe(false);
    (globalThis as any).window = { config: { linkBandStyle: true } };
    expect(linkBandDashed({ source_frequency: 2412 })).toBe(true);
    expect(linkBandDashed({ source_frequency: 5180 })).toBe(false);
    expect(linkBandDashed({})).toBe(false);
  });
});
