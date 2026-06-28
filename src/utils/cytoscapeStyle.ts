import cytoscape from 'cytoscape';
import { isDrawioShape, renderDrawioShape } from './drawioShapeRenderer';

const DEFAULT_SHAPE_SIZE = 80;

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
      'color': '#374151',
      'text-valign': 'top',
      'text-halign': 'center',
      'shape': 'roundrectangle',
      'padding': '40px',
      'compound-sizing-wrt-labels': 'include',
      'font-size': '14px',
      'font-weight': 'bold',
    },
  },
  {
    selector: 'node.indicator',
    style: {
      'background-color': (ele: cytoscape.NodeSingular) => ele.data('backgroundColor') || '#ffffff',
      'border-color': (ele: cytoscape.NodeSingular) => ele.data('borderColor') || '#6b7280',
      'border-style': (ele: cytoscape.NodeSingular) => ele.data('borderStyle') || 'solid',
      'label': 'data(label)',
      'color': '#1f2937',
      'text-valign': 'center',
      'text-halign': 'center',
      'shape': (ele: cytoscape.NodeSingular) => {
        const s = ele.data('shape');
        if (isDrawioShape(s)) return 'rectangle';
        if (s === 'circle') return 'ellipse';
        return s || 'roundrectangle';
      },
      'width': (ele: cytoscape.NodeSingular) => {
        const w = ele.data('width');
        return typeof w === 'number' && w > 0 ? w : DEFAULT_SHAPE_SIZE;
      },
      'height': (ele: cytoscape.NodeSingular) => {
        const h = ele.data('height');
        return typeof h === 'number' && h > 0 ? h : DEFAULT_SHAPE_SIZE;
      },
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
      'background-fit': 'contain',
      'background-clip': 'none',
      'border-width': (ele: cytoscape.NodeSingular) => (isDrawioShape(ele.data('shape')) ? 0 : 1),
      'padding-left': '12px',
      'padding-right': '12px',
      'padding-top': '8px',
      'padding-bottom': '8px',
      'font-size': '13px',
      'text-wrap': 'wrap',
      'text-max-width': '140px',
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
      'color': '#1f2937',
      'font-weight': 'bold',
      'font-size': '12px',
      'text-max-width': '160px',
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
