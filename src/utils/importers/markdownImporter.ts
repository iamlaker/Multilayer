import type {
  ImportedGraph,
  ImportedNode,
  ImportedEdge,
  ImportedCrossEdge,
  ImportResult,
} from './types';

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

function parseMarkdownTable(
  lines: string[],
  startIndex: number
): { rows: string[][]; nextIndex: number } {
  const rows: string[][] = [];
  let i = startIndex;
  while (i < lines.length && !lines[i].trim()) i++;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    if (!line.startsWith('|')) break;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c !== '');
    if (cells.length > 0 && !cells.every((c) => /^[-:]+$/.test(c))) {
      rows.push(cells);
    }
    i++;
  }
  return { rows, nextIndex: i };
}

// ------------------------------------------------------------------
// Mermaid flowchart
// ------------------------------------------------------------------
function parseMermaid(text: string): ImportResult {
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

  const nodeDefRegex =
    /(\b\w+\b)\s*(?:\[\s*"([^"]+)"\s*\]|\[\s*([^\[\]]+?)\s*\]|\(\s*([^()]+?)\s*\)|\{\s*([^}]+?)\s*\}|\[\/\s*([^\]\/]+?)\s*\/\])/g;
  let m;
  while ((m = nodeDefRegex.exec(text)) !== null) {
    const id = m[1];
    const label = m[2] || m[3] || m[4] || m[5] || m[6] || id;
    ensureNode(id, label.trim());
  }

  const edgeRegex =
    /(\b\w+\b)\s*(-->|---|==>|-.->)\s*(?:\|([^|]*)\|\s*)?(\b\w+\b)/g;
  while ((m = edgeRegex.exec(text)) !== null) {
    const source = m[1];
    const target = m[4];
    const label = m[3]?.trim();
    ensureNode(source);
    ensureNode(target);
    edges.push({ source, target, label });
  }

  layoutByLevels(nodes, edges);
  return { graphs: [{ name: 'Mermaid 流程图', nodes, edges }], crossEdges: [] };
}

// ------------------------------------------------------------------
// Structured AI Markdown
// ------------------------------------------------------------------
interface StructuredNode {
  id: string;
  name: string;
  level: number;
  meta: {
    brief?: string;
    detail?: string;
    table?: string;
    type?: string;
  };
}

function parseStructuredMarkdown(text: string): ImportResult | null {
  const lines = text.split('\n');
  const graphs: ImportedGraph[] = [];
  const crossEdges: ImportedCrossEdge[] = [];

  let currentLayer: { name: string; nodes: StructuredNode[] } | null = null;
  let currentNode: StructuredNode | null = null;
  let tableBuffer: string[] = [];
  let tableOwner: StructuredNode | null = null;

  const flushTable = () => {
    if (tableOwner && tableBuffer.length) {
      tableOwner.meta.table = tableBuffer.join('\n');
    }
    tableBuffer = [];
    tableOwner = null;
  };

  const saveLayer = () => {
    flushTable();
    if (!currentLayer || currentLayer.nodes.length === 0) return;

    const nodes: ImportedNode[] = [];
    const edges: ImportedEdge[] = [];
    const stack: StructuredNode[] = [];

    for (const n of currentLayer.nodes) {
      while (stack.length && stack[stack.length - 1].level >= n.level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1] || null;
      nodes.push({ id: n.id, name: n.name, x: 0, y: 0 });
      if (parent) {
        edges.push({
          source: parent.id,
          target: n.id,
          label: n.meta.brief || '',
          detail: n.meta.detail || '',
          table: n.meta.table || '',
        });
      }
      stack.push(n);
    }

    layoutByLevels(nodes, edges);
    graphs.push({ name: currentLayer.name, nodes, edges });
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      if (!tableOwner) {
        continue;
      }
      // keep table buffer alive across blank lines
      continue;
    }

    // Cross-layer relation table
    if (/^#{1,6}\s+跨层关系\s*$/.test(trimmed)) {
      flushTable();
      currentNode = null;
      const { rows, nextIndex } = parseMarkdownTable(lines, i + 1);
      i = nextIndex - 1;
      for (const row of rows) {
        if (row.length >= 4) {
          crossEdges.push({
            sourceLayer: row[0] || '',
            sourceNode: row[1] || '',
            targetLayer: row[2] || '',
            targetNode: row[3] || '',
            direction: (row[4] || 'forward').trim(),
            type: (row[5] || 'default').trim(),
            brief: row[6] || '',
            detail: row[7] || '',
            table: row[8] || '',
          });
        }
      }
      continue;
    }

    // Layer heading
    const layerMatch = trimmed.match(/^#{1,6}\s+图层[：:]\s*(.+)$/);
    if (layerMatch) {
      flushTable();
      saveLayer();
      currentLayer = { name: layerMatch[1].trim(), nodes: [] };
      currentNode = null;
      continue;
    }

    if (!currentLayer) return null;

    // Node heading
    const nodeMatch =
      trimmed.match(/^#{2,6}\s+节点[：:]\s*(.+)$/) ||
      trimmed.match(/^#{2,6}\s+(.+)$/);
    if (nodeMatch) {
      flushTable();
      const level = (trimmed.match(/^#+/) || [''])[0].length;
      const name = nodeMatch[1].trim();
      const node: StructuredNode = {
        id: `md-node-${currentLayer.nodes.length}`,
        name,
        level,
        meta: {},
      };
      currentLayer.nodes.push(node);
      currentNode = node;
      continue;
    }

    if (!currentNode) continue;

    // Metadata bullets
    const metaMatch = trimmed.match(
      /^[-*+]\s*(简要表述|复杂表述|节点类型|节点备注)[：:]\s*(.*)$/
    );
    if (metaMatch) {
      flushTable();
      const key = metaMatch[1];
      const value = metaMatch[2].trim();
      if (key === '简要表述') currentNode.meta.brief = value;
      if (key === '复杂表述') currentNode.meta.detail = value;
      if (key === '节点类型') currentNode.meta.type = value;
      continue;
    }

    // Association table
    const tableMatch = trimmed.match(/^[-*+]\s*关联表格[：:]\s*(.*)$/);
    if (tableMatch) {
      flushTable();
      tableOwner = currentNode;
      tableBuffer = [];
      const first = tableMatch[1].trim();
      if (first) tableBuffer.push(first);
      continue;
    }

    if (tableOwner && trimmed.startsWith('|')) {
      tableBuffer.push(trimmed);
      continue;
    }

    flushTable();
  }


  flushTable();
  saveLayer();

  if (graphs.length === 0 && crossEdges.length === 0) return null;
  return { graphs, crossEdges };
}

// ------------------------------------------------------------------
// Outline Markdown
// ------------------------------------------------------------------
interface OutlineItem {
  id: string;
  name: string;
  level: number;
}

function parseOutline(text: string): ImportResult {
  const lines = text.split('\n');
  const items: OutlineItem[] = [];
  let counter = 0;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      counter++;
      items.push({
        id: `item-${counter}`,
        name: headingMatch[2].trim(),
        level: headingMatch[1].length,
      });
      continue;
    }

    const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (listMatch) {
      counter++;
      const indent = listMatch[1].length;
      const level = Math.floor(indent / 2) + 7;
      items.push({ id: `item-${counter}`, name: listMatch[2].trim(), level });
    }
  }

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

  return { graphs: layers, crossEdges: [] };
}

// ------------------------------------------------------------------
// Public entry
// ------------------------------------------------------------------
export function parseMarkdown(text: string): ImportResult {
  const structured = parseStructuredMarkdown(text);
  if (structured) return structured;

  if (/\bgraph\s+(TD|TB|LR|RL|BT)\b/.test(text)) {
    return parseMermaid(text);
  }

  return parseOutline(text);
}
