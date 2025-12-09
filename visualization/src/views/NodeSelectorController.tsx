import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useRef } from "react";

const NodeSelectorController: FC<{ selectedNode: string | null }> = ({ selectedNode }) => {
  const sigma = useSigma();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // cleanup previous
    if (cleanupRef.current) {
      try {
        cleanupRef.current();
      } catch (e) {
        // ignore
      }
      cleanupRef.current = null;
    }

    if (!selectedNode) return;

    // perform selection (highlight + camera) - inlined from nodeSelector
    try {
      sigma.getGraph().setNodeAttribute(selectedNode, "highlighted", true);
    } catch (e) {
      // ignore
    }

    const pos = sigma.getNodeDisplayData(selectedNode as any);
    if (pos) {
      sigma.getCamera().animate(
        { ...pos, ratio: 0.05 },
        { duration: 600 }
      );
    }

    cleanupRef.current = () => {
      try {
        sigma.getGraph().setNodeAttribute(selectedNode, "highlighted", false);
      } catch (e) {
        // ignore
      }
    };

    return () => {
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (e) {}
        cleanupRef.current = null;
      }
    };
  }, [selectedNode, sigma]);

  return null;
};

export default NodeSelectorController;
