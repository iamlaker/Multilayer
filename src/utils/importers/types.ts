export interface ImportedNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface ImportedEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ImportedGraph {
  name: string;
  nodes: ImportedNode[];
  edges: ImportedEdge[];
}
