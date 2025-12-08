import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useState, useMemo } from "react";

import { FiltersState } from "../types";

function prettyPercentage(val: number): string {
  return (val * 100).toFixed(1) + "%";
}

const GraphTitle: FC<{ filters: FiltersState }> = ({ filters }) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);

  const [visibleItems, setVisibleItems] = useState<{ nodes: number; edges: number }>({ nodes: 0, edges: 0 });
  useEffect(() => {
    // To ensure the graphology instance has up to data "hidden" values for
    // nodes, we wait for next frame before reindexing. This won't matter in the
    // UX, because of the visible nodes bar width transition.
    requestAnimationFrame(() => {
      const index = { nodes: 0, edges: 0 };
      graph.forEachNode((_, { hidden }) => !hidden && index.nodes++);
      graph.forEachEdge((_, _2, _3, _4, source, target) => !source.hidden && !target.hidden && index.edges++);
      setVisibleItems(index);
    });
  }, [filters, graph]);

  return (
    <div className="graph-title">
      <h1>A cartography of current and former members of Dauphine Recherche en Management based on Ph. D. defenses</h1>
      <h2>
        <i>
          {graph.order} current or former member{graph.order > 1 ? "s" : ""}{" "}
          {visibleItems.nodes !== graph.order
            ? ` (only ${prettyPercentage(visibleItems.nodes / graph.order)} visible)`
            : ""}
          , {graph.size} link
          {graph.size > 1 ? "s" : ""}{" "}
          {visibleItems.edges !== graph.size
            ? ` (only ${prettyPercentage(visibleItems.edges / graph.size)} visible)`
            : ""}
        </i>
      </h2>
    </div>
  );
};

export default GraphTitle;
