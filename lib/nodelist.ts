import moment from "moment";
import { h, VNode } from "snabbdom";
import { _ } from "./utils/language.js";
import { Heading, SortTable } from "./sorttable.js";
import * as helper from "./utils/helper.js";
import { Node } from "./utils/node.js";
import { CanSetData, ObjectsLinksAndNodes } from "./datadistributor.js";
import { CanRender } from "./container.js";
import * as viewport from "./viewport.js"; // Neanderfunk

function showUptime(uptime: number) {
  let seconds = uptime / 60000;
  if (Math.abs(seconds) < 60) {
    return Math.round(seconds) + " m";
  }
  seconds /= 60;
  if (Math.abs(seconds) < 24) {
    return Math.round(seconds) + " h";
  }
  seconds /= 24;
  return Math.round(seconds) + " d";
}

const headings: Heading<Node>[] = [
  {
    name: "",
  },
  {
    name: "node.nodes",
    sort: function (a, b) {
      return a.hostname.localeCompare(b.hostname);
    },
    reverse: false,
  },
  {
    name: "node.uptime",
    class: "ion-time",
    sort: function (a, b) {
      return a.uptime - b.uptime;
    },
    reverse: true,
  },
  {
    name: "node.links",
    class: "ion-share-alt",
    sort: function (a, b) {
      return a.neighbours.length - b.neighbours.length;
    },
    reverse: true,
  },
  {
    name: "node.clients",
    class: "ion-people",
    sort: function (a, b) {
      return a.clients - b.clients;
    },
    reverse: true,
  },
];

// nurAusschnitt (Neanderfunk): nur Knoten im sichtbaren Kartenausschnitt,
// fuer den Reiter "Im Bild"
export const Nodelist = function (nurAusschnitt = false): CanSetData & CanRender {
  const router = window.router;
  const table = SortTable<Node>(headings, 1, renderRow);
  let letzteDaten: ObjectsLinksAndNodes | undefined;
  const h2 = document.createElement("h2");
  const hinweis = document.createElement("p");
  hinweis.classList.add("ausschnitt-hinweis");

  if (nurAusschnitt) {
    viewport.onChange(function () {
      if (letzteDaten) {
        zeigen(letzteDaten);
      }
    });
  }

  function imAusschnitt(node: Node) {
    const bounds = viewport.getBounds();
    return (
      bounds !== null && helper.hasLocation(node) && bounds.contains([node.location.latitude, node.location.longitude])
    );
  }

  function zeigen(nodesData: ObjectsLinksAndNodes) {
    const now = nodesData.now ?? moment();
    const knoten = nurAusschnitt ? nodesData.nodes.all.filter(imAusschnitt) : nodesData.nodes.all;
    const nodesList = knoten.map(function (node) {
      const nodeData = Object.create(node);
      if (node.is_online) {
        nodeData.uptime = now.valueOf() - new Date(node.uptime).getTime();
      } else {
        nodeData.uptime = node.lastseen.valueOf() - now.valueOf();
      }
      return nodeData;
    });

    if (nurAusschnitt) {
      h2.textContent = _.t("node.inView", { smart_count: nodesList.length });
      hinweis.textContent = viewport.getBounds() === null ? _.t("node.inViewMapOnly") : "";
    }
    table.setData(nodesList);
  }

  function renderRow(node: Node) {
    let td0Content: string | VNode = "";
    if (helper.hasLocation(node)) {
      td0Content = h("span", { props: { className: "icon ion-location", title: _.t("location.location") } });
    }

    const td1Content = h(
      "a",
      {
        props: {
          className: ["hostname", node.is_online ? "online" : "offline"].join(" "),
          href: router.generateLink({ node: node.node_id }),
        },
        on: {
          click: function (e: Event) {
            router.fullUrl({ node: node.node_id }, e);
          },
        },
      },
      node.hostname,
    );

    return h("tr", [
      h("td", td0Content),
      h("td", td1Content),
      h("td", showUptime(node.uptime)),
      h("td", node.neighbours.length),
      h("td", node.clients),
    ]);
  }

  return {
    render(d: HTMLElement) {
      if (!nurAusschnitt) {
        h2.textContent = _.t("node.all");
      }
      d.appendChild(h2);
      if (nurAusschnitt) {
        d.appendChild(hinweis);
      }
      table.el.classList.add("node-list");
      d.appendChild(table.el);
    },

    setData(nodesData: ObjectsLinksAndNodes) {
      letzteDaten = nodesData;
      zeigen(nodesData);
    },
  };
};
