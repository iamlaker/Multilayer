export type Direction = 'forward' | 'backward' | 'bidirectional';

export interface NodeData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  shape?: string;
  width?: number;
  height?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderColor?: string;
  backgroundColor?: string;
  fontColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  brief?: string;
  detail?: string;
  table?: string;
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
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineColor?: string;
}

export interface LayerData {
  id: string;
  name: string;
  description: string;
  color?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderColor?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
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
