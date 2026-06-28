import { useGraphStore } from '../store/graphStore';

type Mode = 'select' | 'add-node' | 'add-edge';

interface ShapeLibraryProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

interface ShapeItem {
  value: string;
  label: string;
}

interface ShapeGroup {
  name: string;
  shapes: ShapeItem[];
}

const SHAPE_GROUPS: ShapeGroup[] = [
  {
    name: '基础图形',
    shapes: [
      { value: 'roundrectangle', label: '圆角矩形' },
      { value: 'rectangle', label: '矩形' },
      { value: 'ellipse', label: '椭圆' },
      { value: 'circle', label: '圆形' },
      { value: 'triangle', label: '三角形' },
      { value: 'diamond', label: '菱形' },
      { value: 'pentagon', label: '五边形' },
      { value: 'hexagon', label: '六边形' },
      { value: 'heptagon', label: '七边形' },
      { value: 'octagon', label: '八边形' },
      { value: 'star', label: '星形' },
      { value: 'vee', label: 'V 形' },
      { value: 'rhomboid', label: '平行四边形' },
    ],
  },
  {
    name: '流程图',
    shapes: [
      { value: 'rectangle', label: '流程' },
      { value: 'roundrectangle', label: '开始/结束' },
      { value: 'diamond', label: '判断' },
      { value: 'hexagon', label: '准备' },
      { value: 'rhomboid', label: '数据' },
      { value: 'circle', label: '连接符' },
      { value: 'triangle', label: '合并' },
    ],
  },
];

export default function ShapeLibrary({ mode, setMode }: ShapeLibraryProps) {
  const { selectedShape, setSelectedShape } = useGraphStore();

  const selectShape = (shape: string) => {
    setSelectedShape(shape);
    if (mode !== 'add-node') {
      setMode('add-node');
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col">
      <div className="p-3 border-b bg-white">
        <h2 className="font-semibold text-gray-800">图形库</h2>
        <p className="text-xs text-gray-500 mt-1">拖拽形状到画布图层中添加</p>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-4">
        {SHAPE_GROUPS.map((group) => (
          <div key={group.name}>
            <h3 className="text-xs font-medium text-gray-500 mb-2 px-1">{group.name}</h3>
            <div className="grid grid-cols-4 gap-2">
              {group.shapes.map((shape) => {
                const active = selectedShape === shape.value;
                return (
                  <button
                    key={`${group.name}-${shape.value}-${shape.label}`}
                    draggable
                    onClick={() => selectShape(shape.value)}
                    onDragStart={(e) => {
                      setSelectedShape(shape.value);
                      e.dataTransfer.setData('application/shape', shape.value);
                      e.dataTransfer.setData('text/plain', shape.value);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    title={shape.label}
                    className={`flex flex-col items-center justify-center p-2 rounded border transition cursor-grab active:cursor-grabbing ${
                      active
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ShapeIcon shape={shape.value} active={active} />
                    <span className="text-[10px] mt-1 truncate w-full text-center">{shape.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShapeIcon({ shape, active }: { shape: string; active: boolean }) {
  const stroke = active ? '#2563eb' : '#4b5563';
  const fill = active ? '#dbeafe' : '#ffffff';

  switch (shape) {
    case 'roundrectangle':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <rect x="2" y="3" width="20" height="14" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'rectangle':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <rect x="2" y="4" width="20" height="12" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'ellipse':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <ellipse cx="12" cy="10" rx="10" ry="7" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'circle':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <circle cx="12" cy="10" r="8" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'triangle':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="12,3 21,17 3,17" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'diamond':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="12,2 22,10 12,18 2,10" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'pentagon':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="12,2 22,8 19,18 5,18 2,8" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="12,2 21,6 21,14 12,18 3,14 3,6" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'heptagon':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="12,2 20,5 22,12 17,18 7,18 2,12 4,5" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'octagon':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="8,2 16,2 22,8 22,14 16,18 8,18 2,14 2,8" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'star':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon
            points="12,2 14.5,8 21,8.5 16,12.5 17.5,18 12,15 6.5,18 8,12.5 3,8.5 9.5,8"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'vee':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="4,4 12,16 20,4" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'rhomboid':
    case 'parallelogram':
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <polygon points="6,4 22,4 18,16 2,16" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg width="24" height="20" viewBox="0 0 24 20">
          <rect x="4" y="4" width="16" height="12" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
  }
}
