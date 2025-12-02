import { EdgeLabel } from "./types";

export const YEAR_LOWER_BOUND = 1985;
export const YEAR_UPPER_BOUND = 2023;
export const YEAR_STEP = 1;
export const RTL = false;
export const NUM_SEARCH_RESULTS = 8;
export const EDGE_LABELS_METADATA: EdgeLabel[] = [
    {
        key: "same_jury",
        name: "Members of the same jury",
        color_highlight: "#7E3FF2",
        color_fade: "#B794F6"
    },
    {
        key: "examines",
        name: "Examines",
        color_highlight: "#90EE03",
        color_fade: "#C6F68D"
    },
    {
        key: "supervizes",
        name: "Supervizes",
        color_highlight: "#FF9E22",
        color_fade: "#FFC77D"
    }
];