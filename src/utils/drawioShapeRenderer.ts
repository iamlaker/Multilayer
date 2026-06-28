import mx from './mxgraph';
import basicXml from '../../basic.xml?raw';
import flowchartXml from '../../flowchart.xml?raw';

const {
  mxUtils,
  mxConstants,
  mxRectangle,
  mxShape,
  mxSvgCanvas2D,
  mxCellRenderer,
} = mx;

const STENCILS = new Map<string, InstanceType<typeof mx.mxStencil>>();

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function loadStencilLibrary(xmlText: string) {
  const doc = mxUtils.parseXml(xmlText);
  const shapes = doc.documentElement.getElementsByTagName('shape');
  for (let i = 0; i < shapes.length; i++) {
    const node = shapes[i];
    const name = node.getAttribute('name');
    if (!name) continue;
    const key = normalizeName(name);
    // Always overwrite with the last definition for a given normalized name.
    STENCILS.set(key, new mx.mxStencil(node));
  }
}

loadStencilLibrary(basicXml);
loadStencilLibrary(flowchartXml);

type ShapeDef =
  | { kind: 'builtin'; name: string }
  | { kind: 'stencil'; name: string }
  | { kind: 'native'; name: string };

const SHAPE_DEFS: Record<string, ShapeDef> = {
  rectangle: { kind: 'builtin', name: 'rectangle' },
  roundrectangle: { kind: 'builtin', name: 'rectangle' },
  ellipse: { kind: 'builtin', name: 'ellipse' },
  circle: { kind: 'builtin', name: 'ellipse' },
  triangle: { kind: 'builtin', name: 'triangle' },
  diamond: { kind: 'builtin', name: 'rhombus' },
  pentagon: { kind: 'stencil', name: 'pentagon' },
  hexagon: { kind: 'builtin', name: 'hexagon' },
  heptagon: { kind: 'native', name: 'heptagon' },
  octagon: { kind: 'stencil', name: 'octagon' },
  star: { kind: 'stencil', name: 'star' },
  vee: { kind: 'native', name: 'vee' },
  rhomboid: { kind: 'stencil', name: 'data' },
  // aliases
  parallelogram: { kind: 'stencil', name: 'data' },
};

export const DRAWIO_SHAPE_KEYS = Object.keys(SHAPE_DEFS);

const SVG_CACHE = new Map<string, string>();

function dashPatternToArray(pattern: string | undefined): number[] | null {
  if (!pattern) return null;
  return pattern.split(/[\s,]+/).map((v) => parseFloat(v)).filter((v) => !isNaN(v));
}

function buildSvg(
  def: ShapeDef,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
  dashed = false,
  dashPattern?: string
): string {
  const bounds = new mxRectangle(0, 0, width, height);
  let shape: InstanceType<typeof mxShape>;

  if (def.kind === 'builtin') {
    const ctor = (mxCellRenderer as any).defaultShapes[def.name];
    if (!ctor) {
      throw new Error(`Unknown built-in draw.io shape: ${def.name}`);
    }
    shape = new ctor();
    shape.bounds = bounds;
    shape.fill = fill;
    shape.stroke = stroke;
    shape.strokewidth = strokeWidth;
  } else {
    const stencil = STENCILS.get(def.name);
    if (!stencil) {
      throw new Error(`Unknown draw.io stencil: ${def.name}`);
    }
    shape = new mxShape(stencil);
    shape.bounds = bounds;
    shape.fill = fill;
    shape.stroke = stroke;
    shape.strokewidth = strokeWidth;
  }

  shape.dialect = mxConstants.DIALECT_SVG;
  shape.scale = 1;
  shape.isDashed = dashed;
  shape.style = {};

  if (def.name === 'rectangle') {
    (shape as any).isRounded = true;
    (shape.style as any)[mxConstants.STYLE_ARCSIZE] = 20;
  }

  const svgDoc = mxUtils.createXmlDocument();
  const root = svgDoc.createElementNS(mxConstants.NS_SVG, 'svg');
  root.setAttribute('width', String(width));
  root.setAttribute('height', String(height));
  root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  root.setAttribute('xmlns', mxConstants.NS_SVG);

  const group = svgDoc.createElementNS(mxConstants.NS_SVG, 'g');
  root.appendChild(group);
  (shape as any).node = group;

  const canvas = new mxSvgCanvas2D(group, false);
  canvas.setStrokeWidth(strokeWidth);
  canvas.setFillColor(fill);
  canvas.setStrokeColor(stroke);

  if (dashed) {
    const pattern = dashPatternToArray(dashPattern);
    if (pattern && pattern.length > 0) {
      canvas.setDashPattern(pattern.join(' '));
    }
    canvas.setDashed(true, true);
  }

  shape.paint(canvas);

  return mxUtils.getXml(root as any);
}

export function renderDrawioShape(
  shape: string,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  strokeWidth = 1,
  borderStyle?: string
): string {
  const def = SHAPE_DEFS[shape];
  if (!def) return '';
  if (def.kind === 'native') return '';

  const dashed = borderStyle === 'dashed' || borderStyle === 'dotted';
  const dashPattern = borderStyle === 'dotted' ? '1 3' : undefined;
  const cacheKey = `${shape}|${width}|${height}|${fill}|${stroke}|${strokeWidth}|${borderStyle ?? 'solid'}`;

  let dataUri = SVG_CACHE.get(cacheKey);
  if (dataUri) return dataUri;

  const svg = buildSvg(def, width, height, fill, stroke, strokeWidth, dashed, dashPattern);
  dataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  SVG_CACHE.set(cacheKey, dataUri);
  return dataUri;
}

export function isDrawioShape(shape: string | undefined): boolean {
  if (!shape) return false;
  const def = SHAPE_DEFS[shape];
  return !!def && def.kind !== 'native';
}
