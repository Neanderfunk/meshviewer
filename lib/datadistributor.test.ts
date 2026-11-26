import { describe, expect, it, vi } from "vitest";
import { DataDistributor, Filter } from "./datadistributor.js";
import { Node } from "./utils/node.js";

// Neanderfunk: removeFilters fuer den Knopf "alle Filter entfernen"
describe("DataDistributor.removeFilters", () => {
  const a = { hostname: "a" } as Node;
  const b = { hostname: "b" } as Node;
  const c = { hostname: "c" } as Node;

  function filter(key: string, keep: Node[]): Filter {
    return { getKey: () => key, setRefresh: vi.fn(), run: (n: Node) => keep.includes(n) };
  }

  it("removes the listed filters with a single refresh and keeps the others", () => {
    const d = DataDistributor();
    const all = [a, b, c];
    d.setData({ links: [], nodes: { all, lost: [], new: [], online: all, offline: [] } });

    const name = filter("name", [a, b, c]);
    const f1 = filter("f1", [a, b]);
    const f2 = filter("f2", [a]);
    [name, f1, f2].forEach(d.addFilter);

    const target = { setData: vi.fn() };
    d.add(target);
    const observer = { filtersChanged: vi.fn() };
    d.watchFilters(observer);
    target.setData.mockClear();
    observer.filtersChanged.mockClear();

    d.removeFilters([f1, f2]);

    expect(target.setData).toHaveBeenCalledTimes(1);
    expect(target.setData.mock.calls[0]?.[0].nodes.all).toEqual([a, b, c]);
    expect(observer.filtersChanged).toHaveBeenCalledTimes(1);
    expect(observer.filtersChanged).toHaveBeenCalledWith([name]);
  });
});
