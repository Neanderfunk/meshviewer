// Neanderfunk: der sichtbare Kartenausschnitt fuer den Reiter "Ausschnitt".
// Die Karte meldet ihn nach jedem Verschieben und Zoomen, die Knotenliste
// hoert zu. null heisst: keine Karte da (Graph-Ansicht).
import L from "leaflet";

type Zuhoerer = (bounds: L.LatLngBounds | null) => void;

let aktuell: L.LatLngBounds | null = null;
const zuhoerer: Zuhoerer[] = [];

export function setBounds(bounds: L.LatLngBounds | null) {
  aktuell = bounds;
  zuhoerer.forEach((f) => f(bounds));
}

export function getBounds() {
  return aktuell;
}

export function onChange(f: Zuhoerer) {
  zuhoerer.push(f);
}
