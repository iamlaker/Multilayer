import { create } from 'zustand';
import type { EdgeData, LayerData, NodeData, ProjectData, DetailPopupState } from '../model/types';
import { generateId } from '../model/schema';

const LAYER_COLORS = [
  '#dbeafe',
  '#dcfce7',
  '#fef3c7',
  '#f3e8ff',
  '#ffe4e6',
  '#ccfbf1',
  '#f1f5f9',
];

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
  hiddenLayerIds: Set<string>;
  detailPopup: DetailPopupState | null;
  editingNodeId: string | null;
  editingEdgeId: string | null;
  isEditMode: boolean;
}

interface GraphActions {
  loadProject: (project: ProjectData) => void;
  addLayer: () => void;
  updateLayer: (id: string, patch: Partial<LayerData>) => void;
  deleteLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  addNode: (layerId: string, x: number, y: number) => void;
  updateNode: (id: string, patch: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Omit<EdgeData, 'id'>) => void;
  updateEdge: (id: string, patch: Partial<EdgeData>) => void;
  deleteEdge: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  moveLayer: (id: string, x: number, y: number) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setDetailPopup: (popup: DetailPopupState | null) => void;
  closeDetailPopup: () => void;
  setEditingNode: (id: string | null) => void;
  setEditingEdge: (id: string | null) => void;
  toggleEditMode: () => void;
  setEditMode: (value: boolean) => void;
}

function findLayerByNodeId(layers: LayerData[], nodeId: string): LayerData | undefined {
  return layers.find((l) => l.nodes.some((n) => n.id === nodeId));
}

function findLayerById(layers: LayerData[], id: string): LayerData | undefined {
  return layers.find((l) => l.id === id);
}

export const useGraphStore = create<GraphState & GraphActions>((set) => ({
  project: DEFAULT_PROJECT,
  selectedNodeId: null,
  selectedEdgeId: null,
  hiddenLayerIds: new Set(),
  detailPopup: null,
  editingNodeId: null,
  editingEdgeId: null,
  isEditMode: true,

  loadProject: (project) => set({ project, selectedNodeId: null, selectedEdgeId: null, detailPopup: null }),

  addLayer: () =>
    set((state) => {
      const index = state.project.layers.length;
      const newLayer: LayerData = {
        id: generateId('layer'),
        name: `新建图层 ${index + 1}`,
        description: '',
        color: LAYER_COLORS[index % LAYER_COLORS.length],
        x: 50 + index * 50,
        y: 50 + index * 50,
        nodes: [],
        edges: [],
      };
      return { project: { ...state.project, layers: [...state.project.layers, newLayer] } };
    }),

  updateLayer: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      },
    })),

  deleteLayer: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.filter((l) => l.id !== id),
        crossEdges: state.project.crossEdges.filter((e) => {
          const layerNodes = new Set(
            state.project.layers.find((l) => l.id === id)?.nodes.map((n) => n.id) ?? []
          );
          return !layerNodes.has(e.source) && !layerNodes.has(e.target);
        }),
      },
      hiddenLayerIds: new Set([...state.hiddenLayerIds].filter((hid) => hid !== id)),
    })),

  toggleLayerVisibility: (id) =>
    set((state) => {
      const next = new Set(state.hiddenLayerIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { hiddenLayerIds: next };
    }),

  addNode: (layerId, x, y) =>
    set((state) => {
      const layer = findLayerById(state.project.layers, layerId);
      if (!layer) return state;
      const layerX = layer.x ?? 0;
      const layerY = layer.y ?? 0;
      const newNode: NodeData = {
        id: generateId('node'),
        name: '新指标',
        type: 'indicator',
        x: x - layerX,
        y: y - layerY,
      };
      return {
        project: {
          ...state.project,
          layers: state.project.layers.map((l) =>
            l.id === layerId ? { ...l, nodes: [...l.nodes, newNode] } : l
          ),
        },
      };
    }),

  updateNode: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          nodes: l.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      },
    })),

  deleteNode: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          nodes: l.nodes.filter((n) => n.id !== id),
          edges: l.edges.filter((e) => e.source !== id && e.target !== id),
        })),
        crossEdges: state.project.crossEdges.filter((e) => e.source !== id && e.target !== id),
      },
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      selectedEdgeId: null,
      detailPopup: null,
    })),

  addEdge: (edge) =>
    set((state) => {
      const sourceLayer = findLayerByNodeId(state.project.layers, edge.source);
      const targetLayer = findLayerByNodeId(state.project.layers, edge.target);
      const newEdge: EdgeData = { ...edge, id: generateId('edge') };
      if (sourceLayer && targetLayer && sourceLayer.id === targetLayer.id) {
        return {
          project: {
            ...state.project,
            layers: state.project.layers.map((l) =>
              l.id === sourceLayer.id ? { ...l, edges: [...l.edges, newEdge] } : l
            ),
          },
        };
      }
      return {
        project: {
          ...state.project,
          crossEdges: [...state.project.crossEdges, newEdge],
        },
      };
    }),

  updateEdge: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          edges: l.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
        crossEdges: state.project.crossEdges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    })),

  deleteEdge: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((l) => ({
          ...l,
          edges: l.edges.filter((e) => e.id !== id),
        })),
        crossEdges: state.project.crossEdges.filter((e) => e.id !== id),
      },
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      detailPopup: state.detailPopup?.edgeId === id ? null : state.detailPopup,
    })),

  moveNode: (id, x, y) =>
    set((state) => {
      const layer = findLayerByNodeId(state.project.layers, id);
      if (!layer) return state;
      const layerX = layer.x ?? 0;
      const layerY = layer.y ?? 0;
      return {
        project: {
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
        },
      };
    }),

  moveLayer: (id, x, y) =>
    set((state) => ({
      project: {
        ...state.project,
        layers: state.project.layers.map((l) => (l.id === id ? { ...l, x, y } : l)),
      },
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id }),
  setDetailPopup: (popup) => set({ detailPopup: popup }),
  closeDetailPopup: () => set({ detailPopup: null }),
  setEditingNode: (id) => set({ editingNodeId: id }),
  setEditingEdge: (id) => set({ editingEdgeId: id }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setEditMode: (value) => set({ isEditMode: value }),
}));
