export type Direction = 'forward' | 'backward' | 'bidirectional';

export interface NodeData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  direction: Direction;
  type: string;
  brief: string;
  detail: string;
  table: string;
}

export interface LayerData {
  id: string;
  name: string;
  description: string;
  color?: string;
  x?: number;
  y?: number;
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface ProjectData {
  project: string;
  version: string;
  layers: LayerData[];
  crossEdges: EdgeData[];
}

export interface DetailPopupState {
  edgeId: string;
  x: number;
  y: number;
}
