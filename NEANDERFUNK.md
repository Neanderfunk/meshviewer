# Zweig `neanderfunk`

Dieser Fork von [freifunk/meshviewer](https://github.com/freifunk/meshviewer)
liefert die Karte `neander.map.freifunk.space` von Freifunk Neanderland aus.
Der Zweig `main` folgt unverändert dem Original, unsere Änderungen liegen im
Zweig `neanderfunk`, je Funktion ein Commit, ursprünglich auf dem Upstream-Stand `6c68e3d`
(18.09.2026), seitdem per Merge nachgezogen (zuletzt `df76ed7`, 26.09.2026). Jeder Commit besteht die Typprüfung für sich; der Endstand
besteht die Tests des Projekts.

| Commit | Was |
| --- | --- |
| Knotenbeschriftung | Saum, Schrift und Abstand einstellbar, je Thema |
| Diagramme direkt | `prometheus-direct`: Zeitreihen ohne Grafana als Übersetzer |
| Zeiträume | Zeitraum aller Diagramme eines Knotens umschaltbar |
| Zeiträume im Verbindungsfenster | `linkCharts` mit derselben Zeitraumleiste wie im Knotenfenster |
| Service Worker | liefert unter `/grafana/` und `/nf/` nicht die Karte aus |
| Ganzzahlige Achsen | keine halben Clients mehr an der Achse |
| Wertezeilen | Zeilen im Knotenfenster aus den Zeitreihen, etwa die Funkkanäle |
| WMS-Ebenen | amtliche Luftbilder als Grundkarte |
| Koordinaten in einer Zeile | Standortwahl bietet "Breite, Länge" zum Kopieren, etwa für den UniFi-Controller |
| Links oben in der Statistik | `statisticsLinks`: etwa zur Gesamtsicht in Grafana |
| Zahnrad zum Service-Menü | `serviceLink`: kleines Zahnrad neben dem Knotennamen; Service Worker lässt die Anmeldung durch |
| Override am Zahnrad | `serviceOverrides`: URL einer Liste {node_id: ["ort", "ort-weg", "name"]}; das Zahnrad wird gelb, der Tooltip nennt, was überschrieben ist |
| Airtime je Funkband | `airtime`: Zeilen "Airtime Kanal 9" mit Balken wie bei HopGlass (empfangen, gesendet, andere), aus der Prometheus-API |
| Startausschnitt neben der Seitenleiste | `fixedCenter` wird rechts der offenen Seitenleiste eingepasst, nicht unter ihr |
| Startausschnitt enger | `fixedCenterZoomOffset`: so viele Zoomstufen enger als eingepasst, Mitte bleibt neben der Seitenleiste |
| Pause im Hintergrund | `pauseHiddenAfterMinutes`: ein Tab, der so lange nicht sichtbar ist, lädt nicht mehr jede Minute neu; beim Zurückkehren sofort |
| Kopierknopf hinter IP-Adressen | `ipCopyButton`: kopiert genau die Adresse, ohne den Tabulator, den das Markieren mitnimmt |
| Letzte Aktualisierung nur bei alten Daten | `lastUpdateAfterMinutes`: die Zeile erscheint erst, wenn die Daten älter sind als so viele Minuten |
| Laufzeit im richtigen Fall | `momentjs.relativeTimeWithoutSuffix` in der Sprachdatei: "3 Tage" statt "3 Tagen", de.json befüllt |
| Sprache vor den Daten | Kartendaten erst verarbeiten, wenn die Sprachdatei geladen ist; sonst blieben "zuletzt gesehen" und "erstmals gesehen" bis zum ersten Nachladen englisch ("4 minutes ago") |
| Kabel-Links blau ab einstellbarem TQ | `otherLinkMinTq`: Links vom Typ "other" erscheinen ab diesem TQ auf beiden Seiten in `otherLinkColor`; upstream fest 0.99, dann wurde ein Kabel-Link mit 0.98 grün wie Funk |

Alle neuen Konfigurationsschlüssel sind optional. Ohne sie verhält sich der
Zweig wie das Original.

Lizenz wie das Original: AGPL-3.0. Wer die Karte benutzt, findet hier den
Quelltext der Fassung, die sie ausliefert.

Aktualisieren auf einen neuen Upstream-Stand, per Merge, nicht per Rebase:
auf die Commits dieses Zweigs verweisen veröffentlichte Links (etwa aus
Forenbeiträgen), ein Rebase würde ihre IDs ändern und einen Force-Push
brauchen. Bis 25.09.2026 wurde rebased; seit 28.09.2026 (Upstream `df76ed7`)
wird zusammengeführt.

```bash
git fetch upstream
git merge upstream/main
npm ci && npx tsc --noEmit && npx vitest run && npx vite build
```

Welche Commits unsere sind, zeigt dann
`git log --no-merges --first-parent 6c68e3d..neanderfunk`.
