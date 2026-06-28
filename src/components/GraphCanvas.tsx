import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { useGraphStore } from '../store/graphStore';
import { CYTOSCAPE_STYLES } from '../utils/cytoscapeStyle';
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
        data: { id: layer.id, label: layer.name, color: layer.color || '#cbd5e1' },
        classes: 'layer',
      });
      for (const node of layer.nodes) {
        elements.push({
          data: {
            id: node.id,
            parent: layer.id,
            label: node.name,
            layerId: layer.id,
            shape: node.shape,
            width: node.width,
            height: node.height,
            backgroundColor: node.backgroundColor,
            borderColor: node.borderColor,
            borderStyle: node.borderStyle,
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
      for (const node of layer.nodes) {
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
            backgroundColor: node.backgroundColor,
            borderColor: node.borderColor,
            borderStyle: node.borderStyle,
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
  const dragStartRef = useRef<Record<string, cytoscape.Position>>({});
  const drawSourceRef = useRef<string | null>(null);

  const {
    project,
    hiddenLayerIds,
    selectedNodeId,
    isEditMode,
    viewMode,
    searchQuery,
    setSelectedNode,
    setSelectedEdge,
    setDetailPopup,
    closeDetailPopup,
    moveNode,
    moveLayer,
    addNode,
    addEdge,
    selectedShape,
    setEditingNode,
    setEditingEdge,
    setViewMode,
    undo,
    redo,
  } = useGraphStore();

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

    cy.on('tap', 'node.indicator', (evt) => {
      if (drawSourceRef.current) return;
      const nodeId = (evt.target as cytoscape.NodeSingular).id();
      if (selectedNodeId === nodeId) {
        setSelectedNode(null);
      } else {
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
      if (!isEditModeRef.current || modeRef.current !== 'add-node') return;
      const layerId = (evt.target as cytoscape.NodeSingular).id();
      const pos = evt.position;
      const shape = selectedShapeRef.current || 'roundrectangle';
      addNode(layerId, pos.x, pos.y, shape);
      setMode('select');
    });

    cy.on('tap', 'edge', (evt) => {
      if (drawSourceRef.current) return;
      const edge = evt.target as cytoscape.EdgeSingular;
      const edgeId = edge.id();
      setSelectedEdge(edgeId);
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
        setSelectedEdge(null);
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
        addEdge({
          source: drawSourceRef.current,
          target: targetId,
          direction: 'forward',
          type: 'default',
          brief: '',
          detail: '',
          table: '',
        });
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

    cy.on('dragfree', 'node.indicator', (evt) => {
      if (viewModeRef.current === 'overview') return;
      if (modeRef.current !== 'select') return;
      const node = evt.target as cytoscape.NodeSingular;
      const pos = node.position();
      moveNode(node.id(), pos.x, pos.y);
    });

    // Drag-and-drop shapes from ShapeLibrary
    const container = cy.container();
    if (!container) return;
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer && (e.dataTransfer.dropEffect = 'copy');
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
      addNode(layerNode.id(), x, y, shape);
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
  }, []);

  // Update node / layer grabbability based on edit mode, tool mode and view mode
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const canDrag = mode === 'select' && viewMode === 'layered';
    cy.nodes('.indicator').forEach((n) => {
      canDrag ? n.grabify() : n.ungrabify();
    });
    cy.nodes('.layer').forEach((n) => {
      canDrag ? n.grabify() : n.ungrabify();
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
      const isCtrl = e.ctrlKey || e.metaKey;
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
  }, [undo, redo]);

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
        if (id === selectedNodeId) {
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
  }, [selectedNodeId, searchQuery, project, hiddenLayerIds, viewMode]);

  const cursorClass = viewMode === 'overview'
    ? 'cursor-default'
    : !isEditMode
    ? 'cursor-grab'
    : mode === 'add-node' || mode === 'add-edge'
    ? 'cursor-crosshair'
    : 'cursor-grab';

  return <div ref={containerRef} className={`flex-1 relative bg-gray-100 ${cursorClass}`} />;
}
