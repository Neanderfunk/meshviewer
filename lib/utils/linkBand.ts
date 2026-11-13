// Lokaler Zusatz (Neanderfunk): Band eines WLAN-Links aus der Frequenz der
// Schnittstellen (source_frequency/target_frequency aus dem yanic-Fork,
// Gluon-Patch respondd-wifi-frequency nach 4830.org). Ohne Angabe undefined.
import { Link } from "./node.js";

export function linkBand(link: Pick<Link, "source_frequency" | "target_frequency">): string | undefined {
  const f = link.source_frequency || link.target_frequency;
  if (!f) {
    return undefined;
  }
  if (f >= 2400 && f < 2500) {
    return "2.4 GHz";
  }
  if (f >= 5150 && f < 5925) {
    return "5 GHz";
  }
  if (f >= 5925 && f < 7125) {
    return "6 GHz";
  }
  return undefined;
}

// Linktyp mit Band, etwa "wifi (5 GHz)"
export function linkTypeLabel(link: Pick<Link, "type" | "source_frequency" | "target_frequency">): string {
  const band = linkBand(link);
  return band ? link.type + " (" + band + ")" : link.type;
}

// 2.4 GHz gestrichelt, wenn linkBandStyle an ist
export function linkBandDashed(link: Pick<Link, "source_frequency" | "target_frequency">): boolean {
  return !!window.config.linkBandStyle && linkBand(link) === "2.4 GHz";
}
