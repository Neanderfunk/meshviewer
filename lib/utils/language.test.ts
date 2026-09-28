import { describe, expect, it, vi } from "vitest";

vi.mock("./helper.js", () => ({}));
import moment from "moment";
import { relativeTimeSpec } from "./language.js";

const de = {
  relativeTime: {
    future: "in %s",
    past: "vor %s",
    s: "ein paar Sekunden",
    d: "einem Tag",
    dd: "%d Tagen",
    h: "einer Stunde",
  },
  relativeTimeWithoutSuffix: { d: "1 Tag", dd: "%d Tage", h: "1 Stunde" },
};

describe("relativeTimeSpec", () => {
  it("nimmt ohne Zusatz die eigene Form, mit Zusatz die bisherige", () => {
    moment.defineLocale("x-test-de", { relativeTime: relativeTimeSpec(de) as any });
    const vor3 = moment().subtract(3, "days");
    expect(vor3.fromNow()).toBe("vor 3 Tagen");
    expect(vor3.fromNow(true)).toBe("3 Tage");
    expect(moment().subtract(1, "day").fromNow(true)).toBe("1 Tag");
    expect(moment().subtract(1, "day").fromNow()).toBe("vor einem Tag");
    expect(moment().subtract(1, "hour").fromNow(true)).toBe("1 Stunde");
    moment.locale("en");
  });

  it("laesst Sprachen ohne eigene Liste unveraendert", () => {
    const en = { relativeTime: { future: "in %s", past: "%s ago", dd: "%d days" } };
    expect(relativeTimeSpec(en)).toBe(en.relativeTime);
  });
});
