# Zweig `neanderfunk`

Dieser Fork von [freifunk/meshviewer](https://github.com/freifunk/meshviewer)
liefert die Karte `neander.map.freifunk.space` von Freifunk Neanderland aus.
Der Zweig `main` folgt unverändert dem Original, unsere Änderungen liegen im
Zweig `neanderfunk`, je Funktion ein Commit auf dem Upstream-Stand `6c68e3d`
(18.09.2026). Jeder Commit besteht die Typprüfung für sich; der Endstand
besteht die Tests des Projekts.

| Commit | Was |
| --- | --- |
| Knotenbeschriftung | Saum, Schrift und Abstand einstellbar, je Thema |
| Diagramme direkt | `prometheus-direct`: Zeitreihen ohne Grafana als Übersetzer |
| Zeiträume | Zeitraum aller Diagramme eines Knotens umschaltbar |
| Service Worker | liefert unter `/grafana/` und `/nf/` nicht die Karte aus |
| Ganzzahlige Achsen | keine halben Clients mehr an der Achse |
| Wertezeilen | Zeilen im Knotenfenster aus den Zeitreihen, etwa die Funkkanäle |
| WMS-Ebenen | amtliche Luftbilder als Grundkarte |
| Koordinaten in einer Zeile | Standortwahl bietet "Breite, Länge" zum Kopieren, etwa für den UniFi-Controller |
| Links oben in der Statistik | `statisticsLinks`: etwa zur Gesamtsicht in Grafana |
| Zahnrad zum Service-Menü | `serviceLink`: kleines Zahnrad neben dem Knotennamen; Service Worker lässt die Anmeldung durch |

Alle neuen Konfigurationsschlüssel sind optional. Ohne sie verhält sich der
Zweig wie das Original.

Lizenz wie das Original: AGPL-3.0. Wer die Karte benutzt, findet hier den
Quelltext der Fassung, die sie ausliefert.

Aktualisieren auf einen neuen Upstream-Stand:

```bash
git fetch upstream
git rebase <neuer-upstream-commit> neanderfunk
npx tsc --noEmit && npx vitest run
```
