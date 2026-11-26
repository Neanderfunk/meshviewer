import { _ } from "../utils/language.js";
import { CanFiltersChanged, DataDistributor, Filter } from "../datadistributor.js";
import { CanRender } from "../container.js";

export const FilterGui = function (distributor: ReturnType<typeof DataDistributor>): CanFiltersChanged & CanRender {
  const container = document.createElement("ul");
  container.classList.add("filters");
  const div = document.createElement("div");

  function render(el: HTMLElement) {
    el.appendChild(div);
  }

  function filtersChanged(filters: Filter[]) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    (filters as (Filter & CanRender)[]).forEach(function (filter) {
      const li = document.createElement("li");
      container.appendChild(li);
      filter.render(li);

      const button = document.createElement("button");
      button.classList.add("ion-close");
      button.setAttribute("aria-label", _.t("remove"));
      button.onclick = function onclick() {
        // Neanderfunk: das Namensfeld bleibt stehen und wird nur geleert
        if (filter.clear) {
          filter.clear();
        } else {
          distributor.removeFilter(filter);
        }
      };
      li.appendChild(button);
    });

    // Neanderfunk: ab zwei Filtern aus der Statistik alle auf einmal entfernen
    const removable = filters.filter(function (filter) {
      return !filter.clear;
    });
    if (removable.length > 1) {
      const li = document.createElement("li");
      li.classList.add("filter-remove-all");
      const button = document.createElement("button");
      button.textContent = _.t("sidebar.removeAllFilters");
      button.onclick = function onclick() {
        distributor.removeFilters(removable);
      };
      li.appendChild(button);
      container.appendChild(li);
    }

    if (container.parentNode === div && filters.length === 0) {
      div.removeChild(container);
    } else if (filters.length > 0) {
      div.appendChild(container);
    }
  }

  return {
    render,
    filtersChanged,
  };
};
