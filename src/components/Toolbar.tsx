import { useRef } from 'react';
import { Download, FolderOpen, Layers, MousePointer, PenLine, PlusCircle, Share2 } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';
import { downloadYaml, readFileAsText, parseProjectYaml } from '../utils/yaml';

type Mode = 'select' | 'add-node' | 'add-edge';

interface ToolbarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export default function Toolbar({ mode, setMode }: ToolbarProps) {
  const { project, isEditMode, toggleEditMode, addLayer, loadProject } = useGraphStore();
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
        onClick={() => setMode(active ? 'select' : key)}
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

      <button
        onClick={toggleEditMode}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm border ${
          isEditMode
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title={isEditMode ? '当前为编辑模式' : '当前为预览模式'}
      >
        <PenLine size={16} />
        {isEditMode ? '编辑模式' : '预览模式'}
      </button>

      {isEditMode && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          {modeButton('select', '选择', <MousePointer size={16} />)}
          {modeButton('add-node', '添加指标', <PlusCircle size={16} />)}
          {modeButton('add-edge', '添加连线', <Share2 size={16} />)}
        </>
      )}

      <div className="flex-1" />

      {isEditMode && (
        <button
          onClick={addLayer}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
        >
          <Layers size={16} /> 添加图层
        </button>
      )}
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
    </header>
  );
}
