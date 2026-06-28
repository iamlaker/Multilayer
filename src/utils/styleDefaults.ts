// Low-saturation default color palettes.

export const NODE_BACKGROUND_PALETTE = [
  '#f8fafc', // slate-50
  '#f0f9ff', // sky-50
  '#f5f3ff', // violet-50
  '#fefce8', // yellow-50
  '#fff1f2', // rose-50
  '#f0fdf4', // green-50
];

export const NODE_BORDER_PALETTE = [
  '#94a3b8', // slate-400
  '#7dd3fc', // sky-300
  '#a78bfa', // violet-400
  '#facc15', // yellow-400
  '#fb7185', // rose-400
  '#86efac', // green-300
];

export const LAYER_COLORS = [
  '#dbeafe',
  '#dcfce7',
  '#fef3c7',
  '#f3e8ff',
  '#ffe4e6',
  '#ccfbf1',
  '#f1f5f9',
];

export const LAYER_BORDER_COLORS = [
  '#93c5fd',
  '#86efac',
  '#fde047',
  '#d8b4fe',
  '#fda4af',
  '#5eead4',
  '#cbd5e1',
];

export function pickByIndex<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}
