import { useSigma } from "@react-sigma/core";
import { keyBy, mapValues, sortBy, values } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { FaPeopleArrows } from "react-icons/fa";

import { EdgeLabel, FiltersState } from "../types";
import Panel from "./Panel";

const EdgeFilterPanel: FC<{
  edgeLabels: EdgeLabel[];
  filters: FiltersState;
  toggleLabel: (label: string) => void;
  setLabels: (labels: Record<string, boolean>) => void;
}> = ({ edgeLabels, filters, toggleLabel, setLabels }) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);

  const edgesPerLabel = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachEdge((_, { label }) => (index[label] = (index[label] || 0) + 1));
    return index;
  }, [graph]);

  const maxEdgesPerLabel = useMemo(() => Math.max(...values(edgesPerLabel)), [edgesPerLabel]);
  const visibleLabelsCount = useMemo(() => Object.keys(filters.edgeLabels).length, [filters]);

  const [visibleEdgesPerLabel, setVisibleEdgesPerLabel] = useState<Record<string, number>>(edgesPerLabel);
  useEffect(() => {
    // To ensure the graphology instance has up to date "hidden" values for
    // nodes, we wait for next frame before reindexing. This won't matter in the
    // UX, because of the visible nodes bar width transition.
    requestAnimationFrame(() => {
      const index: Record<string, number> = {};
      graph.forEachEdge((_, { label, hidden }) => !hidden && (index[label] = (index[label] || 0) + 1));
      setVisibleEdgesPerLabel(index);
    });
  }, [filters, graph]);

  const sortedLabels = useMemo(
    () => sortBy(edgeLabels, (edgeLabel) => (edgeLabel.key === "unknown" ? Infinity : -edgesPerLabel[edgeLabel.key])),
    [edgeLabels, edgesPerLabel],
  );

  return (
    <Panel
      title={
        <>
          <FaPeopleArrows className="text-muted" /> Link categories
          {visibleLabelsCount < edgeLabels.length ? (
            <span className="text-muted text-small">
              {" "}
              ({visibleLabelsCount} / {edgeLabels.length})
            </span>
          ) : (
            ""
          )}
        </>
      }
    >
      <p>
        <i className="text-muted">Click a category to show/hide related links from the network. Categories with an imperative name have links directed from the subject to the object.</i>
      </p>
      <p className="buttons">
        <button className="btn" onClick={() => setLabels(mapValues(keyBy(edgeLabels, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={() => setLabels({})}>
          <AiOutlineCloseCircle /> Uncheck all
        </button>
      </p>
      <ul>
        {sortedLabels.map((edgeLabel) => {
          const edgesCount = edgesPerLabel[edgeLabel.key];
          const visibleEdgesCount = visibleEdgesPerLabel[edgeLabel.key] || 0;
          return (
            <li
              className="caption-row"
              key={edgeLabel.key}
              title={`${edgesCount} link${edgesCount > 1 ? "s" : ""}${
                visibleEdgesCount !== edgesCount
                  ? visibleEdgesCount > 0
                    ? ` (only ${visibleEdgesCount > 1 ? `${visibleEdgesCount} are` : "one is"} visible)`
                    : " (all hidden)"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={filters.edgeLabels[edgeLabel.key] || false}
                onChange={() => toggleLabel(edgeLabel.key)}
                id={`edgeLabel-${edgeLabel.key}`}
              />
              <label htmlFor={`edgeLabel-${edgeLabel.key}`}>
                <span className="circle" style={{ backgroundColor: edgeLabel.color_highlight }} />{" "}
                <div className="node-label">
                  <span>{edgeLabel.name}</span>
                  <div className="bar" style={{ width: (100 * edgesCount) / maxEdgesPerLabel + "%" }}>
                    <div
                      className="inside-bar"
                      style={{
                        width: (100 * visibleEdgesCount) / edgesCount + "%",
                      }}
                    />
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};

export default EdgeFilterPanel;