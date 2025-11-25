import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useMemo } from "react";
import { BiReset } from "react-icons/bi";
import { MdDateRange } from "react-icons/md";
import { Range, getTrackBackground } from "react-range";

import { FiltersState } from "../types";
import { YEAR_STEP, RTL } from "../constants";
import Panel from "./Panel";

const YearRangePanel: FC<{
  lowerBound: number;
  upperBound: number;
  filters: FiltersState;
  setYearRange: (minYear: number, maxYear: number) => void;
}> = ({ lowerBound, upperBound, filters, setYearRange }) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);

  // TODO: When panel is folded, show year range

  useEffect(() => {
    // To ensure the graphology instance has up to date "hidden" values for
    // nodes, we wait for next frame before reindexing. This won't matter in the
    // UX, because of the visible nodes bar width transition.
    requestAnimationFrame(() => {
      const index: Record<string, number> = {};
      graph.forEachNode((_, { tag, hidden }) => !hidden && (index[tag] = (index[tag] || 0) + 1));
    });
  }, [filters, graph]);

  return (
    <Panel
      title={
        <>
          <MdDateRange className="text-muted" /> Year Range
        </>
      }
    >
      <p>
        <i className="text-muted">Drag and drop to select the time window for which you want to see the interactions.</i>
      </p>
      <p className="buttons">
        <button className="btn" onClick={() => setYearRange(1985, 2023)}>
          <BiReset /> Reset
        </button>
      </p>
      <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        paddingLeft: "1em",
        paddingRight: "1em",
      }}
    >
      <Range
        values={[filters.minYear, filters.maxYear]}
        step={YEAR_STEP}
        min={lowerBound}
        max={upperBound}
        rtl={RTL}
        onChange={(values) => {
          setYearRange(values[0], values[1]);
        }}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: "36px",
              display: "flex",
              width: "100%",
            }}
          >
            <div
              ref={props.ref}
              style={{
                height: "5px",
                width: "100%",
                borderRadius: "4px",
                background: getTrackBackground({
                  values: [filters.minYear, filters.maxYear],
                  colors: ["#ccc", "#548BF4", "#ccc"],
                  min: lowerBound,
                  max: upperBound,
                  rtl: RTL,
                }),
                alignSelf: "center",
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props, isDragged }) => (
          <div
            {...props}
            key={props.key}
            style={{
              ...props.style,
              height: "36px",
              width: "36px",
              borderRadius: "4px",
              backgroundColor: "#FFF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0px 2px 6px #AAA",
            }}
          >
            <div
              style={{
                height: "16px",
                width: "5px",
                backgroundColor: isDragged ? "#548BF4" : "#CCC",
              }}
            />
          </div>
        )}
      />
      <output style={{ marginTop: "30px" }} id="output">
        {filters.minYear.toFixed(0)} - {filters.maxYear.toFixed(0)}
      </output>
    </div>
    </Panel>
  );
};

export default YearRangePanel;
