import { useSigma } from "@react-sigma/core";
import { Attributes } from "graphology-types";
import {FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BsSearch } from "react-icons/bs";
import Fuse from "fuse.js";
import Downshift, { StateChangeOptions, StateChangeTypes } from "downshift";
import { createPortal } from "react-dom";

import { FiltersState, ValueItem } from "../types";
import { NUM_SEARCH_RESULTS } from "../constants";

const SearchField: FC<{ filters: FiltersState; externalSelected?: string | null; onSelectNode?: (id: string) => void }> = ({ filters, externalSelected, onSelectNode }) => {
  const sigma = useSigma();
  const graph = useMemo(() => sigma.getGraph(), [sigma]);
  const graphRef = useRef(graph);

  const [search, setSearch] = useState<string>("");
  const [values, setValues] = useState<ValueItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const [isOpenLocal, setIsOpenLocal] = useState(false);

  const fuseIndex = useMemo(() => {
    const allNodes: ValueItem[] = [];

    graph.forEachNode((id: string, attrs: Attributes) => {
      if (!attrs.hidden && attrs.label) {
        allNodes.push({ id, label: attrs.label });
      }
    });

    return new Fuse(allNodes, {
      keys: ["label"],
      threshold: 0.3,
      ignoreLocation: true,
      ignoreDiacritics: true,

    });
  }, [graph]);

  // Debounce search
  const debounceTimeout = useRef<number | null>(null);

  const refreshValues = useCallback(
    (query: string) => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      debounceTimeout.current = window.setTimeout(() => {
        if (query.length < 2) {
          setValues([]);
          return;
        }

        const results = fuseIndex.search(query).map((r) => r.item).filter((item) => !graph.getNodeAttribute(item.id, "hidden"));

        const bestResults = results.slice(0, NUM_SEARCH_RESULTS);
        setValues(bestResults);
      }, 200);
    }, [fuseIndex, graph]
  );

  // Trigger search updates
  useEffect(() => {
    refreshValues(search);
  }, [search, refreshValues]);

  // Recompute when filters change
  useEffect(() => {
    requestAnimationFrame(() => refreshValues(search));
  }, [filters, refreshValues, search]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  // Ensure portal container exists (once)
  useEffect(() => {
    if (!portalRef.current) {
      const div = document.createElement("div");
      document.body.appendChild(div);
      portalRef.current = div;
    }
    return () => {
      // keep portal for reuse (do not remove)
    };
  }, []);

  // Compute menu position when open or when input/viewport changes
  useEffect(() => {
    let rAF = 0;

    // Avoid synchronous setState inside the effect body. Schedule updates via rAF.
    if (!isOpenLocal || !inputRef.current || values.length === 0) {
      // schedule clearing the menuStyle to the next frame instead of calling setMenuStyle synchronously
      rAF = window.requestAnimationFrame(() => setMenuStyle(null));
      return () => {
        if (rAF) window.cancelAnimationFrame(rAF);
      };
    }

    function update() {
      if (!inputRef.current) return;

      const rect = inputRef.current.getBoundingClientRect();
      const left = rect.left;
      const width = rect.width;
      const gap = 6;

      const spaceAbove = rect.top;

      const itemHeight = 17 + 16 + 2.736; // Text height + vertical paddings + top margin
      const desiredHeight = values.length * itemHeight + Math.max(values.length - 1, 0);  // Number of items multiplied by their height + the number of 1px inter-item borders
      const maxHeight = NUM_SEARCH_RESULTS * itemHeight + Math.max(values.length - 1, 0);

      if (spaceAbove >= maxHeight + gap) {  // anchor above using bottom
        const bottom = window.innerHeight - rect.top + gap;
        // defer setMenuStyle to avoid synchronous state change
        rAF = window.requestAnimationFrame(() => setMenuStyle({ position: "fixed", left, width, bottom, top: 'auto', right: 'auto', minHeight: desiredHeight, zIndex: 9999 }));
      } else {  // anchor below using top
        const top = rect.bottom + gap;
        rAF = window.requestAnimationFrame(() => setMenuStyle({ position: "fixed", left, width, top, bottom: 'auto', right: 'auto', minHeight: desiredHeight, zIndex: 9999 }));
      }
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      if (rAF) window.cancelAnimationFrame(rAF);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpenLocal, values.length]);

  useEffect(() => {
    if (!externalSelected) return;

    const label = graphRef.current.getNodeAttribute(externalSelected, "label");
    if (label) setSearch(label);
  }, [externalSelected]);

  return (
    <Downshift<ValueItem>
      inputValue={search}
      onSelect={(item) => {
        if (!item) return;
        setSearch(item.label);
        setValues([]);
        if (onSelectNode) onSelectNode(item.id);
      }}
      itemToString={(item) => (item ? item.label : "")}
      onStateChange={(changes: StateChangeOptions<ValueItem>) => {
        // If Downshift wants to change the input value, only accept it when it's a real input change
        // and ignore inputValue changes that happen because of blur/selection rollback.
        if (Object.prototype.hasOwnProperty.call(changes, "inputValue")) {
          const t = changes.type;

          // Allow updates for user typing and clear events, ignore blurs/mouseUps that restore previous value
          const allowTypes = new Set<StateChangeTypes>([Downshift.stateChangeTypes.changeInput, Downshift.stateChangeTypes.keyDownEnter, Downshift.stateChangeTypes.blurInput]);
          // Note: blurInput sometimes carries the current typed value — we want to prefer keeping typed value on blur
          // We'll handle blur specially: if the user blurred, don't overwrite current `search` (keep what we have).
          if (t === Downshift.stateChangeTypes.blurInput) {
            // ignore inputValue change coming from Downshift on blur to avoid resetting to previous selection
          } else if (allowTypes.has(t) || typeof t === "undefined") {
            setSearch(changes.inputValue ?? "");
          }
        }

        if (Object.prototype.hasOwnProperty.call(changes, "isOpen")) setIsOpenLocal(!!changes.isOpen);
      }}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        getRootProps,
        isOpen,
        highlightedIndex,
      }) => {
        const inputProps = getInputProps({
          placeholder: "Search in nodes...", 
          ref: (node: HTMLInputElement | null) => {
            inputRef.current = node;
          }
         });

        return (
          <div className="search-wrapper" {...getRootProps({}, { suppressRefError: true })}>
            <input
              type="text"
              aria-label="Search nodes"
              {...inputProps}
            />
            <BsSearch className="icon" />

            {portalRef.current && createPortal(
              <ul
                {...getMenuProps({}, { suppressRefError: true })}
                className="autocomplete-menu"
                style={isOpen && menuStyle ? menuStyle : { display: "none" }}
                aria-label="Search suggestions"
              >
                {isOpen && values.map((item, index) => (
                  <li
                    key={item.id}
                    {...getItemProps({ item, index })}
                    className={highlightedIndex === index ? "highlighted" : undefined}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>,
              portalRef.current
            )}
          </div>
        );
      }}
    </Downshift>
  );
};


export default SearchField;
