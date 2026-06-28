import cytoscape from 'cytoscape';
import { isDrawioShape, renderDrawioShape } from './drawioShapeRenderer';

const DEFAULT_SHAPE_SIZE = 80;

function fontFamily(ele: cytoscape.NodeSingular): string {
  return ele.data('fontFamily') || "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
}

function fontWeight(ele: cytoscape.NodeSingular): string {
  return ele.data('fontWeight') || 'normal';
}

function fontColor(ele: cytoscape.NodeSingular): string {
  return ele.data('fontColor') || '#1f2937';
}

function fontSize(ele: cytoscape.NodeSingular): string {
  const s = ele.data('fontSize');
  return typeof s === 'number' ? `${s}px` : '12px';
}

function nodeWidth(ele: cytoscape.NodeSingular): number | 'label' {
  const w = ele.data('width');
  return typeof w === 'number' && w > 0 ? w : 'label';
}

function nodeHeight(ele: cytoscape.NodeSingular): number | 'label' {
  const h = ele.data('height');
  return typeof h === 'number' && h > 0 ? h : 'label';
}

export const CYTOSCAPE_STYLES: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node.layer',
    style: {
      'background-color': 'data(color)',
      'background-opacity': 0.25,
      'border-color': (ele: cytoscape.NodeSingular) => ele.data('borderColor') || ele.data('color') || '#cbd5e1',
      'border-width': '2px',
      'border-opacity': 0.6,
      'border-style': (ele: cytoscape.NodeSingular) => ele.data('borderStyle') || 'solid',
      'label': 'data(label)',
      'color': (ele: cytoscape.NodeSingular) => ele.data('fontColor') || '#374151',
      'font-size': (ele: cytoscape.NodeSingular) => {
        const s = ele.data('fontSize');
        return typeof s === 'number' ? `${s}px` : '14px';
      },
      'font-family': (ele: cytoscape.NodeSingular) => ele.data('fontFamily') || "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      'font-weight': (ele: cytoscape.NodeSingular) => ele.data('fontWeight') || 'bold',
      'text-valign': 'top',
      'text-halign': 'center',
      'shape': 'roundrectangle',
      'padding': '40px',
      'compound-sizing-wrt-labels': 'exclude',
      'width': (ele: cytoscape.NodeSingular) => {
        const w = ele.data('width');
        return typeof w === 'number' && w > 0 ? w : undefined as any;
      },
      'height': (ele: cytoscape.NodeSingular) => {
        const h = ele.data('height');
        return typeof h === 'number' && h > 0 ? h : undefined as any;
      },
    },
  },
  {
    selector: 'node.indicator',
    style: {
      'background-color': (ele: cytoscape.NodeSingular) => ele.data('backgroundColor') || '#ffffff',
      'border-color': (ele: cytoscape.NodeSingular) => ele.data('borderColor') || '#6b7280',
      'border-style': (ele: cytoscape.NodeSingular) => ele.data('borderStyle') || 'solid',
      'border-width': (ele: cytoscape.NodeSingular) => (isDrawioShape(ele.data('shape')) ? 0 : 1),
      'label': 'data(label)',
      'color': fontColor,
      'font-size': fontSize,
      'font-family': fontFamily,
      'font-weight': (ele: cytoscape.NodeSingular) => fontWeight(ele) as any,
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-overflow-wrap': 'anywhere',
      'text-max-width': '120px',
      'shape': (ele: cytoscape.NodeSingular) => {
        const s = ele.data('shape');
        if (isDrawioShape(s)) return 'rectangle';
        if (s === 'circle') return 'ellipse';
        return s || 'roundrectangle';
      },
      'width': nodeWidth,
      'height': nodeHeight,
      'min-width': '60px',
      'min-height': '32px',
      'background-image': (ele: cytoscape.NodeSingular) => {
        const s = ele.data('shape');
        if (!isDrawioShape(s)) return 'none';
        return renderDrawioShape(
          s,
          ele.data('width') || DEFAULT_SHAPE_SIZE,
          ele.data('height') || DEFAULT_SHAPE_SIZE,
          ele.data('backgroundColor') || '#ffffff',
          ele.data('borderColor') || '#6b7280',
          1,
          ele.data('borderStyle')
        );
      },
      'background-fit': 'none',
      'background-clip': 'none',
      'background-width': '100%',
      'background-height': '100%',
      'padding-left': '16px',
      'padding-right': '16px',
      'padding-top': '8px',
      'padding-bottom': '8px',
      'transition-property': 'background-color, border-width, border-color',
      'transition-duration': 0.15,
    },
  },
  {
    selector: 'node.indicator.overview',
    style: {
      'background-color': 'data(layerColor)',
      'background-opacity': 0.85,
      'border-color': '#ffffff',
      'border-width': '2px',
      'background-image': 'none',
      'shape': (ele: cytoscape.NodeSingular) => {
        const s = ele.data('shape');
        if (s === 'circle') return 'ellipse';
        return s || 'roundrectangle';
      },
      'color': fontColor,
      'font-size': fontSize,
      'font-family': fontFamily,
      'font-weight': (ele: cytoscape.NodeSingular) => fontWeight(ele) as any,
      'text-wrap': 'wrap',
      'text-overflow-wrap': 'anywhere',
      'text-max-width': '120px',
      'width': nodeWidth,
      'height': nodeHeight,
      'min-width': '60px',
      'min-height': '32px',
      'padding-left': '14px',
      'padding-right': '14px',
      'padding-top': '10px',
      'padding-bottom': '10px',
    },
  },
  {
    selector: 'node.indicator.selected',
    style: {
      'border-width': '3px',
      'border-color': '#2563eb',
      'background-color': '#dbeafe',
    },
  },
  {
    selector: 'node.dimmed',
    style: {
      'opacity': 0.15,
    },
  },
  {
    selector: 'edge',
    style: {
      'width': '1px',
      'line-color': (ele: cytoscape.EdgeSingular) => ele.data('lineColor') || '#9ca3af',
      'line-style': (ele: cytoscape.EdgeSingular) => ele.data('lineStyle') || 'solid',
      'opacity': 0.15,
      'curve-style': 'bezier',
      'label': '',
      'font-size': '11px',
      'color': '#1e40af',
      'text-background-color': '#ffffff',
      'text-background-opacity': 1,
      'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle',
      'transition-property': 'line-color, width, opacity',
      'transition-duration': 0.15,
    },
  },
  {
    selector: 'edge.forward',
    style: {
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#6b7280',
    },
  },
  {
    selector: 'edge.backward',
    style: {
      'source-arrow-shape': 'triangle',
      'source-arrow-color': '#6b7280',
    },
  },
  {
    selector: 'edge.bidirectional',
    style: {
      'target-arrow-shape': 'triangle',
      'source-arrow-shape': 'triangle',
      'target-arrow-color': '#6b7280',
      'source-arrow-color': '#6b7280',
    },
  },
  {
    selector: 'edge.highlighted',
    style: {
      'line-color': '#2563eb',
      'width': '3px',
      'opacity': 1,
      'label': 'data(brief)',
      'color': '#1e40af',
      'target-arrow-color': '#2563eb',
      'source-arrow-color': '#2563eb',
      'z-index': 10,
    },
  },
  {
    selector: 'edge.dimmed',
    style: {
      'opacity': 0.08,
    },
  },
  {
    selector: 'node.temp-target',
    style: {
      'background-opacity': 0,
      'border-width': 0,
      'width': 1,
      'height': 1,
      'events': 'no',
    },
  },
  {
    selector: 'edge.temp-edge',
    style: {
      'line-style': 'dashed',
      'line-color': '#6b7280',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#6b7280',
      'width': 2,
    },
  },
];
