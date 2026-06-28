import JSZip from 'jszip';
import type { ImportedGraph, ImportedNode, ImportedEdge } from './types';

interface XmindTopic {
  id: string;
  title: string;
  children?: { attached?: XmindTopic[] };
}

interface XmindSheet {
  id?: string;
  title?: string;
  rootTopic: XmindTopic;
}

function computeTreeSize(topic: XmindTopic): number {
  const children = topic.children?.attached || [];
  if (children.length === 0) return 60;
  let h = 0;
  for (const child of children) {
    h += computeTreeSize(child) + 60;
  }
  return h - 60;
}

function placeTree(
  topic: XmindTopic,
  nodes: ImportedNode[],
  edges: ImportedEdge[],
  parentId: string | null,
  depth: number,
  startY: number
): void {
  const children = topic.children?.attached || [];
  const totalHeight = computeTreeSize(topic);
  const y = startY + totalHeight / 2;
  const id = topic.id || `topic-${nodes.length}`;
  nodes.push({ id, name: topic.title || '', x: depth * 220, y });
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

function parseJsonContent(content: string): ImportedGraph[] {
  const sheets: XmindSheet[] = JSON.parse(content);
  const result: ImportedGraph[] = [];
  for (const sheet of sheets) {
    const nodes: ImportedNode[] = [];
    const edges: ImportedEdge[] = [];
    placeTree(sheet.rootTopic, nodes, edges, null, 0, 0);
    result.push({ name: sheet.title || '思维导图', nodes, edges });
  }
  return result;
}

function parseXmlContent(xmlText: string): ImportedGraph[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const sheets = Array.from(doc.querySelectorAll('sheet'));
  const result: ImportedGraph[] = [];

  const parseTopic = (topicEl: Element): XmindTopic => {
    const id = topicEl.getAttribute('id') || `topic-${Math.random().toString(36).slice(2)}`;
    const titleEl = topicEl.querySelector('title');
    const title = titleEl?.textContent || '';
    const children: XmindTopic[] = [];
    const childrenEl = topicEl.querySelector('children');
    if (childrenEl) {
      const topicsEl = childrenEl.querySelector('topics[type="attached"]') || childrenEl.querySelector('topics');
      if (topicsEl) {
        for (const child of Array.from(topicsEl.querySelectorAll('topic'))) {
          children.push(parseTopic(child));
        }
      }
    }
    return { id, title, children: children.length ? { attached: children } : undefined };
  };

  for (const sheet of sheets) {
    const title = sheet.getAttribute('name') || sheet.querySelector('title')?.textContent || '思维导图';
    const rootTopicEl = sheet.querySelector('topic');
    if (!rootTopicEl) continue;
    const rootTopic = parseTopic(rootTopicEl);
    const nodes: ImportedNode[] = [];
    const edges: ImportedEdge[] = [];
    placeTree(rootTopic, nodes, edges, null, 0, 0);
    result.push({ name: title, nodes, edges });
  }

  return result;
}

export async function parseXmindFile(file: File): Promise<ImportedGraph[]> {
  const zip = await JSZip.loadAsync(file);
  const jsonFile = zip.files['content.json'];
  const xmlFile = zip.files['content.xml'];

  if (jsonFile) {
    const content = await jsonFile.async('string');
    return parseJsonContent(content);
  }
  if (xmlFile) {
    const content = await xmlFile.async('string');
    return parseXmlContent(content);
  }
  throw new Error('XMind 文件中未找到 content.json 或 content.xml');
}
