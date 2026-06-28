import { inflate, inflateRaw } from 'pako';
import type { ImportedGraph, ImportedNode, ImportedEdge, ImportResult } from './types';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function decompressDiagram(text: string): string {
  if (text.trim().startsWith('<')) return text;
  try {
    const decoded = atob(text);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
    // draw.io uses raw deflate for compressed diagrams
    const inflated = inflateRaw(bytes, { toText: true });
    return inflated;
  } catch {
    try {
      const decoded = atob(text);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
      return inflate(bytes, { toText: true });
    } catch {
      throw new Error('无法解压 draw.io 图层内容');
    }
  }
}

export function parseDrawioXml(xmlText: string): ImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) throw new Error('XML 解析失败');

  const mxfile = doc.querySelector('mxfile');
  if (!mxfile) throw new Error('未找到 mxfile 根节点');

  const diagrams = Array.from(mxfile.querySelectorAll('diagram'));
  if (diagrams.length === 0) throw new Error('未找到 diagram 节点');

  const result: ImportedGraph[] = [];

  for (const diagram of diagrams) {
    const layerName = diagram.getAttribute('name') || '未命名图层';
    const rawContent = diagram.textContent || '';
    const modelXml = decompressDiagram(rawContent);
    const modelDoc = parser.parseFromString(modelXml, 'application/xml');
    const cells = Array.from(modelDoc.querySelectorAll('mxCell'));

    const cellMap = new Map<string, Element>();
    const layerIds = new Set<string>();
    for (const cell of cells) {
      const id = cell.getAttribute('id');
      if (!id) continue;
      cellMap.set(id, cell);
      const parent = cell.getAttribute('parent');
      if (parent === '0' && id !== '0') {
        layerIds.add(id);
      }
    }

    // Group nodes by their layer parent
    const layerNodes = new Map<string, ImportedNode[]>();
    const allNodes = new Map<string, ImportedNode>();
    for (const cell of cells) {
      if (cell.getAttribute('vertex') !== '1') continue;
      const id = cell.getAttribute('id');
      const parent = cell.getAttribute('parent');
      const value = cell.getAttribute('value') || '';
      const name = stripHtml(value).trim() || id || '节点';
      const geometry = cell.querySelector('mxGeometry');
      if (!id || !geometry) continue;
      const x = parseFloat(geometry.getAttribute('x') || '0');
      const y = parseFloat(geometry.getAttribute('y') || '0');

      const node: ImportedNode = { id, name, x, y };
      allNodes.set(id, node);

      const layerId = parent && layerIds.has(parent) ? parent : 'default';
      if (!layerNodes.has(layerId)) layerNodes.set(layerId, []);
      layerNodes.get(layerId)!.push(node);
    }

    // Group edges by their layer parent
    const layerEdges = new Map<string, ImportedEdge[]>();
    for (const cell of cells) {
      if (cell.getAttribute('edge') !== '1') continue;
      const source = cell.getAttribute('source');
      const target = cell.getAttribute('target');
      const parent = cell.getAttribute('parent');
      if (!source || !target) continue;
      const value = cell.getAttribute('value') || '';
      const label = stripHtml(value).trim();
      const edge: ImportedEdge = { source, target, label };
      const layerId = parent && layerIds.has(parent) ? parent : 'default';
      if (!layerEdges.has(layerId)) layerEdges.set(layerId, []);
      layerEdges.get(layerId)!.push(edge);
    }

    // If only default layer and others, merge everything into one graph named after the diagram
    const layerIdList = layerNodes.size > 0 ? Array.from(layerNodes.keys()) : ['default'];
    for (const layerId of layerIdList) {
      const nodes = layerNodes.get(layerId) || [];
      const edges = layerEdges.get(layerId) || [];
      if (nodes.length === 0) continue;
      result.push({
        name: layerId === 'default' ? layerName : `${layerName}-${layerId}`,
        nodes,
        edges,
      });
    }
  }

  return { graphs: result, crossEdges: [] };
}
