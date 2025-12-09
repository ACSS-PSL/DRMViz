import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useMemo, useRef } from "react";

const NodeSelectorController: FC<{ selectedNode: string | null }> = ({ selectedNode }) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // capture the id so cleanup refers to the same node
    const id = selectedNode;
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!id) return;

    const camera = sigma.getCamera();

    if (graph.hasNode(id) && !graph.getNodeAttribute(id, "hidden")) {
      try {
        graph.setNodeAttribute(id, "highlighted", true);
      } catch (err) {
        // log unexpected errors so we can debug
        console.warn("Failed to highlight node", id, err);
      }
    } else {
      return;
    }

    const pos = sigma.getNodeDisplayData(id);
    if (pos && camera) {
      try {
        camera.animate({ ...pos, ratio: 0.05 }, { duration: 600 });
      } catch (err) {
        console.warn("Camera animate failed for node", id, err);
      }
    }

    cleanupRef.current = () => {
      try {
        if (graph.hasNode(id)) graph.setNodeAttribute(id, "highlighted", false);
      } catch (err) {
        console.warn("Failed to remove highlighted attribute for node", id, err);
      }
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [selectedNode, sigma, graph]);

  return null;
};

export default NodeSelectorController;
