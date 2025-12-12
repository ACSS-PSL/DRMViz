import { useSetSettings, useSigma } from "@react-sigma/core";
import { Attributes } from "graphology-types";
import { FC, PropsWithChildren, useEffect, useMemo } from "react";

import { EDGE_LABELS_METADATA, NODE_ROLES_METADATA } from "../constants";
import { drawHover, drawLabel } from "../canvas-utils";
import useDebounce from "../use-debounce";
import { find } from "lodash";

const GraphSettingsController: FC<PropsWithChildren<{ hoveredNode: string | null }>> = ({ children, hoveredNode }) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);
  const setSettings = useSetSettings();

  // Here we debounce the value to avoid having too much highlights refresh when
  // moving the mouse over the graph:
  const debouncedHoveredNode = useDebounce(hoveredNode, 40);

  /**
   * Initialize here settings that require to know the graph and/or the sigma
   * instance:
   */
  useEffect(() => {
    setSettings({
      defaultDrawNodeLabel: drawLabel,
      defaultDrawNodeHover: drawHover,
      nodeReducer: (node: string, data: Attributes) => {
        if (debouncedHoveredNode) {
          return node === debouncedHoveredNode ||
            graph.hasEdge(node, debouncedHoveredNode) ||
            graph.hasEdge(debouncedHoveredNode, node)
            ? { ...data, zIndex: 1, color: find(NODE_ROLES_METADATA, { key: data["role"] })?.color_highlight || "#757575" }
            : { ...data, zIndex: 0, label: "", color: find(NODE_ROLES_METADATA, { key: data["role"] })?.color_fade || "#BDBDBD", image: null, highlighted: false };
        }
        return data;
      },
      edgeReducer: (edge: string, data: Attributes) => {
        if (debouncedHoveredNode) {
          return graph.hasExtremity(edge, debouncedHoveredNode)
            ? { ...data, color: find(EDGE_LABELS_METADATA, { key: data["label"] })?.color_highlight || "#444", size: 4 }
            : { ...data, color: find(EDGE_LABELS_METADATA, { key: data["label"] })?.color_fade || "#999", hidden: true };
        }
        return data;
      },
    });
  }, [sigma, graph, debouncedHoveredNode, setSettings]);

  /**
   * Update node and edge reducers when a node is hovered, to highlight its
   * neighborhood:
   */
  useEffect(() => {
    //const hoveredColor: string = (debouncedHoveredNode && sigma.getNodeDisplayData(debouncedHoveredNode)?.color) || "";

    sigma.setSetting(
      "nodeReducer",
      debouncedHoveredNode
        ? (node, data) =>
            node === debouncedHoveredNode ||
            graph.hasEdge(node, debouncedHoveredNode) ||
            graph.hasEdge(debouncedHoveredNode, node)
              ? { ...data, zIndex: 1, color: find(NODE_ROLES_METADATA, { key: data["role"] })?.color_highlight || "#757575" }
              : { ...data, zIndex: 0, label: "", color: find(NODE_ROLES_METADATA, { key: data["role"] })?.color_fade || "#BDBDBD", image: null, highlighted: false }
        : null,
    );
    sigma.setSetting(
      "edgeReducer",
      debouncedHoveredNode
        ? (edge, data) =>
            graph.hasExtremity(edge, debouncedHoveredNode)
              ? { ...data, color: find(EDGE_LABELS_METADATA, { key: data["label"] })?.color_highlight || "#444", size: 4 }
              : { ...data, color: find(EDGE_LABELS_METADATA, { key: data["label"] })?.color_fade || "#999", hidden: true }
        : null,
    );
  }, [debouncedHoveredNode, sigma, graph]);

  return <>{children}</>;
};

export default GraphSettingsController;
