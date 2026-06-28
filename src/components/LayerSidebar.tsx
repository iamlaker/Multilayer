import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';

export default function LayerSidebar() {
  const { project, hiddenLayerIds, addLayer, updateLayer, deleteLayer, toggleLayerVisibility } = useGraphStore();

  return (
    <aside className="w-64 bg-gray-50 border-r flex flex-col">
      <div className="p-3 border-b bg-white flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">图层</h2>
        <button
          onClick={addLayer}
          className="p-1 rounded hover:bg-gray-100 text-blue-600"
          title="添加图层"
        >
          <Plus size={18} />
        </button>
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
              </div>
              <input
                value={layer.description}
                onChange={(e) => updateLayer(layer.id, { description: e.target.value })}
                placeholder="图层描述"
                className="w-full mt-1 text-xs text-gray-500 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
              />
            </div>
          );
        })}
        {project.layers.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-4">暂无图层，点击上方 + 添加</div>
        )}
      </div>
      <div className="p-3 border-t bg-white text-xs text-gray-500">
        项目：{project.project}
      </div>
    </aside>
  );
}
