import type { ImportedGraph, ImportedNode, ImportedEdge } from './types';

function layoutByLevels(nodes: ImportedNode[], edges: ImportedEdge[]): void {
  const nodeMap = new Map<string, ImportedNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const n of nodes) {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  }
  for (const e of edges) {
    if (incoming.has(e.target)) incoming.get(e.target)!.push(e.source);
    if (outgoing.has(e.source)) outgoing.get(e.source)!.push(e.target);
  }

  const levels = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, arr] of incoming) {
    if (arr.length === 0) {
      levels.set(id, 0);
      queue.push(id);
    }
  }

  while (queue.length) {
    const id = queue.shift()!;
    const level = levels.get(id) ?? 0;
    for (const next of outgoing.get(id) || []) {
      const nextLevel = Math.max(levels.get(next) ?? -1, level + 1);
      levels.set(next, nextLevel);
      queue.push(next);
    }
  }

  const groups = new Map<number, string[]>();
  for (const id of nodes.map((n) => n.id)) {
    const level = levels.get(id) ?? 0;
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level)!.push(id);
  }

  for (const [level, ids] of groups) {
    ids.forEach((id, idx) => {
      const node = nodeMap.get(id)!;
      node.x = level * 220;
      node.y = idx * 80;
    });
  }
}

function parseMermaid(text: string): ImportedGraph {
  const nodes: ImportedNode[] = [];
  const edges: ImportedEdge[] = [];
  const nodeMap = new Map<string, ImportedNode>();

  const ensureNode = (id: string, label = id) => {
    if (!nodeMap.has(id)) {
      const node: ImportedNode = { id, name: label, x: 0, y: 0 };
      nodeMap.set(id, node);
      nodes.push(node);
    }
  };

  // Extract node definitions with labels, e.g. A[text], A(text), A{text}, A[/text/]
  const nodeDefRegex = /(\b\w+\b)\s*(?:\[\s*"([^"]+)"\s*\]|\[\s*([^\[\]]+?)\s*\]|\(\s*([^()]+?)\s*\)|\{\s*([^}]+?)\s*\}|\[\/\s*([^\]\/]+?)\s*\/\])/g;
  let m;
  while ((m = nodeDefRegex.exec(text)) !== null) {
    const id = m[1];
    const label = m[2] || m[3] || m[4] || m[5] || m[6] || id;
    ensureNode(id, label.trim());
  }

  // Extract edge definitions
  const edgeRegex = /(\b\w+\b)\s*(-->|---|==>|-.->)\s*(?:\|([^|]*)\|\s*)?(\b\w+\b)/g;
  while ((m = edgeRegex.exec(text)) !== null) {
    const source = m[1];
    const target = m[4];
    const label = m[3]?.trim();
    ensureNode(source);
    ensureNode(target);
    edges.push({ source, target, label });
  }

  layoutByLevels(nodes, edges);
  return { name: 'Mermaid 流程图', nodes, edges };
}

interface OutlineItem {
  id: string;
  name: string;
  level: number;
}

function parseOutline(text: string): ImportedGraph[] {
  const lines = text.split('\n');
  const items: OutlineItem[] = [];
  let counter = 0;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      counter++;
      items.push({ id: `item-${counter}`, name: headingMatch[2].trim(), level: headingMatch[1].length });
      continue;
    }

    const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (listMatch) {
      counter++;
      const indent = listMatch[1].length;
      const level = Math.floor(indent / 2) + 7; // list levels start below max heading level
      items.push({ id: `item-${counter}`, name: listMatch[2].trim(), level });
    }
  }

  if (items.length === 0) return [];

  // Split into layers by top-level headings (level 1)
  const layers: ImportedGraph[] = [];
  let currentLayerItems: OutlineItem[] = [];
  let currentLayerName = '大纲';

  const flushLayer = () => {
    if (currentLayerItems.length === 0) return;
    const nodes: ImportedNode[] = [];
    const edges: ImportedEdge[] = [];
    const stack: string[] = [];
    for (const item of currentLayerItems) {
      nodes.push({ id: item.id, name: item.name, x: 0, y: 0 });
      while (stack.length > 0) {
        const lastId = stack[stack.length - 1];
        const lastLevel = currentLayerItems.find((i) => i.id === lastId)!.level;
        if (lastLevel < item.level) break;
        stack.pop();
      }
      if (stack.length > 0) {
        edges.push({ source: stack[stack.length - 1], target: item.id });
      }
      stack.push(item.id);
    }
    layoutByLevels(nodes, edges);
    layers.push({ name: currentLayerName, nodes, edges });
    currentLayerItems = [];
  };

  for (const item of items) {
    if (item.level === 1) {
      flushLayer();
      currentLayerName = item.name || '未命名图层';
    }
    currentLayerItems.push(item);
  }
  flushLayer();

  return layers;
}

export function parseMarkdown(text: string): ImportedGraph[] {
  if (/\bgraph\s+(TD|TB|LR|RL|BT)\b/.test(text)) {
    return [parseMermaid(text)];
  }
  return parseOutline(text);
}
