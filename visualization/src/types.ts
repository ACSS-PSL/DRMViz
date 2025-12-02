export interface NodeData {
  key: string;
  label: string;
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

export interface Tag {
  key: string;
  image: string;
}

export interface Dataset {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface FiltersState {
  minYear: number;
  maxYear: number;
}
