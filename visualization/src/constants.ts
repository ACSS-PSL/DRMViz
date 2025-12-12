import { EdgeLabel, NodeRole } from "./types";

export const YEAR_LOWER_BOUND = 1985;
export const YEAR_UPPER_BOUND = 2023;
export const YEAR_STEP = 1;
export const RTL = false;
export const NUM_SEARCH_RESULTS = 8;
export const NODE_ROLES_METADATA: NodeRole[] = [
    {
        key: "phd_student",
        name: "Ph. D. Student in DRM",
        color_highlight: "#F44336",
        color_fade: "#E57373"
    },
    {
        key: "advisor",
        name: "Ph. D. Advisor in DRM",
        color_highlight: "#29B6F6",
        color_fade: "#81D4FA"
    },
    {
        key: "jury_member",
        name: "Member of DRM thesis juries",
        color_highlight: "#757575",
        color_fade: "#BDBDBD"
    }
];
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