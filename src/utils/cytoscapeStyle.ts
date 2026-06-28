import cytoscape from 'cytoscape';

export const CYTOSCAPE_STYLES: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node.layer',
    style: {
      'background-color': 'data(color)',
      'background-opacity': 0.25,
      'border-color': 'data(color)',
      'border-width': '2px',
      'border-opacity': 0.6,
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
      'background-color': '#ffffff',
      'border-color': '#6b7280',
      'border-width': '1px',
      'label': 'data(label)',
      'color': '#1f2937',
      'text-valign': 'center',
      'text-halign': 'center',
      'shape': 'roundrectangle',
      'width': 'label',
      'height': 'label',
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
      'width': '2px',
      'line-color': '#6b7280',
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
];
