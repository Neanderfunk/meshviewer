import { _ } from "../utils/language.js";

// --- Overrides am Zahnrad ---------------------------------------------------
// Lokaler Zusatz: Name oder Ort eines Knotens koennen im Service-Menue
// ueberschrieben sein (Alias in yanic). Die Karte sieht das an den Daten
// nicht; eine kleine Liste {node_id: ["ort" | "ort-weg" | "name"]} sagt es.
// Ein Knoten darin bekommt ein gelbes Zahnrad und einen Tooltip, was
// ueberschrieben ist.

type Liste = Record<string, string[]>;

const FELDER = ["name", "ort", "ort-weg"];

const CACHE_MS = 60_000;
let cache: { url: string; zeit: number; daten: Promise<Liste> } | undefined;

function laden(url: string): Promise<Liste> {
  const jetzt = Date.now();
  if (cache && cache.url === url && jetzt - cache.zeit < CACHE_MS) return cache.daten;
  const daten = fetch(url, { mode: "cors", credentials: "omit", cache: "no-cache" })
    .then((antwort) => {
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      return antwort.json();
    })
    .then((json) => (json && typeof json === "object" ? (json as Liste) : {}))
    .catch(() => {
      cache = undefined;
      return {};
    });
  cache = { url, zeit: jetzt, daten };
  return daten;
}

export function overrideTitel(titel: string, felder: string[]): string {
  const bekannt = felder.filter((f) => FELDER.includes(f)).map((f) => _.t("node.override." + f));
  return bekannt.length ? `${titel} (${_.t("node.overrideBy")}: ${bekannt.join(", ")})` : titel;
}

export function markieren(link: HTMLElement, url: string, nodeId: string, titel: string) {
  link.dataset.node = nodeId;
  laden(url).then((liste) => {
    // Inzwischen ein anderer Knoten im Fenster? Dann nichts anfassen.
    if (link.dataset.node !== nodeId) return;
    const felder = (Array.isArray(liste[nodeId]) ? liste[nodeId] : []).filter((f) => FELDER.includes(f));
    link.classList.toggle("override", felder.length > 0);
    link.title = overrideTitel(titel, felder);
    link.setAttribute("aria-label", link.title);
  });
}
