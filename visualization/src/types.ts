export interface NodeData {
  key: string;
  label: string;
  role: string;
  weight: number;
  x: number;
  y: number;
}

export interface EdgeData {
  source: string;
  target: string;
  weight: number;
  year: number;
  label: string;
}

export interface Cluster {
  key: string;
  color: string;
  clusterLabel: string;
}

export interface EdgeLabel {
  key: string;
  name: string;
  color_highlight: string;
  color_fade: string;
}

export interface NodeLabel {
  key: string;
  name: string;
  color_highlight: string;
  color_fade: string;
}

export interface Dataset {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface FiltersState {
  minYear: number;
  maxYear: number;
  edgeLabels: Record<string, boolean>;
}
