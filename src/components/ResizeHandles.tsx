import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { useGraphStore } from '../store/graphStore';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ResizeHandlesProps {
  cy: cytoscape.Core;
  selectedNodeId: string | null;
  selectedLayerId: string | null;
  selectedNodeIds: string[];
}

const HANDLE_SIZE = 8;
const MIN_WIDTH = 40;
const MIN_HEIGHT = 24;

interface BoxInfo {
  handle: Handle;
  left: number;
  top: number;
  cursor: string;
}

interface NodeStart {
  x: number;
  y: number;
  width: number;
  height: number;
}

function buildBoxes(bb: cytoscape.BoundingBox12): BoxInfo[] {
  const hs = HANDLE_SIZE / 2;
  const cx = (bb.x1 + bb.x2) / 2;
  const cyCenter = (bb.y1 + bb.y2) / 2;
  return [
    { handle: 'nw', left: bb.x1 - hs, top: bb.y1 - hs, cursor: 'nwse-resize' },
    { handle: 'n', left: cx - hs, top: bb.y1 - hs, cursor: 'ns-resize' },
    { handle: 'ne', left: bb.x2 - hs, top: bb.y1 - hs, cursor: 'nesw-resize' },
    { handle: 'e', left: bb.x2 - hs, top: cyCenter - hs, cursor: 'ew-resize' },
    { handle: 'se', left: bb.x2 - hs, top: bb.y2 - hs, cursor: 'nwse-resize' },
    { handle: 's', left: cx - hs, top: bb.y2 - hs, cursor: 'ns-resize' },
    { handle: 'sw', left: bb.x1 - hs, top: bb.y2 - hs, cursor: 'nesw-resize' },
    { handle: 'w', left: bb.x1 - hs, top: cyCenter - hs, cursor: 'ew-resize' },
  ];
}

function applyHandleDelta(
  handle: Handle,
  dx: number,
  dy: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  let nx1 = x1;
  let ny1 = y1;
  let nx2 = x2;
  let ny2 = y2;
  switch (handle) {
    case 'se':
      nx2 = x2 + dx;
      ny2 = y2 + dy;
      break;
    case 's':
      ny2 = y2 + dy;
      break;
    case 'sw':
      nx1 = x1 + dx;
      ny2 = y2 + dy;
      break;
    case 'e':
      nx2 = x2 + dx;
      break;
    case 'w':
      nx1 = x1 + dx;
      break;
    case 'ne':
      nx2 = x2 + dx;
      ny1 = y1 + dy;
      break;
    case 'n':
      ny1 = y1 + dy;
      break;
    case 'nw':
      nx1 = x1 + dx;
      ny1 = y1 + dy;
      break;
  }
  return { x1: nx1, y1: ny1, x2: nx2, y2: ny2 };
}

export default function ResizeHandles({ cy, selectedNodeId, selectedLayerId, selectedNodeIds }: ResizeHandlesProps) {
  const targetId = selectedNodeId || selectedLayerId;
  const isLayer = !!selectedLayerId;
  const isMulti = !targetId && selectedNodeIds.length > 1;
  const { updateNode, updateLayer, moveNode } = useGraphStore();

  const [boxes, setBoxes] = useState<BoxInfo[]>([]);
  const targetRef = useRef<cytoscape.SingularElementReturnValue | null>(null);
  const multiCollectionRef = useRef<cytoscape.CollectionReturnValue | null>(null);
  const multiStartRef = useRef<{ bbox: cytoscape.BoundingBox12; nodes: Record<string, NodeStart> } | null>(null);
  const draggingRef = useRef<{
    handle: Handle;
    startClientX: number;
    startClientY: number;
    startX1: number;
    startY1: number;
    startX2: number;
    startY2: number;
    startCenter: cytoscape.Position;
  } | null>(null);

  const selectedKey = selectedNodeIds.join(',');

  useEffect(() => {
    if (targetId) {
      multiCollectionRef.current = null;
      const target = cy.getElementById(targetId);
      targetRef.current = target.length ? target : null;

      const updateBoxes = () => {
        const t = targetRef.current;
        if (!t || t.length === 0) {
          setBoxes([]);
          return;
        }
        const bb = t.renderedBoundingBox({ includeLabels: false, includeOverlays: false });
        setBoxes(buildBoxes(bb));
      };

      updateBoxes();
      cy.on('pan zoom resize', updateBoxes);
      (target as any).on('position', updateBoxes);
      return () => {
        cy.off('pan zoom resize', updateBoxes);
        (target as any).off('position', updateBoxes);
      };
    }

    if (isMulti) {
      targetRef.current = null;
      const ids = new Set(selectedNodeIds);
      const collection = cy.nodes('.indicator').filter((n) => ids.has(n.id()));
      multiCollectionRef.current = collection;

      const updateBoxes = () => {
        if (collection.length === 0) {
          setBoxes([]);
          return;
        }
        const bb = collection.renderedBoundingBox({ includeLabels: false, includeOverlays: false });
        setBoxes(buildBoxes(bb));
      };

      updateBoxes();
      cy.on('pan zoom resize', updateBoxes);
      collection.forEach((n) => {
        (n as cytoscape.NodeSingular).on('position', updateBoxes);
      });
      return () => {
        cy.off('pan zoom resize', updateBoxes);
        collection.forEach((n) => {
          (n as any).off('position', updateBoxes);
        });
      };
    }

    setBoxes([]);
    targetRef.current = null;
    multiCollectionRef.current = null;
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cy, targetId, isLayer, isMulti, selectedKey, selectedNodeIds]);

  const startMultiResize = (handle: Handle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const collection = multiCollectionRef.current;
    if (!collection || collection.length === 0) return;
    const bbox = collection.boundingBox({ includeLabels: false, includeOverlays: false });
    const nodes: Record<string, NodeStart> = {};
    collection.forEach((n) => {
      const id = n.id();
      const bb = n.boundingBox({ includeLabels: false, includeOverlays: false });
      nodes[id] = { x: n.position().x, y: n.position().y, width: bb.w, height: bb.h };
    });
    multiStartRef.current = { bbox, nodes };
    draggingRef.current = {
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX1: bbox.x1,
      startY1: bbox.y1,
      startX2: bbox.x2,
      startY2: bbox.y2,
      startCenter: { x: (bbox.x1 + bbox.x2) / 2, y: (bbox.y1 + bbox.y2) / 2 },
    };

    const onMouseMove = (ev: MouseEvent) => {
      const drag = draggingRef.current;
      const start = multiStartRef.current;
      if (!drag || !start) return;
      const zoom = cy.zoom();
      const dx = (ev.clientX - drag.startClientX) / zoom;
      const dy = (ev.clientY - drag.startClientY) / zoom;
      const { x1, y1, x2, y2 } = applyHandleDelta(drag.handle, dx, dy, drag.startX1, drag.startY1, drag.startX2, drag.startY2);

      let width = x2 - x1;
      let height = y2 - y1;
      if (width < MIN_WIDTH) width = MIN_WIDTH;
      if (height < MIN_HEIGHT) height = MIN_HEIGHT;

      const startWidth = drag.startX2 - drag.startX1;
      const startHeight = drag.startY2 - drag.startY1;
      const scaleX = startWidth === 0 ? 1 : width / startWidth;
      const scaleY = startHeight === 0 ? 1 : height / startHeight;
      const newX1 = drag.startX1;
      const newY1 = drag.startY1;

      for (const [id, data] of Object.entries(start.nodes)) {
        const n = cy.getElementById(id);
        if (n.length === 0) continue;
        const newX = newX1 + (data.x - start.bbox.x1) * scaleX;
        const newY = newY1 + (data.y - start.bbox.y1) * scaleY;
        const newW = Math.max(MIN_WIDTH, data.width * scaleX);
        const newH = Math.max(MIN_HEIGHT, data.height * scaleY);
        n.style({ width: newW, height: newH });
        n.position({ x: newX, y: newY });
      }
    };

    const onMouseUp = () => {
      const start = multiStartRef.current;
      if (start) {
        for (const id of Object.keys(start.nodes)) {
          const n = cy.getElementById(id);
          if (n.length === 0) continue;
          const width = parseFloat(n.style('width'));
          const height = parseFloat(n.style('height'));
          const pos = n.position();
          updateNode(id, {
            width: Number.isFinite(width) ? width : undefined,
            height: Number.isFinite(height) ? height : undefined,
          });
          moveNode(id, pos.x, pos.y);
        }
      }
      draggingRef.current = null;
      multiStartRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseDown = (handle: Handle) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMulti) {
      startMultiResize(handle, e);
      return;
    }
    if (!targetId) return;
    const target = cy.getElementById(targetId);
    if (!target || target.length === 0) return;
    const bb = target.boundingBox({ includeLabels: false, includeOverlays: false });
    draggingRef.current = {
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX1: bb.x1,
      startY1: bb.y1,
      startX2: bb.x2,
      startY2: bb.y2,
      startCenter: { ...target.position() },
    };

    const onMouseMove = (ev: MouseEvent) => {
      const drag = draggingRef.current;
      if (!drag || !targetId) return;
      const zoom = cy.zoom();
      const dx = (ev.clientX - drag.startClientX) / zoom;
      const dy = (ev.clientY - drag.startClientY) / zoom;

      const { x1, y1, x2, y2 } = applyHandleDelta(drag.handle, dx, dy, drag.startX1, drag.startY1, drag.startX2, drag.startY2);

      let width = x2 - x1;
      let height = y2 - y1;
      if (width < MIN_WIDTH) width = MIN_WIDTH;
      if (height < MIN_HEIGHT) height = MIN_HEIGHT;

      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;

      target.style({ width, height });
      target.position({ x: centerX, y: centerY });
    };

    const onMouseUp = () => {
      const drag = draggingRef.current;
      if (drag && targetId) {
        const target = cy.getElementById(targetId);
        if (target && target.length > 0) {
          const pos = target.position();
          const width = parseFloat(target.style('width')) || drag.startX2 - drag.startX1;
          const height = parseFloat(target.style('height')) || drag.startY2 - drag.startY1;
          if (isLayer) {
            updateLayer(targetId, { width, height, x: pos.x, y: pos.y });
          } else {
            updateNode(targetId, { width, height });
            moveNode(targetId, pos.x, pos.y);
          }
        }
      }
      draggingRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (boxes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {boxes.map((b) => (
        <div
          key={b.handle}
          className="absolute bg-white border border-blue-500 rounded-sm pointer-events-auto resize-handle"
          style={{
            left: b.left,
            top: b.top,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            cursor: b.cursor,
            zIndex: 50,
          }}
          onMouseDown={onMouseDown(b.handle)}
        />
      ))}
    </div>
  );
}
