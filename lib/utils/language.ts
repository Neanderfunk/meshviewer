import moment from "moment";
import { getJSON } from "./http.js";
import Polyglot from "node-polyglot";
import { Router } from "./router.js";

export type LanguageCode = string;

export let _: Polyglot & { phrases?: Record<string, string> } = new Polyglot({
  phrases: {},
  allowMissing: true,
});

export const Language = function () {
  let router: Router;
  const config = window.config;

  function languageSelect(el: HTMLElement) {
    const select = document.createElement("select");
    select.className = "language-switch";
    select.setAttribute("aria-label", "Language");
    select.addEventListener("change", setSelectLocale);
    el.appendChild(select);

    // Keep english
    select.innerHTML = "<option>Language</option>";
    for (let i = 0; i < config.supportedLocale.length; i++) {
      select.innerHTML +=
        '<option value="' + config.supportedLocale[i] + '">' + config.supportedLocale[i] + "</option>";
    }
  }

  function setSelectLocale(event: Event) {
    const target = event.target as HTMLSelectElement;
    router.deepUrl({ lang: target.value });
  }

  function getLocale(input?: LanguageCode): LanguageCode {
    const language: LanguageCode = input || (navigator.languages && navigator.languages[0]) || navigator.language;
    const defaultLocale = config.supportedLocale[0];
    if (defaultLocale === undefined) {
      throw new Error("config.supportedLocale must contain at least one locale");
    }
    let locale = defaultLocale;
    config.supportedLocale.some(function (item: string) {
      if (language.indexOf(item) !== -1) {
        locale = item;
        return true;
      }
      return false;
    });
    return locale;
  }

  interface TranslationData {
    momentjs?: {
      calendar?: Record<string, string>;
      relativeTime?: Record<string, string>;
      relativeTimeWithoutSuffix?: Record<string, string>;
    };
    [k: string]: unknown;
  }

  function setTranslation(translationJson: TranslationData) {
    _.extend(translationJson);

    if (moment.locale(_.locale()) !== _.locale() && translationJson.momentjs) {
      moment.defineLocale(_.locale(), {
        longDateFormat: {
          LT: "HH:mm",
          LTS: "HH:mm:ss",
          L: "DD.MM.YYYY",
          LL: "D. MMMM YYYY",
          LLL: "D. MMMM YYYY HH:mm",
          LLLL: "dddd, D. MMMM YYYY HH:mm",
        },
        calendar: translationJson.momentjs.calendar,
        relativeTime: relativeTimeSpec(translationJson.momentjs),
      });
    }
  }

  function init(routing: Router) {
    router = routing;
    /** global: _ */
    _ = new Polyglot({ locale: getLocale(routing.getLang() ?? undefined), allowMissing: true });
    getJSON<TranslationData>("locale/" + _.locale() + ".json?" + config.cacheBreaker)
      .then(setTranslation)
      .catch(function (e: unknown) {
        console.warn("Failed to load translations:", e);
      });
    document.querySelector("html")!.setAttribute("lang", _.locale());
  }

  return {
    init,
    getLocale,
    languageSelect,
  };
};

// Lokaler Zusatz: Sprachen mit Faellen brauchen je nach Verwendung andere
// Formen. "vor 3 Tagen" (mit Zusatz, Dativ) und die Laufzeit "3 Tage" (ohne
// Zusatz, fromNow(true)) kamen bisher aus derselben Liste, also stand dort
// "3 Tagen" und "einem Tag". Eine Sprachdatei kann jetzt zusaetzlich
// relativeTimeWithoutSuffix mitbringen; fehlt sie, bleibt alles wie bisher.
type RelativeTimeFn = (n: number, withoutSuffix: boolean) => string;
export function relativeTimeSpec(momentjs: {
  relativeTime?: Record<string, string>;
  relativeTimeWithoutSuffix?: Record<string, string>;
}): Record<string, string | RelativeTimeFn> | undefined {
  const mit = momentjs.relativeTime;
  const ohne = momentjs.relativeTimeWithoutSuffix;
  if (!mit || !ohne) return mit;
  const spec: Record<string, string | RelativeTimeFn> = { ...mit };
  for (const key of Object.keys(ohne)) {
    if (key === "future" || key === "past" || !(key in mit)) continue;
    spec[key] = (n: number, withoutSuffix: boolean) =>
      (withoutSuffix ? ohne[key]! : mit[key]!).replace("%d", String(n));
  }
  return spec;
}
