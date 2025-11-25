export interface NodeData {
  key: string;
  label: string;
  gender: string;
  x: number;
  y: number;
}

export interface EdgeData {
  source: string;
  target: string;
  weight: number;
  year: number;
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
