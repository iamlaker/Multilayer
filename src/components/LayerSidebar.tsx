import { useState, useEffect } from 'react';
import { Eye, EyeOff, Layers, Pencil, Plus, Shapes, Sparkles, Trash2 } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';
import ShapeLibrary from './ShapeLibrary';

type Mode = 'select' | 'add-node' | 'add-edge';

interface LayerSidebarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const LAYOUT_OPTIONS: { value: 'cose' | 'grid' | 'breadthfirst' | 'circle'; label: string }[] = [
  { value: 'cose', label: '力导向' },
  { value: 'grid', label: '网格' },
  { value: 'breadthfirst', label: '层次' },
  { value: 'circle', label: '环形' },
];

export default function LayerSidebar({ mode, setMode }: LayerSidebarProps) {
  const {
    project,
    hiddenLayerIds,
    isEditMode,
    addLayer,
    updateLayer,
    deleteLayer,
    toggleLayerVisibility,
    autoLayoutLayer,
    setEditingLayer,
  } = useGraphStore();
  const [layoutAlgo, setLayoutAlgo] = useState<'cose' | 'grid' | 'breadthfirst' | 'circle'>('cose');
  const [activeTab, setActiveTab] = useState<'layers' | 'shapes'>('layers');

  // Switch to shape library when entering add-node mode
  useEffect(() => {
    if (mode === 'add-node') setActiveTab('shapes');
  }, [mode]);

  return (
    <aside className="w-64 bg-gray-50 border-r flex flex-col">
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium ${
            activeTab === 'layers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Layers size={16} /> 图层
        </button>
        <button
          onClick={() => setActiveTab('shapes')}
          className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium ${
            activeTab === 'shapes'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Shapes size={16} /> 图形库
        </button>
      </div>

      {activeTab === 'layers' ? (
        <>
          <div className="p-3 border-b bg-white flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">图层</h2>
            {isEditMode && (
              <button
                onClick={addLayer}
                className="p-1 rounded hover:bg-gray-100 text-blue-600"
                title="添加图层"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {project.layers.map((layer) => {
              const hidden = hiddenLayerIds.has(layer.id);
              return (
                <div
                  key={layer.id}
                  className={`border rounded-lg p-2 bg-white ${hidden ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: layer.color || '#cbd5e1' }}
                    />
                    <input
                      value={layer.name}
                      onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                      className="flex-1 text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                    />
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-600"
                      title={hidden ? '显示' : '隐藏'}
                    >
                      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {isEditMode && (
                      <>
                        <button
                          onClick={() => setEditingLayer(layer.id)}
                          className="p-1 rounded hover:bg-gray-100 text-blue-600"
                          title="编辑图层样式"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除图层「${layer.name}」？其中的指标和连线也会被删除。`)) {
                              deleteLayer(layer.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-gray-100 text-red-500"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  <input
                    value={layer.description}
                    onChange={(e) => updateLayer(layer.id, { description: e.target.value })}
                    placeholder="图层描述"
                    className="w-full mt-1 text-xs text-gray-500 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                  />
                  <div className="mt-2 flex items-center gap-1">
                    <select
                      value={layoutAlgo}
                      onChange={(e) => setLayoutAlgo(e.target.value as typeof layoutAlgo)}
                      className="text-xs border rounded px-1 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {LAYOUT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => autoLayoutLayer(layer.id, layoutAlgo)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border bg-white text-gray-700 hover:bg-gray-50"
                      title="自动布局"
                    >
                      <Sparkles size={14} />
                      自动布局
                    </button>
                  </div>
                </div>
              );
            })}
            {project.layers.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">暂无图层，点击上方 + 添加</div>
            )}
          </div>
        </>
      ) : (
        <ShapeLibrary mode={mode} setMode={setMode} />
      )}

      <div className="p-3 border-t bg-white text-xs text-gray-500">
        项目：{project.project}
      </div>
    </aside>
  );
}
