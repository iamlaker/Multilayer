import type { ImportedGraph, ImportedNode, ImportedEdge } from './types';

function getName(node: any): string {
  if (typeof node.text === 'string') return node.text;
  if (typeof node.label === 'string') return node.label;
  if (typeof node.name === 'string') return node.name;
  if (typeof node.title === 'string') return node.title;
  return node.id || '节点';
}

function getXY(node: any): { x: number; y: number } {
  const geom = node.geometry || node.geo || node;
  return {
    x: typeof geom.x === 'number' ? geom.x : 0,
    y: typeof geom.y === 'number' ? geom.y : 0,
  };
}

function extractNodesEdges(data: any): ImportedGraph[] {
  // Try common shapes
  const pages = data.pages || data.diagrams || data.sheets || [data];
  const result: ImportedGraph[] = [];

  for (const page of pages) {
    const name = page.name || page.title || '图层';
    const nodes: ImportedNode[] = [];
    const edges: ImportedEdge[] = [];

    const rawNodes =
      page.nodes ||
      page.shapes ||
      page.elements?.filter((e: any) => e.type === 'node' || e.type === 'shape' || !e.type) ||
      [];

    const rawEdges =
      page.edges ||
      page.connectors ||
      page.elements?.filter((e: any) => e.type === 'edge' || e.type === 'connector') ||
      [];

    for (const n of rawNodes) {
      const id = String(n.id ?? Math.random().toString(36).slice(2));
      const pos = getXY(n);
      nodes.push({ id, name: getName(n), x: pos.x, y: pos.y });
    }

    for (const e of rawEdges) {
      const source = e.source ?? e.from ?? e.sourceId;
      const target = e.target ?? e.to ?? e.targetId;
      if (source == null || target == null) continue;
      const label = e.label ?? e.text ?? '';
      edges.push({ source: String(source), target: String(target), label });
    }

    if (nodes.length > 0) {
      result.push({ name, nodes, edges });
    }
  }

  return result;
}

export function parseProcessOnFile(text: string): ImportedGraph[] {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('ProcessOn .pos 文件不是有效 JSON');
  }

  const graphs = extractNodesEdges(data);
  if (graphs.length === 0) {
    throw new Error(
      '无法识别 ProcessOn .pos 文件结构。请提供一个样例文件以便精确适配。'
    );
  }
  return graphs;
}
