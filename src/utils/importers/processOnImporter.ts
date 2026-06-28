import type { ImportedGraph, ImportedNode, ImportedEdge, ImportResult } from './types';

interface ProcessOnNode {
  id: string;
  title?: string;
  parent?: string;
  children?: ProcessOnNode[];
  summaries?: Array<{
    title?: string;
    children?: ProcessOnNode[];
  }>;
}

function computeTreeSize(node: ProcessOnNode): number {
  const children = node.children || [];
  if (children.length === 0) return 60;
  let h = 0;
  for (const child of children) {
    h += computeTreeSize(child) + 60;
  }
  return h - 60;
}

function placeTree(
  node: ProcessOnNode,
  nodes: ImportedNode[],
  edges: ImportedEdge[],
  parentId: string | null,
  depth: number,
  startY: number
): void {
  const children = node.children || [];
  const totalHeight = computeTreeSize(node);
  const y = startY + totalHeight / 2;
  const id = node.id || `node-${nodes.length}`;
  nodes.push({ id, name: node.title || '', x: depth * 220, y });
  if (parentId) {
    edges.push({ source: parentId, target: id });
  }
  let childY = startY;
  for (const child of children) {
    const childHeight = computeTreeSize(child);
    placeTree(child, nodes, edges, id, depth + 1, childY);
    childY += childHeight + 60;
  }
}

export function parseProcessOnFile(text: string): ImportResult {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('ProcessOn .pos 文件不是有效 JSON');
  }

  const elements = data?.diagram?.elements;
  if (!elements) {
    throw new Error('无法识别 ProcessOn .pos 文件结构');
  }

  // Some .pos files have a tree of nodes under elements.children
  const rawChildren: ProcessOnNode[] = elements.children || [];
  if (rawChildren.length > 0) {
    const roots = rawChildren.filter((n: ProcessOnNode) => n.parent === 'root' || !n.parent);
    const title = elements.title || 'ProcessOn 导入';
    const nodes: ImportedNode[] = [];
    const edges: ImportedEdge[] = [];
    let yOffset = 0;
    for (const root of roots) {
      const h = computeTreeSize(root);
      placeTree(root, nodes, edges, null, 0, yOffset);
      yOffset += h + 120;
    }
    return { graphs: [{ name: title, nodes, edges }], crossEdges: [] };
  }

  // Fallback for flowchart-like structures
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
      const x = typeof n.x === 'number' ? n.x : 0;
      const y = typeof n.y === 'number' ? n.y : 0;
      nodes.push({ id, name: n.title || n.label || n.name || n.text || id, x, y });
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

  if (result.length === 0) {
    throw new Error('无法从 ProcessOn .pos 文件中提取有效节点');
  }
  return { graphs: result, crossEdges: [] };
}
