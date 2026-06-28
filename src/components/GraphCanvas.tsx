import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { useGraphStore } from '../store/graphStore';
import { CYTOSCAPE_STYLES } from '../utils/cytoscapeStyle';
import {
  NODE_BACKGROUND_PALETTE,
  NODE_BORDER_PALETTE,
  pickByIndex,
} from '../utils/styleDefaults';
import ResizeHandles from './ResizeHandles';
import type { EdgeData, ProjectData } from '../model/types';

type Mode = 'select' | 'add-node' | 'add-edge';

interface GraphCanvasProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const TEMP_TARGET_ID = 'temp-target';
const TEMP_EDGE_ID = 'temp-edge';

function buildElements(
  project: ProjectData,
  hiddenLayerIds: Set<string>,
  viewMode: 'layered' | 'overview'
) {
  const visibleLayers = project.layers.filter((l) => !hiddenLayerIds.has(l.id));
  const visibleNodeIds = new Set(visibleLayers.flatMap((l) => l.nodes.map((n) => n.id)));

  const elements: cytoscape.ElementDefinition[] = [];

  if (viewMode === 'layered') {
    for (const layer of visibleLayers) {
      elements.push({
        data: {
          id: layer.id,
          label: layer.name,
          color: layer.color || '#cbd5e1',
          width: layer.width,
          height: layer.height,
          fontColor: layer.fontColor,
          fontSize: layer.fontSize,
          fontFamily: layer.fontFamily,
          fontWeight: layer.fontWeight,
          borderColor: layer.borderColor,
          borderStyle: layer.borderStyle,
        },
        classes: 'layer',
      });
      for (const [nodeIndex, node] of layer.nodes.entries()) {
        const backgroundColor = node.backgroundColor || pickByIndex(NODE_BACKGROUND_PALETTE, nodeIndex);
        const borderColor = node.borderColor || pickByIndex(NODE_BORDER_PALETTE, nodeIndex);
        elements.push({
          data: {
            id: node.id,
            parent: layer.id,
            label: node.name,
            layerId: layer.id,
            shape: node.shape,
            width: node.width,
            height: node.height,
            backgroundColor,
            borderColor,
            borderStyle: node.borderStyle,
            fontColor: node.fontColor,
            fontSize: node.fontSize,
            fontFamily: node.fontFamily,
            fontWeight: node.fontWeight,
          },
          position: { x: (layer.x ?? 0) + node.x, y: (layer.y ?? 0) + node.y },
          classes: 'indicator',
        });
      }
      for (const edge of layer.edges) {
        if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
        elements.push({
          data: { ...edge },
          classes: edge.direction,
        });
      }
    }
  } else {
    // Overview mode: flat graph of all visible indicators with cross-layer edges
    for (const layer of visibleLayers) {
      for (const [nodeIndex, node] of layer.nodes.entries()) {
        const backgroundColor = node.backgroundColor || pickByIndex(NODE_BACKGROUND_PALETTE, nodeIndex);
        const borderColor = node.borderColor || pickByIndex(NODE_BORDER_PALETTE, nodeIndex);
        elements.push({
          data: {
            id: node.id,
            label: node.name,
            layerId: layer.id,
            layerColor: layer.color || '#cbd5e1',
            layerName: layer.name,
            shape: node.shape,
            width: node.width,
            height: node.height,
            backgroundColor,
            borderColor,
            borderStyle: node.borderStyle,
            fontColor: node.fontColor,
            fontSize: node.fontSize,
            fontFamily: node.fontFamily,
            fontWeight: node.fontWeight,
          },
          classes: 'indicator overview',
        });
      }
      for (const edge of layer.edges) {
        if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
        elements.push({
          data: { ...edge },
          classes: edge.direction,
        });
      }
    }
  }

  for (const edge of project.crossEdges) {
    if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
    elements.push({
      data: { ...edge },
      classes: edge.direction,
    });
  }

  return elements;
}

function getAllEdges(project: ProjectData): EdgeData[] {
  return project.layers.flatMap((l) => l.edges).concat(project.crossEdges);
}

export default function GraphCanvas({ mode, setMode }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [cyInstance, setCyInstance] = useState<cytoscape.Core | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selectStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectingRef = useRef(false);
  const dragStartRef = useRef<Record<string, cytoscape.Position>>({});
  const drawSourceRef = useRef<string | null>(null);
  const multiDragRef = useRef<{ grabbedId: string; startPositions: Record<string, cytoscape.Position> } | null>(null);

  const {
    project,
    hiddenLayerIds,
    selectedNodeId,
    selectedEdgeId,
    selectedLayerId,
    selectedNodeIds,
    selectedEdgeIds,
    isEditMode,
    viewMode,
    searchQuery,
    setSelectedNode,
    setSelectedLayer,
    setSelectedEdge,
    toggleSelectedNode,
    toggleSelectedEdge,
    clearMultiSelection,
    setDetailPopup,
    closeDetailPopup,
    moveNode,
    moveLayer,
    addNode,
    addEdge,
    deleteNode,
    deleteEdge,
    deleteLayer,
    selectedShape,
    setEditingNode,
    setEditingEdge,
    setViewMode,
    undo,
    redo,
  } = useGraphStore();

  const selectedNodeIdsRef = useRef<string[]>(selectedNodeIds);
  const moveNodeRef = useRef(moveNode);
  selectedNodeIdsRef.current = selectedNodeIds;
  moveNodeRef.current = moveNode;

  const modeRef = useRef(mode);
  const isEditModeRef = useRef(isEditMode);
  const viewModeRef = useRef(viewMode);
  const selectedShapeRef = useRef(selectedShape);
  const projectRef = useRef(project);
  modeRef.current = mode;
  isEditModeRef.current = isEditMode;
  viewModeRef.current = viewMode;
  selectedShapeRef.current = selectedShape;
  projectRef.current = project;

  const clearTempEdge = (cy: cytoscape.Core) => {
    cy.getElementById(TEMP_EDGE_ID).remove();
    cy.getElementById(TEMP_TARGET_ID).remove();
    drawSourceRef.current = null;
  };

  // Initialize Cytoscape once
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: CYTOSCAPE_STYLES,
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });
    cyRef.current = cy;
    setCyInstance(cy);

    cy.on('tap', 'node.indicator', (evt) => {
      if (drawSourceRef.current) return;
      const nodeId = (evt.target as cytoscape.NodeSingular).id();
      const isMulti = (evt.originalEvent as MouseEvent)?.ctrlKey || (evt.originalEvent as MouseEvent)?.metaKey;
      if (isMulti) {
        toggleSelectedNode(nodeId);
      } else if (selectedNodeId === nodeId && selectedNodeIds.length === 0) {
        setSelectedNode(null);
      } else {
        clearMultiSelection();
        setSelectedNode(nodeId);
      }
      if (viewModeRef.current === 'overview') {
        evt.target.select();
        cy.animate({ fit: { eles: evt.target, padding: 80 }, duration: 300, easing: 'ease-out' });
      }
    });

    cy.on('tap', 'node.layer', (evt) => {
      if (drawSourceRef.current) return;
      if (viewModeRef.current === 'overview') return;
      const layerId = (evt.target as cytoscape.NodeSingular).id();
      if (isEditModeRef.current && modeRef.current === 'add-node') {
        const pos = evt.position;
        const shape = selectedShapeRef.current || 'roundrectangle';
        const newNodeId = addNode(layerId, pos.x, pos.y, shape);
        setEditingNode(newNodeId);
        setMode('select');
        return;
      }
      if (selectedLayerId === layerId) {
        setSelectedLayer(null);
      } else {
        clearMultiSelection();
        setSelectedLayer(layerId);
      }
    });

    cy.on('tap', 'edge', (evt) => {
      if (drawSourceRef.current) return;
      const edge = evt.target as cytoscape.EdgeSingular;
      const edgeId = edge.id();
      const isMulti = (evt.originalEvent as MouseEvent)?.ctrlKey || (evt.originalEvent as MouseEvent)?.metaKey;
      if (isMulti) {
        toggleSelectedEdge(edgeId);
      } else {
        clearMultiSelection();
        setSelectedEdge(edgeId);
      }
      const rendered = evt.renderedPosition;
      const rect = containerRef.current?.getBoundingClientRect();
      setDetailPopup({
        edgeId,
        x: rendered.x + (rect?.left ?? 0),
        y: rendered.y + (rect?.top ?? 0),
      });
    });

    cy.on('tap', (evt) => {
      if (drawSourceRef.current) return;
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedLayer(null);
        setSelectedEdge(null);
        clearMultiSelection();
        closeDetailPopup();
      }
    });

    cy.on('dbltap', 'node.indicator', (evt) => {
      const nodeId = evt.target.id();
      if (viewModeRef.current === 'overview') {
        setViewMode('layered');
        setSelectedNode(nodeId);
        return;
      }
      if (!isEditModeRef.current) return;
      setEditingNode(nodeId);
    });

    cy.on('dbltap', 'edge', (evt) => {
      if (!isEditModeRef.current) return;
      setEditingEdge(evt.target.id());
    });

    // Drag-to-connect
    cy.on('mousedown', 'node.indicator', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (!isEditModeRef.current || modeRef.current !== 'add-edge') return;
      const sourceId = (evt.target as cytoscape.NodeSingular).id();
      drawSourceRef.current = sourceId;
      const pos = evt.position;
      cy.add([
        { data: { id: TEMP_TARGET_ID }, position: { ...pos }, classes: 'temp-target' },
        {
          data: { id: TEMP_EDGE_ID, source: sourceId, target: TEMP_TARGET_ID },
          classes: 'temp-edge',
        },
      ]);
    });

    cy.on('mousemove', (evt) => {
      if (!drawSourceRef.current) return;
      const target = cy.getElementById(TEMP_TARGET_ID);
      if (target.length) {
        target.position(evt.position);
      }
    });

    cy.on('mouseup', 'node.indicator', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (!drawSourceRef.current) return;
      const targetId = (evt.target as cytoscape.NodeSingular).id();
      if (targetId !== drawSourceRef.current) {
        const newEdgeId = addEdge({
          source: drawSourceRef.current,
          target: targetId,
          direction: 'forward',
          type: 'default',
          brief: '',
          detail: '',
          table: '',
        });
        setEditingEdge(newEdgeId);
      }
      clearTempEdge(cy);
      setMode('select');
    });

    cy.on('mouseup', (evt) => {
      if (!drawSourceRef.current) return;
      if (evt.target === cy) {
        clearTempEdge(cy);
        setMode('select');
      }
    });

    // Shift / Ctrl drag box selection
    cy.on('mousedown', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (!isEditModeRef.current || modeRef.current !== 'select') return;
      if (evt.target !== cy) return;
      const e = evt.originalEvent as MouseEvent;
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const container = cy.container();
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      selectStartRef.current = start;
      selectingRef.current = true;
      cy.userPanningEnabled(false);
      cy.userZoomingEnabled(false);
      setSelectionRect({ x: start.x, y: start.y, w: 0, h: 0 });

      const onMouseMove = (ev: MouseEvent) => {
        if (!selectingRef.current || !selectStartRef.current) return;
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const sx = selectStartRef.current.x;
        const sy = selectStartRef.current.y;
        setSelectionRect({ x: Math.min(sx, x), y: Math.min(sy, y), w: Math.abs(x - sx), h: Math.abs(y - sy) });
      };

      const onMouseUp = (ev: MouseEvent) => {
        if (!selectingRef.current) return;
        selectingRef.current = false;
        const sx = selectStartRef.current?.x ?? 0;
        const sy = selectStartRef.current?.y ?? 0;
        selectStartRef.current = null;
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const selX1 = Math.min(sx, x);
        const selY1 = Math.min(sy, y);
        const selX2 = Math.max(sx, x);
        const selY2 = Math.max(sy, y);
        const pan = cy.pan();
        const zoom = cy.zoom();
        const modelX1 = (selX1 - pan.x) / zoom;
        const modelY1 = (selY1 - pan.y) / zoom;
        const modelX2 = (selX2 - pan.x) / zoom;
        const modelY2 = (selY2 - pan.y) / zoom;
        const intersecting = cy
          .nodes('.indicator')
          .filter((n) => {
            const bb = n.boundingBox({ includeLabels: false, includeOverlays: false });
            return bb.x1 < modelX2 && bb.x2 > modelX1 && bb.y1 < modelY2 && bb.y2 > modelY1;
          })
          .map((n) => n.id());
        if (intersecting.length > 0) {
          if (ev.ctrlKey || ev.metaKey) {
            for (const id of intersecting) toggleSelectedNode(id);
          } else {
            clearMultiSelection();
            for (const id of intersecting) toggleSelectedNode(id);
          }
          setSelectedNode(null);
          setSelectedEdge(null);
          setSelectedLayer(null);
        } else if (!ev.ctrlKey && !ev.metaKey) {
          clearMultiSelection();
          setSelectedNode(null);
          setSelectedEdge(null);
          setSelectedLayer(null);
        }
        setSelectionRect(null);
        cy.userPanningEnabled(true);
        cy.userZoomingEnabled(true);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Layer / node dragging (allowed in both edit and preview modes, layered view only)
    cy.on('grab', 'node.layer', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (modeRef.current !== 'select') return;
      dragStartRef.current[evt.target.id()] = { ...evt.target.position() };
    });

    cy.on('dragfree', 'node.layer', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (modeRef.current !== 'select') return;
      const node = evt.target as cytoscape.NodeSingular;
      const start = dragStartRef.current[node.id()];
      if (!start) return;
      const end = node.position();
      const layer = projectRef.current.layers.find((l) => l.id === node.id());
      if (layer) {
        moveLayer(node.id(), (layer.x ?? 0) + (end.x - start.x), (layer.y ?? 0) + (end.y - start.y));
      }
      delete dragStartRef.current[node.id()];
    });

    cy.on('grab', 'node.indicator', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (modeRef.current !== 'select') return;
      const node = evt.target as cytoscape.NodeSingular;
      const ids = selectedNodeIdsRef.current;
      if (ids.length > 1 && ids.includes(node.id())) {
        const startPositions: Record<string, cytoscape.Position> = {};
        for (const id of ids) {
          const n = cy.getElementById(id);
          if (n.length > 0) startPositions[id] = { ...n.position() };
        }
        multiDragRef.current = { grabbedId: node.id(), startPositions };
      }
    });

    cy.on('drag', 'node.indicator', (evt) => {
      if (!multiDragRef.current) return;
      const node = evt.target as cytoscape.NodeSingular;
      if (node.id() !== multiDragRef.current.grabbedId) return;
      const start = multiDragRef.current.startPositions[node.id()];
      if (!start) return;
      const current = node.position();
      const dx = current.x - start.x;
      const dy = current.y - start.y;
      for (const [id, pos] of Object.entries(multiDragRef.current.startPositions)) {
        const n = cy.getElementById(id);
        if (n.length > 0) n.position({ x: pos.x + dx, y: pos.y + dy });
      }
    });

    cy.on('dragfree', 'node.indicator', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (modeRef.current !== 'select') return;
      const node = evt.target as cytoscape.NodeSingular;
      if (multiDragRef.current && node.id() === multiDragRef.current.grabbedId) {
        const start = multiDragRef.current.startPositions[node.id()];
        if (start) {
          const current = node.position();
          const dx = current.x - start.x;
          const dy = current.y - start.y;
          for (const [id, pos] of Object.entries(multiDragRef.current.startPositions)) {
            moveNodeRef.current(id, pos.x + dx, pos.y + dy);
          }
        }
        multiDragRef.current = null;
        return;
      }
      const pos = node.position();
      moveNode(node.id(), pos.x, pos.y);
    });

    // Drag-and-drop shapes from ShapeLibrary
    const container = cy.container();
    if (!container) return;
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!isEditModeRef.current || viewModeRef.current === 'overview') return;
      const shape = e.dataTransfer?.getData('application/shape') || e.dataTransfer?.getData('text/plain') || selectedShapeRef.current;
      if (!shape) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left - cy.pan().x) / cy.zoom();
      const y = (e.clientY - rect.top - cy.pan().y) / cy.zoom();
      const layerNode = cy
        .nodes('.layer')
        .filter((n) => {
          const bb = n.boundingBox({ includeLabels: false, includeOverlays: false });
          return bb.x1 <= x && x <= bb.x2 && bb.y1 <= y && y <= bb.y2;
        })
        .first();
      if (layerNode.length === 0) return;
      const droppedNodeId = addNode(layerNode.id(), x, y, shape);
      setEditingNode(droppedNodeId);
    };
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    const canvases = container.querySelectorAll('canvas');
    canvases.forEach((c) => {
      c.addEventListener('dragover', handleDragOver);
      c.addEventListener('drop', handleDrop);
    });

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
      canvases.forEach((c) => {
        c.removeEventListener('dragover', handleDragOver);
        c.removeEventListener('drop', handleDrop);
      });
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update node / layer grabbability based on edit mode, tool mode and view mode
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const canDrag = mode === 'select' && viewMode === 'layered';
    cy.nodes('.indicator').forEach((n) => {
      if (canDrag) n.grabify();
      else n.ungrabify();
    });
    cy.nodes('.layer').forEach((n) => {
      if (canDrag) n.grabify();
      else n.ungrabify();
    });
  }, [isEditMode, mode, viewMode]);

  // Rebuild elements when project, hidden layers or view mode change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    const elements = buildElements(project, hiddenLayerIds, viewMode);
    cy.add(elements);
    if (viewMode === 'overview') {
      cy.layout({ name: 'cose', animate: true, fit: true, padding: 40, componentSpacing: 80, nodeRepulsion: 8000 }).run();
    } else {
      cy.layout({ name: 'preset', fit: false }).run();
    }
  }, [project, hiddenLayerIds, viewMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;
      if (isTyping) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedNodeIds.length > 0) {
          for (const id of selectedNodeIds) deleteNode(id);
          clearMultiSelection();
          setSelectedNode(null);
        } else if (selectedEdgeIds.length > 0) {
          for (const id of selectedEdgeIds) deleteEdge(id);
          clearMultiSelection();
          setSelectedEdge(null);
        } else if (selectedNodeId) {
          deleteNode(selectedNodeId);
          setSelectedNode(null);
        } else if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
          setSelectedEdge(null);
        } else if (selectedLayerId) {
          if (confirm(`确定删除图层？其中的指标和连线也会被删除。`)) {
            deleteLayer(selectedLayerId);
            setSelectedLayer(null);
          }
        }
        return;
      }
      if (!isCtrl) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteNode, deleteEdge, deleteLayer, selectedNodeId, selectedEdgeId, selectedLayerId, selectedNodeIds, selectedEdgeIds, setSelectedNode, setSelectedEdge, setSelectedLayer, clearMultiSelection]);

  // Apply highlight classes (selection + search)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.nodes().removeClass('selected dimmed');
      cy.edges().removeClass('highlighted dimmed');

      const activeNodeIds = new Set<string>();
      const activeEdgeIds = new Set<string>();

      if (selectedNodeId) {
        activeNodeIds.add(selectedNodeId);
        const allEdges = getAllEdges(project);
        for (const edge of allEdges) {
          if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
            activeEdgeIds.add(edge.id);
            activeNodeIds.add(edge.source);
            activeNodeIds.add(edge.target);
          }
        }
      }
      for (const id of selectedNodeIds) {
        activeNodeIds.add(id);
      }
      for (const id of selectedEdgeIds) {
        activeEdgeIds.add(id);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        for (const layer of project.layers) {
          for (const node of layer.nodes) {
            if (node.name.toLowerCase().includes(query)) {
              activeNodeIds.add(node.id);
            }
          }
        }
        const allEdges = getAllEdges(project);
        for (const edge of allEdges) {
          if (activeNodeIds.has(edge.source) || activeNodeIds.has(edge.target)) {
            activeEdgeIds.add(edge.id);
            activeNodeIds.add(edge.source);
            activeNodeIds.add(edge.target);
          }
        }
      }

      if (activeNodeIds.size === 0) return;

      cy.nodes('.indicator').forEach((n) => {
        const id = n.id();
        if (id === selectedNodeId || selectedNodeIds.includes(id)) {
          n.addClass('selected');
        } else if (!activeNodeIds.has(id)) {
          n.addClass('dimmed');
        }
      });

      cy.edges().forEach((e) => {
        if (activeEdgeIds.has(e.id())) {
          e.addClass('highlighted');
        } else {
          e.addClass('dimmed');
        }
      });

      if (viewMode === 'layered') {
        cy.nodes('.layer').forEach((layerNode) => {
          const childIds = layerNode
            .children('.indicator')
            .map((child) => (child as cytoscape.NodeSingular).id());
          const hasActiveChild = childIds.some(
            (id) => id === selectedNodeId || activeNodeIds.has(id)
          );
          if (!hasActiveChild) {
            layerNode.addClass('dimmed');
          }
        });
      }

      // Pan to matched nodes in overview mode
      if (viewMode === 'overview' && searchQuery && activeNodeIds.size > 0) {
        const matched = cy.collection();
        activeNodeIds.forEach((id) => {
          const n = cy.getElementById(id);
          if (n.length) matched.merge(n);
        });
        if (matched.length > 0) {
          cy.animate({ fit: { eles: matched, padding: 120 }, duration: 400, easing: 'ease-out' });
        }
      }
    });
  }, [selectedNodeId, selectedNodeIds, selectedEdgeIds, searchQuery, project, hiddenLayerIds, viewMode]);

  const cursorClass = viewMode === 'overview'
    ? 'cursor-default'
    : !isEditMode
    ? 'cursor-grab'
    : mode === 'add-node' || mode === 'add-edge'
    ? 'cursor-crosshair'
    : 'cursor-grab';

  return (
    <div ref={containerRef} className={`flex-1 relative bg-gray-100 ${cursorClass}`}>
      {cyInstance && (
        <ResizeHandles
          cy={cyInstance}
          selectedNodeId={selectedNodeId}
          selectedLayerId={selectedLayerId}
          selectedNodeIds={selectedNodeIds}
        />
      )}
      {selectionRect && (
        <div
          className="absolute pointer-events-none border border-blue-500 bg-blue-500/10 z-20"
          style={{
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.w,
            height: selectionRect.h,
          }}
        />
      )}
    </div>
  );
}
