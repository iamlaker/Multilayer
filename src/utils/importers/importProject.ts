import { generateId } from '../../model/schema';
import type { EdgeData, LayerData, NodeData, ProjectData } from '../../model/types';
import type { ImportedGraph, ImportResult } from './types';
import { parseDrawioXml } from './drawioImporter';
import { parseXmindFile } from './xmindImporter';
import { parseMarkdown } from './markdownImporter';
import { parseProcessOnFile } from './processOnImporter';
import { validateProject } from '../../model/schema';

const LAYER_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#f3e8ff', '#ffe4e6', '#ccfbf1', '#f1f5f9'];

function mergeImportedResult(result: ImportResult, projectName = '导入项目'): ProjectData {
  const layers: LayerData[] = [];
  const layerNameToIndex = new Map<string, number>();

  for (let i = 0; i < result.graphs.length; i++) {
    const graph = result.graphs[i];
    const idMap = new Map<string, string>();
    const nodeData: NodeData[] = [];

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
        detail: e.detail || '',
        table: e.table || '',
      });
    }

    const layerName = graph.name || `图层 ${i + 1}`;
    const layerId = generateId('layer');
    layerNameToIndex.set(layerName, layers.length);
    layers.push({
      id: layerId,
      name: layerName,
      description: '',
      color: LAYER_COLORS[i % LAYER_COLORS.length],
      x: 50 + (i % 3) * 400,
      y: 50 + Math.floor(i / 3) * 300,
      nodes: nodeData,
      edges: edgeData,
    });
  }

  const crossEdges: EdgeData[] = [];
  const validDirections = new Set(['forward', 'bidirectional', 'back']);
  const validTypes = new Set(['default', 'influence', 'feedback']);

  const findLayer = (name: string): LayerData | undefined => {
    const idx = layerNameToIndex.get(name);
    return idx !== undefined ? layers[idx] : undefined;
  };

  const findNode = (layer: LayerData, name: string): NodeData | undefined => {
    return layer.nodes.find((n) => n.name === name);
  };

  for (const ce of result.crossEdges || []) {
    const sourceLayer = findLayer(ce.sourceLayer);
    const targetLayer = findLayer(ce.targetLayer);
    if (!sourceLayer || !targetLayer) continue;

    let sourceNode = findNode(sourceLayer, ce.sourceNode);
    if (!sourceNode) {
      sourceNode = {
        id: generateId('node'),
        name: ce.sourceNode,
        type: 'indicator',
        x: 0,
        y: 0,
      };
      sourceLayer.nodes.push(sourceNode);
    }

    let targetNode = findNode(targetLayer, ce.targetNode);
    if (!targetNode) {
      targetNode = {
        id: generateId('node'),
        name: ce.targetNode,
        type: 'indicator',
        x: 100,
        y: 0,
      };
      targetLayer.nodes.push(targetNode);
    }

    const direction = validDirections.has(ce.direction) ? (ce.direction as EdgeData['direction']) : 'forward';
    const type = validTypes.has(ce.type) ? (ce.type as EdgeData['type']) : 'default';

    crossEdges.push({
      id: generateId('crossEdge'),
      source: sourceNode.id,
      target: targetNode.id,
      direction,
      type,
      brief: ce.brief || '',
      detail: ce.detail || '',
      table: ce.table || '',
    });
  }

  return {
    project: projectName,
    version: '1.0',
    layers,
    crossEdges,
  };
}

async function parseFileToImportResult(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.drawio') || name.endsWith('.xml')) {
    const text = await file.text();
    return parseDrawioXml(text);
  } else if (name.endsWith('.xmind')) {
    return await parseXmindFile(file);
  } else if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.mmd')) {
    const text = await file.text();
    return parseMarkdown(text);
  } else if (name.endsWith('.pos') || name.endsWith('.posm')) {
    const text = await file.text();
    return parseProcessOnFile(text);
  } else if (name.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    const graph: ImportedGraph = {
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
    };
    return { graphs: [graph], crossEdges: [] };
  } else {
    throw new Error('不支持的文件格式');
  }
}

export async function importProjectFromFile(file: File): Promise<ProjectData> {
  const result = await parseFileToImportResult(file);
  if (result.graphs.length === 0 && result.crossEdges.length === 0) {
    throw new Error('文件中没有可导入的图层');
  }
  const project = mergeImportedResult(result, file.name.replace(/\.[^.]+$/, ''));
  return validateProject(project);
}

export async function importLayersFromFile(file: File, baseProject: ProjectData): Promise<ProjectData> {
  const result = await parseFileToImportResult(file);
  if (result.graphs.length === 0 && result.crossEdges.length === 0) {
    throw new Error('文件中没有可导入的图层');
  }

  const imported = mergeImportedResult(result, file.name.replace(/\.[^.]+$/, ''));

  // Compute a horizontal offset so new layers do not overlap existing ones
  let maxX = 0;
  for (const layer of baseProject.layers) {
    const layerRight = (layer.x ?? 0) + Math.max(0, ...layer.nodes.map((n) => n.x)) + 200;
    if (layerRight > maxX) maxX = layerRight;
  }
  const offsetX = maxX > 0 ? maxX + 80 : 0;

  const shiftedLayers = imported.layers.map((layer) => ({
    ...layer,
    x: (layer.x ?? 0) + offsetX,
  }));

  const nextProject: ProjectData = {
    ...baseProject,
    layers: [...baseProject.layers, ...shiftedLayers],
    crossEdges: [...baseProject.crossEdges, ...imported.crossEdges],
  };

  return validateProject(nextProject);
}
