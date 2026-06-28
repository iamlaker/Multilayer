import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { useGraphStore } from '../store/graphStore';
import { CYTOSCAPE_STYLES } from '../utils/cytoscapeStyle';
import type { EdgeData, ProjectData } from '../model/types';

type Mode = 'select' | 'add-node' | 'add-edge';

interface GraphCanvasProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  edgeSource: string | null;
  setEdgeSource: (id: string | null) => void;
}

function buildElements(project: ProjectData, hiddenLayerIds: Set<string>) {
  const visibleLayers = project.layers.filter((l) => !hiddenLayerIds.has(l.id));
  const visibleNodeIds = new Set(visibleLayers.flatMap((l) => l.nodes.map((n) => n.id)));

  const elements: cytoscape.ElementDefinition[] = [];

  for (const layer of visibleLayers) {
    elements.push({
      data: { id: layer.id, label: layer.name, color: layer.color || '#cbd5e1' },
      classes: 'layer',
    });
    for (const node of layer.nodes) {
      elements.push({
        data: { id: node.id, parent: layer.id, label: node.name, layerId: layer.id },
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

export default function GraphCanvas({ mode, setMode, edgeSource, setEdgeSource }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const dragStartRef = useRef<Record<string, cytoscape.Position>>({});

  const {
    project,
    hiddenLayerIds,
    selectedNodeId,
    setSelectedNode,
    setSelectedEdge,
    setDetailPopup,
    closeDetailPopup,
    moveNode,
    moveLayer,
    addNode,
    addEdge,
    setEditingNode,
    setEditingEdge,
  } = useGraphStore();

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
      const node = evt.target as cytoscape.NodeSingular;
      const nodeId = node.id();

      if (mode === 'add-edge') {
        if (!edgeSource) {
          setEdgeSource(nodeId);
          return;
        }
        if (edgeSource !== nodeId) {
          addEdge({ source: edgeSource, target: nodeId, direction: 'forward', type: 'default', brief: '', detail: '', table: '' });
        }
        setEdgeSource(null);
        setMode('select');
        return;
      }

      if (selectedNodeId === nodeId) {
        setSelectedNode(null);
      } else {
        setSelectedNode(nodeId);
      }
    });

    cy.on('tap', 'node.layer', (evt) => {
      const layerNode = evt.target as cytoscape.NodeSingular;
      const layerId = layerNode.id();
      if (mode === 'add-node') {
        const pos = evt.position;
        addNode(layerId, pos.x, pos.y);
        setMode('select');
      }
    });

    cy.on('tap', 'edge', (evt) => {
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
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
        closeDetailPopup();
        if (mode !== 'add-edge') {
          setEdgeSource(null);
        }
      }
    });

    cy.on('dbltap', 'node.indicator', (evt) => {
      setEditingNode(evt.target.id());
    });

    cy.on('dbltap', 'edge', (evt) => {
      setEditingEdge(evt.target.id());
    });

    cy.on('grab', 'node.layer', (evt) => {
      const node = evt.target as cytoscape.NodeSingular;
      dragStartRef.current[node.id()] = { ...node.position() };
    });

    cy.on('dragfree', 'node.layer', (evt) => {
      const node = evt.target as cytoscape.NodeSingular;
      const start = dragStartRef.current[node.id()];
      if (!start) return;
      const end = node.position();
      const layer = project.layers.find((l) => l.id === node.id());
      if (layer) {
        moveLayer(node.id(), (layer.x ?? 0) + (end.x - start.x), (layer.y ?? 0) + (end.y - start.y));
      }
      delete dragStartRef.current[node.id()];
    });

    cy.on('dragfree', 'node.indicator', (evt) => {
      const node = evt.target as cytoscape.NodeSingular;
      const pos = node.position();
      moveNode(node.id(), pos.x, pos.y);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Rebuild elements when project or hidden layers change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    const elements = buildElements(project, hiddenLayerIds);
    cy.add(elements);
    cy.layout({ name: 'preset', fit: false }).run();
  }, [project, hiddenLayerIds]);

  // Apply highlight classes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.nodes().removeClass('selected dimmed');
      cy.edges().removeClass('highlighted dimmed');

      if (!selectedNodeId) return;

      const allEdges = getAllEdges(project);
      const connectedEdgeIds = new Set<string>();
      const connectedNodeIds = new Set<string>([selectedNodeId]);

      for (const edge of allEdges) {
        if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
          connectedEdgeIds.add(edge.id);
          connectedNodeIds.add(edge.source);
          connectedNodeIds.add(edge.target);
        }
      }

      cy.nodes('.indicator').forEach((n) => {
        const id = n.id();
        if (id === selectedNodeId) {
          n.addClass('selected');
        } else if (!connectedNodeIds.has(id)) {
          n.addClass('dimmed');
        }
      });

      cy.edges().forEach((e) => {
        if (connectedEdgeIds.has(e.id())) {
          e.addClass('highlighted');
        } else {
          e.addClass('dimmed');
        }
      });

      cy.nodes('.layer').forEach((layerNode) => {
        const childIds = layerNode
          .children('.indicator')
          .map((child) => (child as cytoscape.NodeSingular).id());
        const hasConnectedChild = childIds.some(
          (id) => id === selectedNodeId || connectedNodeIds.has(id)
        );
        if (!hasConnectedChild) {
          layerNode.addClass('dimmed');
        }
      });
    });
  }, [selectedNodeId, project, hiddenLayerIds]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative bg-gray-100 ${mode === 'add-node' ? 'cursor-crosshair' : mode === 'add-edge' ? 'cursor-crosshair' : 'cursor-grab'}`}
    />
  );
}
