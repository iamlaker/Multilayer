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
  detail?: string;
  table?: string;
}

export interface ImportedCrossEdge {
  sourceLayer: string;
  sourceNode: string;
  targetLayer: string;
  targetNode: string;
  direction: string;
  type: string;
  brief: string;
  detail: string;
  table: string;
}

export interface ImportedGraph {
  name: string;
  nodes: ImportedNode[];
  edges: ImportedEdge[];
}

export interface ImportResult {
  graphs: ImportedGraph[];
  crossEdges: ImportedCrossEdge[];
}
