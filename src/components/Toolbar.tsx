import { useRef } from 'react';
import { Download, FileUp, FolderOpen, Grid3x3, Layers, MousePointer, Network, PenLine, PlusCircle, Redo2, Search, Share2, Undo2 } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';
import { downloadYaml } from '../utils/yaml';
import { importProjectFromFile, importLayersFromFile } from '../utils/importers/importProject';

type Mode = 'select' | 'add-node' | 'add-edge';

interface ToolbarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export default function Toolbar({ mode, setMode }: ToolbarProps) {
  const {
    project,
    isEditMode,
    viewMode,
    searchQuery,
    canUndo,
    canRedo,
    toggleEditMode,
    toggleViewMode,
    addLayer,
    loadProject,
    mergeProject,
    setSearchQuery,
    undo,
    redo,
  } = useGraphStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<'replace' | 'append'>('replace');

  const handleExport = () => {
    downloadYaml(project, `${project.project || 'project'}.yaml`);
  };

  const triggerImport = (mode: 'replace' | 'append') => {
    importModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (importModeRef.current === 'replace') {
        const parsed = await importProjectFromFile(file);
        loadProject(parsed);
      } else {
        const parsed = await importLayersFromFile(file, project);
        mergeProject(parsed);
      }
      setMode('select');
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

      <button
        onClick={toggleViewMode}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
        title={viewMode === 'layered' ? '切换为连线概览' : '切换为分层视图'}
      >
        {viewMode === 'layered' ? <Network size={16} /> : <Grid3x3 size={16} />}
        {viewMode === 'layered' ? '连线概览' : '分层视图'}
      </button>

      {isEditMode && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          {modeButton('select', '选择', <MousePointer size={16} />)}
          {modeButton('add-node', '添加指标', <PlusCircle size={16} />)}
          {modeButton('add-edge', '添加连线', <Share2 size={16} />)}
        </>
      )}

      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm border ${
          canUndo ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title="撤销 (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm border ${
          canRedo ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title="重做 (Ctrl+Y)"
      >
        <Redo2 size={16} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索指标..."
          className="w-48 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {isEditMode && (
        <button
          onClick={addLayer}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
        >
          <Layers size={16} /> 添加图层
        </button>
      )}
      <button
        onClick={() => triggerImport('append')}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
      >
        <FolderOpen size={16} /> 导入图层
      </button>
      <button
        onClick={() => triggerImport('replace')}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
      >
        <FileUp size={16} /> 导入新文件
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
      >
        <Download size={16} /> 导出 YAML
      </button>

      <input ref={fileInputRef} type="file" accept=".yaml,.yml,.json,.drawio,.xml,.xmind,.md,.mmd,.pos,.posm" className="hidden" onChange={handleFileChange} />
    </header>
  );
}
