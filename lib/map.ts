// Default import: a namespace snapshots leaflet's exports before the plugin below adds maplibreGL.
import L from "leaflet";
import "@maplibre/maplibre-gl-leaflet";

import { ClientLayer } from "./map/clientlayer.js";
import { LabelLayer } from "./map/labellayer.js";
import { Button } from "./map/button.js";
import "./map/activearea.js";
import * as viewport from "./viewport.js"; // Neanderfunk
import { Sidebar } from "./sidebar.js";
import { LatLng } from "leaflet";
import { Link, LinkId, LinkScale, Node, NodeId } from "./utils/node.js";
import { ObjectsLinksAndNodes } from "./datadistributor.js";
import { StyledMarker, StyledPolyline } from "./map/labellayer.js";
import { loadGeoLayers } from "./map/geoUtils.js";
import { Notice } from "./map/notice.js";

const options = {
  worldCopyJump: true,
  zoomControl: true,
  minZoom: 0,
};

export const Map = function (linkScale: LinkScale, sidebar: ReturnType<typeof Sidebar>, buttons: HTMLElement) {
  const self: {
    setData: (data: ObjectsLinksAndNodes) => void;
    resetView: () => void;
    gotoNode: (node: Node, nodeDict: { [k: NodeId]: Node }) => void;
    gotoLink: (link: [Link, ...Link[]]) => void;
    gotoLocation: (destination: L.LatLngLiteral & { zoom: number }) => void;
    destroy: () => void;
    render: (d: HTMLElement) => void;
  } = {
    setData: () => {},
    resetView: () => {},
    gotoNode: () => {},
    gotoLink: () => {},
    gotoLocation: () => {},
    destroy: () => {},
    render: () => {},
  };
  let savedView: { center: LatLng; zoom: number } | undefined;
  const config = window.config;

  let map: L.Map;
  let layerControl: L.Control.Layers;
  const baseLayers: Record<string, L.Layer> = {};

  function saveView() {
    savedView = {
      center: map.getCenter(),
      zoom: map.getZoom(),
    };
  }

  function contextMenuOpenLayerMenu() {
    document.querySelector(".leaflet-control-layers")!.classList.add("leaflet-control-layers-expanded");
  }

  function mapActiveArea() {
    map.setActiveArea({
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    });
  }

  function setActiveArea() {
    setTimeout(function () {
      mapActiveArea();
      ausschnittMelden();
    }, 300);
  }

  // Neanderfunk: Reiter "Ausschnitt" bekommt den sichtbaren Teil der Karte,
  // ohne die Seitenleiste (activearea)
  function ausschnittMelden() {
    if (!isDestroyed) {
      viewport.setBounds(map.getBounds());
    }
  }

  const el = document.createElement("div");
  el.classList.add("map");

  map = L.map(el, options);
  mapActiveArea();

  const now = new Date();
  config.mapLayers.forEach(function (item, i) {
    if (
      (typeof item.config.start === "number" && item.config.start <= now.getHours()) ||
      (typeof item.config.end === "number" && item.config.end > now.getHours())
    ) {
      item.config.order = (typeof item.config.start === "number" ? item.config.start : (item.config.end ?? i)) * -1;
    } else {
      item.config.order = i;
    }
  });

  config.mapLayers = config.mapLayers.sort(function (a, b) {
    return a.config.order - b.config.order;
  });

  const layers = config.mapLayers.map(function (layer) {
    const layerConfig = Object.assign({}, layer.config);
    if (layerConfig.invertInDarkMode) {
      layerConfig.className = (layerConfig.className ? layerConfig.className + " " : "") + "invert-in-dark-mode";
    }
    return {
      name: layer.name,
      layer:
        layer.type == "vector"
          ? L.maplibreGL({
              style: layer.url,
              attributionControl: { customAttribution: layerConfig.attribution },
              maxZoom: layerConfig.maxZoom,
              className: layerConfig.className,
            } as L.LeafletMaplibreGLOptions)
          : layerConfig.layers
            ? // Lokaler Zusatz: WMS statt Kachelsatz. Erkennbar an "layers",
              // dem Pflichtfeld jeder WMS-Anfrage. Gebraucht fuer die
              // amtlichen Luftbilder von NRW, die es als Kachelsatz nur ueber
              // einen Host gibt, den unser Kachel-Proxy nicht kennt.
              L.tileLayer.wms(layer.url, layerConfig as L.WMSOptions)
            : L.tileLayer(
                layer.url.replace(
                  "{format}",
                  document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0
                    ? "webp"
                    : "png",
                ),
                layerConfig,
              ),
    };
  });

  const firstLayer = layers[0];
  if (!firstLayer) {
    throw new Error("config.mapLayers must contain at least one layer");
  }
  map.addLayer(firstLayer.layer);

  layers.forEach(function (layer) {
    baseLayers[layer.name] = layer.layer;
  });

  const button = Button(map, buttons);

  map.on("locationfound", button.locationFound);
  map.on("locationerror", button.locationError);
  map.on("dragend", saveView);
  map.on("contextmenu", contextMenuOpenLayerMenu);

  let isDestroyed = false;
  let geoLayers: L.GeoJSON[] = [];
  const geoAbortController = new AbortController();
  const notice = Notice(map);

  if (config.geo) {
    void loadGeoLayers(
      config.geo,
      function (layer) {
        if (!isDestroyed) {
          geoLayers.push(layer);
          layer.addTo(map);
        }
      },
      fetch,
      function (message, err) {
        if (!isDestroyed) {
          notice.show(message + " " + (err instanceof Error ? err.message : String(err)));
        }
      },
      geoAbortController.signal,
    );
  }

  button.init();

  layerControl = L.control.layers(baseLayers, undefined, { position: "bottomright" });
  layerControl.addTo(map);

  map.zoomControl.setPosition("topright");

  const clientLayer = new ClientLayer({ minZoom: config.clientZoom });
  clientLayer.addTo(map);
  clientLayer.setZIndex(5);

  const labelLayer = new LabelLayer({ minZoom: config.labelZoom });
  labelLayer.addTo(map);
  labelLayer.setZIndex(6);

  sidebar.button.addEventListener("visibility", setActiveArea);

  map.on("moveend", ausschnittMelden);

  map.on("zoom", function () {
    clientLayer.redraw();
    labelLayer.redraw();
  });

  map.on("baselayerchange", function (e: L.LayersControlEvent) {
    const selectedLayer = baseLayers[e.name] as L.TileLayer;
    if (selectedLayer) {
      if (selectedLayer.options.maxZoom !== undefined) {
        const maxZoom = selectedLayer.options.maxZoom;
        map.options.maxZoom = maxZoom;
        clientLayer.options.maxZoom = maxZoom;
        labelLayer.options.maxZoom = maxZoom;

        if (map.getZoom() > maxZoom) {
          map.setZoom(maxZoom);
        }
      }
    }
  });

  map.on("load", function () {
    const inputs = document.querySelectorAll<HTMLInputElement>(".leaflet-control-layers-selector");
    inputs.forEach(function (input) {
      input.setAttribute("role", "radiogroup");
      const label = input.nextElementSibling;
      if (label) {
        input.setAttribute("aria-label", label.innerHTML.trim());
      }
    });
  });

  let nodeDict = Object.create(null) as Record<string, StyledMarker>;
  let linkDict = Object.create(null) as Record<string, StyledPolyline>;
  let highlight: { type: "node"; o: Node } | { type: "link"; o: Link } | undefined;

  function resetMarkerStyles(
    nodes: { [k: NodeId]: { resetStyle?: () => void } },
    links: { [k: LinkId]: { resetStyle?: () => void } },
  ) {
    Object.values(nodes).forEach(function (entry) {
      entry.resetStyle?.();
    });

    Object.values(links).forEach(function (entry) {
      entry.resetStyle?.();
    });
  }

  function setView(bounds: L.LatLngBoundsExpression, zoom?: number) {
    map.fitBounds(bounds, { maxZoom: zoom ? zoom : config.nodeZoom });
  }

  // Lokaler Zusatz: die Seitenleiste liegt ueber der Karte. Beim
  // Startausschnitt den Streifen unter ihr aussparen, sonst verschwindet der
  // Westrand der Knoten dahinter. Auf schmalen Bildschirmen, wo sie fast die
  // ganze Breite einnimmt, bleibt es beim ganzen Kartenfeld.
  function sidebarPadding(): L.PointTuple {
    const sidebarEl = document.querySelector<HTMLElement>(".sidebar");
    if (!sidebarEl || sidebarEl.classList.contains("hidden")) return [0, 0];
    const right = sidebarEl.getBoundingClientRect().right;
    return right > 0 && right < map.getSize().x / 2 ? [right, 0] : [0, 0];
  }

  function goto(element: { getLatLng?: () => L.LatLngExpression; getBounds?: () => L.LatLngBoundsExpression }) {
    let bounds: L.LatLngBoundsExpression;

    if ("getBounds" in element && typeof element.getBounds === "function") {
      bounds = element.getBounds()!;
    } else if ("getLatLng" in element && typeof element.getLatLng === "function") {
      bounds = L.latLngBounds([element.getLatLng()]);
    } else {
      return element;
    }

    setView(bounds);

    return element;
  }

  function updateView(nopanzoom?: boolean) {
    resetMarkerStyles(nodeDict, linkDict);
    let target: StyledMarker | StyledPolyline | undefined;

    if (highlight !== undefined) {
      if (highlight.type === "node") {
        const candidate = nodeDict[highlight.o.node_id];
        if (candidate) {
          target = candidate;
          target.setStyle(config.map.highlightNode);
        }
      } else if (highlight.type === "link") {
        const candidate = linkDict[highlight.o.id];
        if (candidate) {
          target = candidate;
          target.setStyle(config.map.highlightLink);
        }
      }
    }

    if (!nopanzoom) {
      if (target) {
        goto(target);
      } else if (savedView) {
        map.setView(savedView.center, savedView.zoom);
      } else if (config.fixedCenter) {
        const padding = sidebarPadding();
        const offset = config.fixedCenterZoomOffset ?? 0;
        if (offset) {
          // Lokaler Zusatz: um offset Stufen enger als der eingepasste
          // Ausschnitt, die Mitte des Ausschnitts bleibt die Mitte der
          // sichtbaren Flaeche rechts der Seitenleiste
          const bounds = L.latLngBounds(config.fixedCenter as L.LatLngExpression[]);
          const zoom = Math.min(map.getBoundsZoom(bounds, false, L.point(padding)) + offset, config.nodeZoom);
          const center = map.project(bounds.getCenter(), zoom).subtract(L.point(padding).divideBy(2));
          map.setView(map.unproject(center, zoom), zoom);
        } else {
          map.fitBounds(config.fixedCenter, { maxZoom: config.nodeZoom, paddingTopLeft: padding });
        }
      }
    }
  }

  self.setData = function setData(data: ObjectsLinksAndNodes) {
    nodeDict = Object.create(null) as Record<string, StyledMarker>;
    linkDict = Object.create(null) as Record<string, StyledPolyline>;

    clientLayer.setData(data);
    labelLayer.setData(data, map, nodeDict, linkDict, linkScale);

    updateView(true);
  };

  self.resetView = function resetView() {
    button.disableTracking();
    highlight = undefined;
    updateView();
  };

  self.gotoNode = function gotoNode(node: Node) {
    button.disableTracking();
    highlight = { type: "node", o: node };
    updateView();
  };

  self.gotoLink = function gotoLink(link: [Link, ...Link[]]) {
    button.disableTracking();
    highlight = { type: "link", o: link[0] };
    updateView();
  };

  self.gotoLocation = function gotoLocation(destination: L.LatLngLiteral & { zoom: number }) {
    button.disableTracking();
    // Lokaler Zusatz: der Punkt aus dem Link (#/de/map/<zoom>/<lat>/<lng>)
    // kommt in die Mitte der sichtbaren Flaeche rechts der Seitenleiste, nicht
    // in die Mitte des ganzen Fensters, wo ihn die Leiste halb verdeckt.
    // Schmale Bildschirme: sidebarPadding() ist dort 0, wie bisher.
    const zoom = destination.zoom;
    const padding = L.point(sidebarPadding());
    const center = map.project([destination.lat, destination.lng], zoom).subtract(padding.divideBy(2));
    map.setView(map.unproject(center, zoom), zoom);
  };

  self.destroy = function destroy() {
    isDestroyed = true;
    geoAbortController.abort();
    notice.clear();
    geoLayers.forEach(function (layer) {
      layer.remove();
    });
    geoLayers = [];
    button.clearButtons();
    sidebar.button.removeEventListener("visibility", setActiveArea);
    map.remove();
    viewport.setBounds(null);

    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  };

  self.render = function render(d: HTMLElement) {
    d.appendChild(el);
    map.invalidateSize();
  };

  return self;
};
