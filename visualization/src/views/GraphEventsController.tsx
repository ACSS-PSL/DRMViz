import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { FC, PropsWithChildren, useEffect, useMemo } from "react";

function getMouseLayer() {
  return document.querySelector(".sigma-mouse");
}

const GraphEventsController: FC<PropsWithChildren<{ setHoveredNode: (node: string | null) => void; onNodeClick?: (nodeId: string) => void; onStageClick?: () => void }>> = ({
  setHoveredNode,
  onNodeClick,
  onStageClick,
  children,
}) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);
  const registerEvents = useRegisterEvents();

  /**
   * Initialize here settings that require to know the graph and/or the sigma
   * instance:
   */
  useEffect(() => {
    registerEvents({
      clickNode({ node }) {
        if (!graph.getNodeAttribute(node, "hidden")) {
          if (onNodeClick) onNodeClick(node);
        }
      },
      clickStage() {
        // Background click: clear selection via parent
        if (onStageClick) onStageClick();
      },
      enterNode({ node }) {
        setHoveredNode(node);
        // TODO: Find a better way to get the DOM mouse layer:
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.add("mouse-pointer");
      },
      leaveNode() {
        setHoveredNode(null);
        // TODO: Find a better way to get the DOM mouse layer:
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.remove("mouse-pointer");
      },
    });
  }, [graph, registerEvents, setHoveredNode, onNodeClick, onStageClick]);

  return <>{children}</>;
};

export default GraphEventsController;
