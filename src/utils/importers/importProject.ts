import { generateId } from '../../model/schema';
import type { EdgeData, LayerData, NodeData, ProjectData } from '../../model/types';
import type { ImportedGraph } from './types';
import { parseDrawioXml } from './drawioImporter';
import { parseXmindFile } from './xmindImporter';
import { parseMarkdown } from './markdownImporter';
import { parseProcessOnFile } from './processOnImporter';
import { validateProject } from '../../model/schema';

const LAYER_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#f3e8ff', '#ffe4e6', '#ccfbf1', '#f1f5f9'];

function convertGraphs(graphs: ImportedGraph[], projectName = '导入项目'): ProjectData {
  const layers: LayerData[] = [];

  for (let i = 0; i < graphs.length; i++) {
    const graph = graphs[i];
    const idMap = new Map<string, string>();
    const nodeData: NodeData[] = [];

    // Compute bounding box to use as layer origin
    let minX = Infinity;
    let minY = Infinity;
    for (const n of graph.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
    }
    if (!isFinite(minX)) minX = 0;
    if (!isFinite(minY)) minY = 0;

    for (const n of graph.nodes) {
      const newId = generateId('node');
      idMap.set(n.id, newId);
      nodeData.push({
        id: newId,
        name: n.name || n.id,
        type: 'indicator',
        x: n.x - minX,
        y: n.y - minY,
      });
    }

    const edgeData: EdgeData[] = [];
    for (const e of graph.edges) {
      const source = idMap.get(e.source);
      const target = idMap.get(e.target);
      if (!source || !target) continue;
      edgeData.push({
        id: generateId('edge'),
        source,
        target,
        direction: 'forward',
        type: 'imported',
        brief: e.label || '',
        detail: '',
        table: '',
      });
    }

    layers.push({
      id: generateId('layer'),
      name: graph.name || `图层 ${i + 1}`,
      description: '',
      color: LAYER_COLORS[i % LAYER_COLORS.length],
      x: 50 + (i % 3) * 400,
      y: 50 + Math.floor(i / 3) * 300,
      nodes: nodeData,
      edges: edgeData,
    });
  }

  return {
    project: projectName,
    version: '1.0',
    layers,
    crossEdges: [],
  };
}

export async function importProjectFromFile(file: File): Promise<ProjectData> {
  const name = file.name.toLowerCase();
  let graphs: ImportedGraph[];

  if (name.endsWith('.drawio') || name.endsWith('.xml')) {
    const text = await file.text();
    graphs = parseDrawioXml(text);
  } else if (name.endsWith('.xmind')) {
    graphs = await parseXmindFile(file);
  } else if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.mmd')) {
    const text = await file.text();
    graphs = parseMarkdown(text);
  } else if (name.endsWith('.pos') || name.endsWith('.posm')) {
    const text = await file.text();
    graphs = parseProcessOnFile(text);
  } else if (name.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    graphs = [
      {
        name: 'JSON 导入',
        nodes: (data.nodes || []).map((n: any) => ({
          id: String(n.id ?? Math.random().toString(36).slice(2)),
          name: n.name ?? n.label ?? n.id ?? '',
          x: n.x ?? 0,
          y: n.y ?? 0,
        })),
        edges: (data.edges || []).map((e: any) => ({
          source: String(e.source ?? e.from ?? ''),
          target: String(e.target ?? e.to ?? ''),
          label: e.label ?? e.text ?? '',
        })),
      },
    ];
  } else {
    throw new Error('不支持的文件格式');
  }

  if (graphs.length === 0) throw new Error('文件中没有可导入的图层');

  const project = convertGraphs(graphs, file.name.replace(/\.[^.]+$/, ''));
  return validateProject(project);
}
