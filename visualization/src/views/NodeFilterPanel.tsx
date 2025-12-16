import { useSigma } from "@react-sigma/core";
import { keyBy, mapValues, sortBy, values } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { BsPersonCircle } from "react-icons/bs";

import { NodeRole, FiltersState } from "../types";
import Panel from "./Panel";

const NodeFilterPanel: FC<{
  nodeRoles: NodeRole[];
  filters: FiltersState;
  toggleRole: (role: string) => void;
  setRoles: (roles: Record<string, boolean>) => void;
}> = ({ nodeRoles, filters, toggleRole, setRoles }) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);

  const nodesPerRole = useMemo(() => {
    const index: Record<string, number> = {};
    graph.forEachNode((_, { role }) => (index[role] = (index[role] || 0) + 1));
    return index;
  }, [graph]);

  const maxNodesPerRole = useMemo(() => Math.max(...values(nodesPerRole)), [nodesPerRole]);
  const visibleNodesCount = useMemo(() => Object.keys(filters.nodeRoles).length, [filters]);

  const [visibleNodesPerRole, setVisibleNodesPerRole] = useState<Record<string, number>>(nodesPerRole);
  useEffect(() => {
    // To ensure the graphology instance has up to date "hidden" values for
    // nodes, we wait for next frame before reindexing. This won't matter in the
    // UX, because of the visible nodes bar width transition.
    requestAnimationFrame(() => {
      const index: Record<string, number> = {};
      graph.forEachNode((_, { role, hidden }) => !hidden && (index[role] = (index[role] || 0) + 1));
      setVisibleNodesPerRole(index);
    });
  }, [filters, graph]);

  const sortedRoles = useMemo(
    () => sortBy(nodeRoles, (nodeRole) => (nodeRole.key === "unknown" ? Infinity : -nodesPerRole[nodeRole.key])),
    [nodeRoles, nodesPerRole],
  );

  return (
    <Panel
      title={
        <>
          <BsPersonCircle className="text-muted" /> Roles
          {visibleNodesCount < nodeRoles.length ? (
            <span className="text-muted text-small">
              {" "}
              ({visibleNodesCount} / {nodeRoles.length})
            </span>
          ) : (
            ""
          )}
        </>
      }
    >
      <p>
        <i className="text-muted">Click a category to show/hide members of the network depending on their role.</i>
      </p>
      <p className="buttons">
        <button className="btn" onClick={() => setRoles(mapValues(keyBy(nodeRoles, "key"), () => true))}>
          <AiOutlineCheckCircle /> Check all
        </button>{" "}
        <button className="btn" onClick={() => setRoles({})}>
          <AiOutlineCloseCircle /> Uncheck all
        </button>
      </p>
      <ul>
        {sortedRoles.map((nodeRole) => {
          const nodesCount = nodesPerRole[nodeRole.key];
          const visibleNodesCount = visibleNodesPerRole[nodeRole.key] || 0;
          return (
            <li
              className="caption-row"
              key={nodeRole.key}
              title={`${nodesCount} member${nodesCount > 1 ? "s" : ""}${
                visibleNodesCount !== nodesCount
                  ? visibleNodesCount > 0
                    ? ` (only ${visibleNodesCount > 1 ? `${visibleNodesCount} are` : "one is"} visible)`
                    : " (all hidden)"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={filters.nodeRoles[nodeRole.key] || false}
                onChange={() => toggleRole(nodeRole.key)}
                id={`nodeRole-${nodeRole.key}`}
              />
              <label htmlFor={`nodeRole-${nodeRole.key}`}>
                <span className="circle" style={{ backgroundColor: nodeRole.color_highlight }} />{" "}
                <div className="node-label">
                  <span>{nodeRole.name}</span>
                  <div className="bar" style={{ width: (100 * nodesCount) / maxNodesPerRole + "%" }}>
                    <div
                      className="inside-bar"
                      style={{
                        width: (100 * visibleNodesCount) / nodesCount + "%",
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

export default NodeFilterPanel;