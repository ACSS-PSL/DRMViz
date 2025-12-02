import { FullScreenControl, SigmaContainer, ZoomControl } from "@react-sigma/core";
import { createNodeImageProgram } from "@sigma/node-image";
import Graph from "graphology";
import { FC, useEffect, useMemo, useState } from "react";
import { BiBookContent, BiRadioCircleMarked } from "react-icons/bi";
import { BsArrowsFullscreen, BsFullscreenExit, BsZoomIn, BsZoomOut } from "react-icons/bs";
import { GrClose } from "react-icons/gr";
import { Settings } from "sigma/settings";

import { drawHover, drawLabel } from "../canvas-utils";
import { YEAR_LOWER_BOUND, YEAR_UPPER_BOUND, COLOR_PALETTE_FADE } from "../constants"
import { Dataset, FiltersState } from "../types";
import DescriptionPanel from "./DescriptionPanel";
import GraphDataController from "./GraphDataController";
import GraphEventsController from "./GraphEventsController";
import GraphSettingsController from "./GraphSettingsController";
import GraphTitle from "./GraphTitle";
import SearchField from "./SearchField";
import YearRangePanel from "./YearRangePanel";

const Root: FC = () => {
  const graph = useMemo(() => new Graph({ multi: true, type: "mixed" }), []);
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filtersState, setFiltersState] = useState<FiltersState>({
    minYear: YEAR_LOWER_BOUND,
    maxYear: YEAR_UPPER_BOUND
  });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const sigmaSettings: Partial<Settings> = useMemo(() => ({
    nodeProgramClasses: {
      image: createNodeImageProgram({
        size: { mode: "force", value: 256 },
      }),
    },
    defaultDrawNodeLabel: drawLabel,
    defaultDrawNodeHover: drawHover,
    defaultNodeType: "image",
    defaultEdgeType: "line",
    labelDensity: 0.07,
    labelGridCellSize: 60,
    labelRenderedSizeThreshold: 15,
    labelFont: "Lato, sans-serif",
    zIndex: true,
  }), []);

  // Load data on mount:
  useEffect(() => {
    fetch(`./data/dataset.json`)
      .then((res) => res.json())
      .then((dataset: Dataset) => {
        //const clusters = keyBy(dataset.clusters, "key");
        //const tags = keyBy(dataset.tags, "key");

        dataset.nodes.forEach((node) =>
          graph.addNode(node.key, {
            ...node,
            //...omit(clusters[node.cluster], "key"),
            //image: `./images/${tags[node.tag].image}`,
          }),
        );

        dataset.edges.forEach((edge) => {
          const commonAttrs = {
            year: edge["year"],
            label: edge["label"],
            color: COLOR_PALETTE_FADE[edge["label"]] || "#999",
          };

          if (edge["label"] === "same_jury") {
            graph.addUndirectedEdge(edge["source"], edge["target"], { ...commonAttrs, type: "line" });
          } else {
            graph.addDirectedEdge(edge["source"], edge["target"], { ...commonAttrs, type: "arrow" });
          }
        });

        const scores = graph.nodes().map((node) => graph.getNodeAttribute(node, "weight"));
        const minDegree = Math.min(...scores);
        const maxDegree = Math.max(...scores);

        const MIN_NODE_SIZE = 3;
        const MAX_NODE_SIZE = 15;
        graph.forEachNode((node) =>
          graph.setNodeAttribute(
            node,
            "size",
            ((graph.getNodeAttribute(node, "weight") - minDegree) / (maxDegree - minDegree)) *
              (MAX_NODE_SIZE - MIN_NODE_SIZE) +
              MIN_NODE_SIZE,
          )
        );

        setFiltersState({
          minYear: YEAR_LOWER_BOUND,
          maxYear: YEAR_UPPER_BOUND
        });
        setDataset(dataset);
        requestAnimationFrame(() => setDataReady(true));
      });
  }, [graph]);

  if (!dataset) return null;

  return (
    <div id="app-root" className={showContents ? "show-contents" : ""}>
      <SigmaContainer graph={graph} settings={sigmaSettings} className="react-sigma">
        <GraphSettingsController hoveredNode={hoveredNode} />
        <GraphEventsController setHoveredNode={setHoveredNode} />
        <GraphDataController filters={filtersState} />

        {dataReady && (
          <>
            <div className="controls">
              <div className="react-sigma-control ico">
                <button
                  type="button"
                  className="show-contents"
                  onClick={() => setShowContents(true)}
                  title="Show caption and description"
                >
                  <BiBookContent />
                </button>
              </div>
              <FullScreenControl className="ico">
                <BsArrowsFullscreen />
                <BsFullscreenExit />
              </FullScreenControl>

              <ZoomControl className="ico">
                <BsZoomIn />
                <BsZoomOut />
                <BiRadioCircleMarked />
              </ZoomControl>
            </div>
            <div className="contents">
              <div className="ico">
                <button
                  type="button"
                  className="ico hide-contents"
                  onClick={() => setShowContents(false)}
                  title="Show caption and description"
                >
                  <GrClose />
                </button>
              </div>
              <GraphTitle filters={filtersState} />
              <div className="panels">
                <SearchField filters={filtersState} />
                <DescriptionPanel />
                <YearRangePanel
                  lowerBound={YEAR_LOWER_BOUND}
                  upperBound={YEAR_UPPER_BOUND}
                  filters={filtersState}
                  setYearRange={(minYear, maxYear) =>
                    setFiltersState((filters) => ({
                      ...filters,
                      minYear,
                      maxYear
                    }))
                  }
                />
              </div>
            </div>
          </>
        )}
      </SigmaContainer>
    </div>
  );
};

export default Root;
