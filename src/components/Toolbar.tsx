import { useRef } from 'react';
import { Download, FolderOpen, Layers, MousePointer, PlusCircle, Share2 } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';
import { downloadYaml, readFileAsText, parseProjectYaml } from '../utils/yaml';

type Mode = 'select' | 'add-node' | 'add-edge';

interface ToolbarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  edgeSource: string | null;
  setEdgeSource: (id: string | null) => void;
}

export default function Toolbar({ mode, setMode, edgeSource, setEdgeSource }: ToolbarProps) {
  const { project, addLayer, loadProject } = useGraphStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadYaml(project, `${project.project || 'project'}.yaml`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = parseProjectYaml(text);
      loadProject(parsed);
    } catch (err) {
      alert('导入失败：' + (err instanceof Error ? err.message : String(err)));
    }
    e.target.value = '';
  };

  const modeButton = (key: Mode, label: string, icon: React.ReactNode) => {
    const active = mode === key;
    return (
      <button
        key={key}
        onClick={() => {
          setMode(active ? 'select' : key);
          setEdgeSource(null);
        }}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm border ${
          active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <header className="h-14 bg-white border-b flex items-center px-4 gap-3">
      <div className="font-bold text-gray-800 mr-4">2D×N 知识图谱</div>
      <div className="flex gap-2">
        {modeButton('select', '选择', <MousePointer size={16} />)}
        {modeButton('add-node', '添加指标', <PlusCircle size={16} />)}
        {modeButton('add-edge', '添加连线', <Share2 size={16} />)}
      </div>
      <div className="flex-1" />
      <button
        onClick={addLayer}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
      >
        <Layers size={16} /> 添加图层
      </button>
      <button
        onClick={handleImportClick}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
      >
        <FolderOpen size={16} /> 导入 YAML
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
      >
        <Download size={16} /> 导出 YAML
      </button>
      <input ref={fileInputRef} type="file" accept=".yaml,.yml,.json" className="hidden" onChange={handleFileChange} />
      {mode === 'add-edge' && edgeSource && (
        <span className="text-xs text-blue-600">请选择终点指标</span>
      )}
    </header>
  );
}
