import { create } from 'zustand';
import cytoscape from 'cytoscape';
import type { EdgeData, LayerData, NodeData, ProjectData, DetailPopupState } from '../model/types';
import { generateId } from '../model/schema';
import {
  LAYER_COLORS,
  LAYER_BORDER_COLORS,
  NODE_BACKGROUND_PALETTE,
  NODE_BORDER_PALETTE,
  pickByIndex,
} from '../utils/styleDefaults';

const DEFAULT_PROJECT: ProjectData = {
  project: '未命名项目',
  version: '1.0',
  layers: [
    {
      id: 'layer-1',
      name: '战略目标层',
      description: '公司级战略目标',
      color: LAYER_COLORS[0],
      x: 50,
      y: 50,
      nodes: [
        { id: 'node-1-1', name: '提高客户满意度', type: 'indicator', x: 100, y: 80 },
        { id: 'node-1-2', name: '降低投诉率', type: 'indicator', x: 100, y: 220 },
      ],
      edges: [
        { id: 'edge-1-1', source: 'node-1-1', target: 'node-1-2', direction: 'forward', type: 'drives', brief: '满意度提升 → 投诉减少', detail: '满意度每提高 1 分，投诉率下降 0.8%。', table: '| 满意度提升 | 投诉率变化 |\n|---|---|\n| +1 | -0.8% |' },
      ],
    },
    {
      id: 'layer-2',
      name: '运营流程层',
      description: '核心运营流程',
      color: LAYER_COLORS[1],
      x: 500,
      y: 50,
      nodes: [
        { id: 'node-2-1', name: '订单处理速度', type: 'indicator', x: 100, y: 80 },
        { id: 'node-2-2', name: '物流配送时效', type: 'indicator', x: 100, y: 220 },
        { id: 'node-2-3', name: '售后服务响应', type: 'indicator', x: 350, y: 150 },
      ],
      edges: [
        { id: 'edge-2-1', source: 'node-2-1', target: 'node-2-3', direction: 'forward', type: 'drives', brief: '订单快 → 售后响应快', detail: '订单处理自动化后，售后工单可提前分流。', table: '' },
        { id: 'edge-2-2', source: 'node-2-2', target: 'node-2-3', direction: 'forward', type: 'drives', brief: '物流快 → 售后压力小', detail: '物流时效提升减少因延迟产生的售后诉求。', table: '' },
      ],
    },
  ],
  crossEdges: [
    { id: 'cross-1', source: 'node-1-1', target: 'node-2-3', direction: 'forward', type: 'influences', brief: '满意度驱动售后响应', detail: '客户满意度越高，对售后响应速度的容忍度越低，倒逼响应速度提升。', table: '| 满意度 | 期望响应时间 |\n|---|---|\n| 高 | < 2h |\n| 中 | < 6h |\n| 低 | < 24h |' },
    { id: 'cross-2', source: 'node-2-3', target: 'node-1-2', direction: 'forward', type: 'influences', brief: '售后响应快 → 投诉率低', detail: '售后响应时间每缩短 50%，投诉率下降约 30%。', table: '' },
  ],
};

interface GraphState {
  project: ProjectData;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLayerId: string | null;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  hiddenLayerIds: Set<string>;
  detailPopup: DetailPopupState | null;
  editingNodeId: string | null;
  editingEdgeId: string | null;
  editingLayerId: string | null;
  batchEditingOpen: boolean;
  isEditMode: boolean;
  viewMode: 'layered' | 'overview';
  selectedShape: string;
  searchQuery: string;
  history: ProjectData[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

interface GraphActions {
  loadProject: (project: ProjectData) => void;
  mergeProject: (project: ProjectData) => void;
  addLayer: () => void;
  updateLayer: (id: string, patch: Partial<LayerData>) => void;
  deleteLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  addNode: (layerId: string, x: number, y: number, shape?: string, width?: number, height?: number) => string;
  updateNode: (id: string, patch: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Omit<EdgeData, 'id'>) => string;
  updateEdge: (id: string, patch: Partial<EdgeData>) => void;
  deleteEdge: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  moveLayer: (id: string, x: number, y: number) => void;
  autoLayoutLayer: (layerId: string, algorithm?: 'cose' | 'grid' | 'breadthfirst' | 'circle') => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setSelectedLayer: (id: string | null) => void;
  toggleSelectedNode: (id: string) => void;
  toggleSelectedEdge: (id: string) => void;
  clearMultiSelection: () => void;
  batchUpdateNodes: (patch: Partial<NodeData>) => void;
  setDetailPopup: (popup: DetailPopupState | null) => void;
  closeDetailPopup: () => void;
  setEditingNode: (id: string | null) => void;
  setEditingEdge: (id: string | null) => void;
  setEditingLayer: (id: string | null) => void;
  setBatchEditingOpen: (open: boolean) => void;
  toggleEditMode: () => void;
  setEditMode: (value: boolean) => void;
  toggleViewMode: () => void;
  setViewMode: (mode: 'layered' | 'overview') => void;
  setSelectedShape: (shape: string) => void;
  setSearchQuery: (query: string) => void;
  undo: () => void;
  redo: () => void;
}

function findLayerByNodeId(layers: LayerData[], nodeId: string): LayerData | undefined {
  return layers.find((l) => l.nodes.some((n) => n.id === nodeId));
}

function findLayerById(layers: LayerData[], id: string): LayerData | undefined {
  return layers.find((l) => l.id === id);
}

function recordHistory(
  state: Pick<GraphState, 'project' | 'history' | 'historyIndex'>
): Pick<GraphState, 'history' | 'historyIndex' | 'canUndo' | 'canRedo'> {
  const nextHistory = state.history.slice(0, state.historyIndex + 1);
  const last = nextHistory[state.historyIndex];
  if (last && JSON.stringify(last) === JSON.stringify(state.project)) {
    return {
      history: state.history,
      historyIndex: state.historyIndex,
      canUndo: state.historyIndex > 0,
      canRedo: state.historyIndex < state.history.length - 1,
    };
  }
  nextHistory.push(state.project);
  const nextIndex = nextHistory.length - 1;
  return {
    history: nextHistory,
    historyIndex: nextIndex,
    canUndo: nextIndex > 0,
    canRedo: false,
  };
}

export const useGraphStore = create<GraphState & GraphActions>((set) => ({
  project: DEFAULT_PROJECT,
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedLayerId: null,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  hiddenLayerIds: new Set(),
  detailPopup: null,
  editingNodeId: null,
  editingEdgeId: null,
  editingLayerId: null,
  batchEditingOpen: false,
  isEditMode: true,
  viewMode: 'layered',
  selectedShape: 'roundrectangle',
  searchQuery: '',
  history: [DEFAULT_PROJECT],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,

  loadProject: (project) =>
    set({
      project,
      history: [project],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedLayerId: null,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      detailPopup: null,
      searchQuery: '',
      batchEditingOpen: false,
    }),

  mergeProject: (project) =>
    set((state) => ({
      project,
      ...recordHistory({ ...state, project }),
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedLayerId: null,
      detailPopup: null,
      searchQuery: '',
    })),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const nextIndex = state.historyIndex - 1;
      return {
        project: state.history[nextIndex],
        historyIndex: nextIndex,
        canUndo: nextIndex > 0,
        canRedo: true,
        selectedNodeId: null,
        selectedEdgeId: null,
      selectedLayerId: null,
        detailPopup: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      return {
        project: state.history[nextIndex],
        historyIndex: nextIndex,
        canUndo: true,
        canRedo: nextIndex < state.history.length - 1,
        selectedNodeId: null,
        selectedEdgeId: null,
      selectedLayerId: null,
        detailPopup: null,
      };
    }),

  addLayer: () =>
    set((state) => {
      const index = state.project.layers.length;
      const newLayer: LayerData = {
        id: generateId('layer'),
        name: `新建图层 ${index + 1}`,
        description: '',
        color: LAYER_COLORS[index % LAYER_COLORS.length],
        borderColor: LAYER_BORDER_COLORS[index % LAYER_BORDER_COLORS.length],
        x: 50 + index * 50,
        y: 50 + index * 50,
        nodes: [],
        edges: [],
      };
      const nextProject = { ...state.project, layers: [...state.project.layers, newLayer] };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),

  updateLayer: (id, patch) =>
    set((state) => {
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),

  deleteLayer: (id) =>
    set((state) => {
      const nextProject = {
        ...state.project,
        layers: state.project.layers.filter((l) => l.id !== id),
        crossEdges: state.project.crossEdges.filter((e) => {
          const layerNodes = new Set(
            state.project.layers.find((l) => l.id === id)?.nodes.map((n) => n.id) ?? []
          );
          return !layerNodes.has(e.source) && !layerNodes.has(e.target);
        }),
      };
      return {
        project: nextProject,
        ...recordHistory({ ...state, project: nextProject }),
        hiddenLayerIds: new Set([...state.hiddenLayerIds].filter((hid) => hid !== id)),
      };
    }),

  toggleLayerVisibility: (id) =>
    set((state) => {
      const next = new Set(state.hiddenLayerIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { hiddenLayerIds: next };
    }),

  addNode: (layerId, x, y, shape, width, height) => {
    let newId = '';
    set((state) => {
      const layer = findLayerById(state.project.layers, layerId);
      if (!layer) return state;
      const layerX = layer.x ?? 0;
      const layerY = layer.y ?? 0;
      const colorIndex = layer.nodes.length;
      newId = generateId('node');
      const newNode: NodeData = {
        id: newId,
        name: '新指标',
        type: 'indicator',
        x: x - layerX,
        y: y - layerY,
        shape,
        width: width && width > 0 ? width : undefined,
        height: height && height > 0 ? height : undefined,
        backgroundColor: pickByIndex(NODE_BACKGROUND_PALETTE, colorIndex),
        borderColor: pickByIndex(NODE_BORDER_PALETTE, colorIndex),
      };
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) =>
          l.id === layerId ? { ...l, nodes: [...l.nodes, newNode] } : l
        ),
      };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    });
    return newId;
  },

  updateNode: (id, patch) =>
    set((state) => {
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          nodes: l.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),

  deleteNode: (id) =>
    set((state) => {
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          nodes: l.nodes.filter((n) => n.id !== id),
          edges: l.edges.filter((e) => e.source !== id && e.target !== id),
        })),
        crossEdges: state.project.crossEdges.filter((e) => e.source !== id && e.target !== id),
      };
      return {
        project: nextProject,
        ...recordHistory({ ...state, project: nextProject }),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        selectedEdgeId: null,
      selectedLayerId: null,
        detailPopup: null,
      };
    }),

  addEdge: (edge) => {
    let newId = '';
    set((state) => {
      const sourceLayer = findLayerByNodeId(state.project.layers, edge.source);
      const targetLayer = findLayerByNodeId(state.project.layers, edge.target);
      newId = generateId('edge');
      const newEdge: EdgeData = { ...edge, id: newId };
      let nextProject: ProjectData;
      if (sourceLayer && targetLayer && sourceLayer.id === targetLayer.id) {
        nextProject = {
          ...state.project,
          layers: state.project.layers.map((l) =>
            l.id === sourceLayer.id ? { ...l, edges: [...l.edges, newEdge] } : l
          ),
        };
      } else {
        nextProject = {
          ...state.project,
          crossEdges: [...state.project.crossEdges, newEdge],
        };
      }
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    });
    return newId;
  },

  updateEdge: (id, patch) =>
    set((state) => {
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          edges: l.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
        crossEdges: state.project.crossEdges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),

  deleteEdge: (id) =>
    set((state) => {
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          edges: l.edges.filter((e) => e.id !== id),
        })),
        crossEdges: state.project.crossEdges.filter((e) => e.id !== id),
      };
      return {
        project: nextProject,
        ...recordHistory({ ...state, project: nextProject }),
        selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        detailPopup: state.detailPopup?.edgeId === id ? null : state.detailPopup,
      };
    }),

  moveNode: (id, x, y) =>
    set((state) => {
      const layer = findLayerByNodeId(state.project.layers, id);
      if (!layer) return state;
      const layerX = layer.x ?? 0;
      const layerY = layer.y ?? 0;
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) =>
          l.id === layer.id
            ? {
                ...l,
                nodes: l.nodes.map((n) =>
                  n.id === id ? { ...n, x: x - layerX, y: y - layerY } : n
                ),
              }
            : l
        ),
      };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),

  moveLayer: (id, x, y) =>
    set((state) => {
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) => (l.id === id ? { ...l, x, y } : l)),
      };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),

  autoLayoutLayer: (layerId, algorithm = 'cose') =>
    set((state) => {
      const layer = findLayerById(state.project.layers, layerId);
      if (!layer || layer.nodes.length === 0) return state;
      const cy = cytoscape({ headless: true });
      cy.add(
        layer.nodes.map((n) => ({
          data: { id: n.id },
          position: { x: n.x, y: n.y },
        }))
      );
      cy.add(
        layer.edges.map((e) => ({
          data: { id: e.id, source: e.source, target: e.target },
        }))
      );
      const layoutOptions: cytoscape.LayoutOptions = {
        name: algorithm,
        animate: false,
        fit: false,
        padding: 30,
      } as cytoscape.LayoutOptions;
      cy.layout(layoutOptions).run();
      const positions: Record<string, { x: number; y: number }> = {};
      cy.nodes().forEach((n) => {
        positions[n.id()] = { ...n.position() };
      });
      const allPositions = Object.values(positions);
      const minX = allPositions.length ? Math.min(...allPositions.map((p) => p.x)) : 0;
      const minY = allPositions.length ? Math.min(...allPositions.map((p) => p.y)) : 0;
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) =>
          l.id === layerId
            ? {
                ...l,
                nodes: l.nodes.map((n) => {
                  const pos = positions[n.id];
                  return pos ? { ...n, x: pos.x - minX, y: pos.y - minY } : n;
                }),
              }
            : l
        ),
      };
      cy.destroy();
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null, selectedLayerId: null, selectedNodeIds: [], selectedEdgeIds: [], batchEditingOpen: false }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null, selectedLayerId: null, selectedNodeIds: [], selectedEdgeIds: [], batchEditingOpen: false }),
  setSelectedLayer: (id) => set({ selectedLayerId: id, selectedNodeId: null, selectedEdgeId: null, selectedNodeIds: [], selectedEdgeIds: [], batchEditingOpen: false }),
  toggleSelectedNode: (id) =>
    set((state) => {
      const set = new Set(state.selectedNodeIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { selectedNodeIds: Array.from(set), selectedNodeId: null, selectedEdgeId: null, selectedLayerId: null, selectedEdgeIds: [], batchEditingOpen: false };
    }),
  toggleSelectedEdge: (id) =>
    set((state) => {
      const set = new Set(state.selectedEdgeIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { selectedEdgeIds: Array.from(set), selectedEdgeId: null, selectedNodeId: null, selectedLayerId: null, selectedNodeIds: [] };
    }),
  clearMultiSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [], batchEditingOpen: false }),
  batchUpdateNodes: (patch) =>
    set((state) => {
      const ids = new Set(state.selectedNodeIds);
      const nextProject = {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          nodes: l.nodes.map((n) => (ids.has(n.id) ? { ...n, ...patch } : n)),
        })),
      };
      return { project: nextProject, ...recordHistory({ ...state, project: nextProject }) };
    }),
  setDetailPopup: (popup) => set({ detailPopup: popup }),
  closeDetailPopup: () => set({ detailPopup: null }),
  setEditingNode: (id) => set({ editingNodeId: id }),
  setEditingEdge: (id) => set({ editingEdgeId: id }),
  setEditingLayer: (id) => set({ editingLayerId: id }),
  setBatchEditingOpen: (open) => set({ batchEditingOpen: open }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setEditMode: (value) => set({ isEditMode: value }),
  toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'layered' ? 'overview' : 'layered', selectedNodeId: null, selectedEdgeId: null,
      selectedLayerId: null, detailPopup: null })),
  setViewMode: (mode) => set({ viewMode: mode, selectedNodeId: null, selectedEdgeId: null,
      selectedLayerId: null, detailPopup: null }),
  setSelectedShape: (shape) => set({ selectedShape: shape }),
  setSearchQuery: (query) => set({ searchQuery: query.trim().toLowerCase() }),
}));
