import { h, VNode } from "snabbdom";
import { _ } from "../utils/language.js";
import { AirtimeConfig } from "../config_default.js";

// --- Airtime ----------------------------------------------------------------
// Lokaler Zusatz: je Funkband eine Zeile "Airtime Kanal 9" mit einem Balken
// wie bei HopGlass: empfangen, gesendet und der Rest der Belegung (andere
// Sender, Stoerungen) nebeneinander, beschriftet mit der Belegung insgesamt.
//
// Die Zeilen gehoeren snabbdom, ihr Inhalt nicht: eine Zeile ohne Daten wird
// nur versteckt, nicht entfernt, damit spaetere Patches der Tabelle ihre
// Bezugsknoten behalten. Bei jedem Patch (neue Kartendaten) wird nachgelesen.

type Werte = Record<string, number>;

const CACHE_MS = 30_000;
const cache = new Map<string, { zeit: number; daten: Promise<Record<string, Werte>> }>();

function abfragen(url: string): Promise<Record<string, Werte>> {
  const jetzt = Date.now();
  const alt = cache.get(url);
  if (alt && jetzt - alt.zeit < CACHE_MS) return alt.daten;

  const daten = fetch(url, { mode: "cors", credentials: "omit" })
    .then((antwort) => {
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      return antwort.json();
    })
    .then((json) => {
      const je: Record<string, Werte> = {};
      for (const r of json?.data?.result ?? []) {
        const band = r.metric?.band;
        const wert = r.metric?.wert;
        const v = Number(r.value?.[1]);
        if (!band || !wert || !Number.isFinite(v)) continue;
        (je[band] ??= {})[wert] = v;
      }
      return je;
    })
    .catch(() => {
      cache.delete(url);
      return {};
    });
  cache.set(url, { zeit: jetzt, daten });
  return daten;
}

export function kanal(mhz: number): number | undefined {
  if (mhz >= 2412 && mhz <= 2472) return (mhz - 2407) / 5;
  if (mhz === 2484) return 14;
  if (mhz >= 5955 && mhz <= 7115) return (mhz - 5950) / 5;
  if (mhz >= 5000 && mhz < 5955) return (mhz - 5000) / 5;
  return undefined;
}

const prozent = (v: number) => Math.min(100, Math.max(0, v));

// rx und tx koennen durch Messfehler ueber der Belegung liegen (Zaehler
// verschiedener Stellen im Treiber); der Balken wird dann nie breiter als busy
export function anteile(w: Werte) {
  const busy = prozent(w.busy ?? 0);
  const rx = Math.min(prozent(w.rx ?? 0), busy);
  const tx = Math.min(prozent(w.tx ?? 0), busy - rx);
  return { busy, rx, tx, andere: busy - rx - tx };
}

function balken(w: Werte): HTMLElement {
  const { busy, rx, tx, andere } = anteile(w);

  const bar = document.createElement("span");
  bar.className = "bar airtime";
  bar.title = _.t("node.airtimeTitle", {
    rx: Math.round(rx),
    tx: Math.round(tx),
    other: Math.round(andere),
  });
  for (const [klasse, breite] of [
    ["rx", rx],
    ["tx", tx],
    ["other", andere],
  ] as const) {
    const teil = document.createElement("span");
    teil.className = klasse;
    teil.style.width = breite + "%";
    bar.appendChild(teil);
  }
  const label = document.createElement("label");
  label.textContent = Math.round(busy) + " %";
  bar.appendChild(label);
  return bar;
}

function fuellen(zeile: HTMLElement, url: string, band: string, name: string) {
  zeile.dataset.url = url;
  abfragen(url).then((je) => {
    // Inzwischen ein anderer Knoten in dieser Zeile? Dann nichts anfassen.
    if (zeile.dataset.url !== url) return;
    const w = je[band];
    const th = zeile.firstElementChild as HTMLElement | null;
    const td = zeile.lastElementChild as HTMLElement | null;
    if (!w || w.busy === undefined || !th || !td) {
      zeile.hidden = true;
      return;
    }
    const k = w.frequency !== undefined ? kanal(w.frequency) : undefined;
    th.textContent =
      k !== undefined ? _.t("node.airtimeChannel", { channel: k }) : _.t("node.airtimeBand", { band: name });
    td.replaceChildren(balken(w));
    zeile.hidden = false;
  });
}

export function createAirtimeRows(cfg: AirtimeConfig, nodeId: string): VNode[] {
  const prometheus = window.config.prometheus;
  if (!prometheus) return [];
  const url = `${prometheus.url.replace(/\/$/, "")}/api/v1/query?query=${encodeURIComponent(
    cfg.query.split("$node").join(nodeId),
  )}`;

  return cfg.bands.map((b) =>
    h(
      "tr",
      {
        key: "airtime-" + b.band,
        hook: {
          create: (_leer, vnode) => {
            (vnode.elm as HTMLElement).hidden = true;
          },
          insert: (vnode) => fuellen(vnode.elm as HTMLElement, url, b.band, b.name),
          postpatch: (_alt, vnode) => fuellen(vnode.elm as HTMLElement, url, b.band, b.name),
        },
      },
      [h("th"), h("td")],
    ),
  );
}
