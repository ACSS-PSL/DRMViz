import { useSigma } from "@react-sigma/core";
import { FC, PropsWithChildren, useEffect } from "react";

import { FiltersState } from "../types";

const GraphDataController: FC<PropsWithChildren<{ filters: FiltersState }>> = ({ filters, children }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    const { minYear, maxYear } = filters;
    graph.forEachEdge((e, attr, _source, _target) => {
      graph.setEdgeAttribute(e, "hidden", attr["year"] < minYear || attr["year"] > maxYear);
    })
    graph.forEachNode(node => {
      let hideNode = true;
      for (const e of graph.edges(node).values()) {
        graph.getEdgeAttribute(e, "hidden")
        if (!graph.getEdgeAttribute(e, "hidden")) {
          hideNode = false;
          break;
        }
      }
      graph.setNodeAttribute(node, "hidden", hideNode);
    });
  }, [graph, filters]);

  return <>{children}</>;
};

export default GraphDataController;
