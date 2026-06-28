import { z } from 'zod';
import type { Direction, ProjectData } from './types';

const directionValues: Direction[] = ['forward', 'backward', 'bidirectional'];

export const NodeSchema = z.object({
  id: z.string().min(1, '节点 ID 不能为空'),
  name: z.string().min(1, '节点名称不能为空'),
  type: z.string().default('indicator'),
  x: z.number().default(0),
  y: z.number().default(0),
  shape: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  borderColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontColor: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.string().optional(),
  brief: z.string().default(''),
  detail: z.string().default(''),
  table: z.string().default(''),
});

export const EdgeSchema = z.object({
  id: z.string().min(1, '连线 ID 不能为空'),
  source: z.string().min(1, 'source 不能为空'),
  target: z.string().min(1, 'target 不能为空'),
  direction: z.enum(directionValues as [string, ...string[]]).default('forward'),
  type: z.string().default('default'),
  brief: z.string().default(''),
  detail: z.string().default(''),
  table: z.string().default(''),
  lineStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  lineColor: z.string().optional(),
});

export const LayerSchema = z.object({
  id: z.string().min(1, '图层 ID 不能为空'),
  name: z.string().min(1, '图层名称不能为空'),
  description: z.string().default(''),
  color: z.string().optional(),
  borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  borderColor: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  fontColor: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.string().optional(),
  nodes: z.array(NodeSchema).default([]),
  edges: z.array(EdgeSchema).default([]),
});

export const ProjectSchema = z.object({
  project: z.string().default('未命名项目'),
  version: z.string().default('1.0'),
  layers: z.array(LayerSchema).default([]),
  crossEdges: z.array(EdgeSchema).default([]),
});

export function validateProject(data: unknown): ProjectData {
  return ProjectSchema.parse(data) as ProjectData;
}

let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}
