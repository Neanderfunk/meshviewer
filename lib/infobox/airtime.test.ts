import { describe, expect, it, vi } from "vitest";

vi.mock("snabbdom", () => ({ h: (...args: any[]) => ({ args }) }));
vi.mock("../utils/language.js", () => ({ _: { t: (key: string) => key } }));

import { anteile, kanal } from "./airtime.js";

describe("airtime", () => {
  it("rechnet Frequenzen in Kanaele um", () => {
    expect(kanal(2412)).toBe(1);
    expect(kanal(2452)).toBe(9);
    expect(kanal(2484)).toBe(14);
    expect(kanal(5180)).toBe(36);
    expect(kanal(5700)).toBe(140);
    expect(kanal(5955)).toBe(1);
    expect(kanal(900)).toBeUndefined();
  });

  it("teilt die Belegung in empfangen, gesendet und andere", () => {
    expect(anteile({ busy: 39.4, rx: 24.7, tx: 0.4 })).toEqual({
      busy: 39.4,
      rx: 24.7,
      tx: 0.4,
      andere: 39.4 - 24.7 - 0.4,
    });
  });

  it("wird nie breiter als die Belegung und nie negativ", () => {
    const a = anteile({ busy: 10, rx: 8, tx: 5 });
    expect(a.rx + a.tx + a.andere).toBe(10);
    expect(a.andere).toBe(0);
    expect(anteile({ busy: 150, rx: -3 })).toEqual({ busy: 100, rx: 0, tx: 0, andere: 100 });
  });
});
