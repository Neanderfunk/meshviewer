import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/language.js", () => ({
  _: {
    t: (key: string) =>
      ({ "node.overrideBy": "per Override", "node.override.ort": "Ort", "node.override.name": "Name" })[key] ?? key,
  },
}));

import { markieren, overrideTitel } from "./overrides.js";

function link() {
  const klassen = new Set<string>();
  const attrs: Record<string, string> = {};
  return {
    dataset: {} as Record<string, string>,
    title: "",
    classList: {
      toggle: (k: string, an: boolean) => (an ? klassen.add(k) : klassen.delete(k)),
      has: (k: string) => klassen.has(k),
    },
    setAttribute: (k: string, v: string) => (attrs[k] = v),
    attrs,
  };
}

const warten = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => vi.unstubAllGlobals());

describe("overrides", () => {
  it("nennt im Titel, was ueberschrieben ist", () => {
    expect(overrideTitel("Service", ["name", "ort"])).toBe("Service (per Override: Name, Ort)");
    expect(overrideTitel("Service", [])).toBe("Service");
    expect(overrideTitel("Service", ["unbekannt"])).toBe("Service");
  });

  it("faerbt nur Knoten aus der Liste", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ aaaaaaaaaaaa: ["name"] }) })),
    );
    const a = link();
    const b = link();
    markieren(a as unknown as HTMLElement, "https://x.invalid/o1.json", "aaaaaaaaaaaa", "Service");
    markieren(b as unknown as HTMLElement, "https://x.invalid/o1.json", "bbbbbbbbbbbb", "Service");
    await warten();
    expect(a.classList.has("override")).toBe(true);
    expect(a.title).toBe("Service (per Override: Name)");
    expect(b.classList.has("override")).toBe(false);
    expect(b.title).toBe("Service");
  });

  it("laesst ein Zahnrad in Ruhe, das inzwischen einem anderen Knoten gehoert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ aaaaaaaaaaaa: ["ort"] }) })),
    );
    const a = link();
    markieren(a as unknown as HTMLElement, "https://x.invalid/o2.json", "aaaaaaaaaaaa", "Service");
    a.dataset.node = "cccccccccccc";
    await warten();
    expect(a.classList.has("override")).toBe(false);
  });

  it("ohne Liste bleibt alles wie ohne Zusatz", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 })),
    );
    const a = link();
    markieren(a as unknown as HTMLElement, "https://x.invalid/o3.json", "aaaaaaaaaaaa", "Service");
    await warten();
    await warten();
    expect(a.classList.has("override")).toBe(false);
    expect(a.title).toBe("Service");
  });
});
