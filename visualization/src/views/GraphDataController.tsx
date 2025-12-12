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
    const { minYear, maxYear, edgeLabels, nodeRoles } = filters;
    graph.forEachEdge((e, { year, label }, source, target) => {
      const sourceRole = graph.getNodeAttribute(source, "role");
      const targetRole = graph.getNodeAttribute(target, "role");
      graph.setEdgeAttribute(e, "hidden", year < minYear || 
                                          year > maxYear || 
                                          !edgeLabels[label] || 
                                          !nodeRoles[sourceRole] || 
                                          !nodeRoles[targetRole]);
    });
    graph.forEachNode((node, { role }) => {
      let hideNode = true;
      if (nodeRoles[role]) {
        for (const e of graph.edges(node).values()) {
          if (!graph.getEdgeAttribute(e, "hidden")) {
            hideNode = false;
            break;
          }
        }
      }
      graph.setNodeAttribute(node, "hidden", hideNode);
    });
  }, [graph, filters]);

  return <>{children}</>;
};

export default GraphDataController;
