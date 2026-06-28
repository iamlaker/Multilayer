import { useMemo, useState } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { LayerData } from '../model/types';

export default function LayerEditor() {
  const { editingLayerId, project, updateLayer, deleteLayer, setEditingLayer } = useGraphStore();

  const layer = useMemo(() => {
    if (!editingLayerId) return null;
    return project.layers.find((l) => l.id === editingLayerId) ?? null;
  }, [editingLayerId, project.layers]);

  const [form, setForm] = useState<Partial<LayerData>>({});

  if (!layer) return null;

  const current = { ...layer, ...form };

  const handleSave = () => {
    updateLayer(layer.id, form);
    setEditingLayer(null);
    setForm({});
  };

  const handleDelete = () => {
    if (confirm(`确定删除图层「${layer.name}」？其中的指标和连线也会被删除。`)) {
      deleteLayer(layer.id);
      setEditingLayer(null);
      setForm({});
    }
  };

  return (
    <dialog open className="fixed inset-0 z-50 m-auto p-0 rounded-lg shadow-xl bg-white w-96">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">编辑图层</h3>
        <button onClick={() => setEditingLayer(null)} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-600">图层 ID</label>
          <input readOnly value={current.id} className="w-full border rounded px-2 py-1 text-sm bg-gray-100" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">名称</label>
          <input
            value={current.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">描述</label>
          <input
            value={current.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">背景颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={current.color || '#dbeafe'}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="w-8 h-8 p-0 border rounded"
            />
            <input
              type="text"
              value={current.color || ''}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              placeholder="留空则默认"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">边框样式</label>
            <select
              value={current.borderStyle || 'solid'}
              onChange={(e) => setForm((f) => ({ ...f, borderStyle: e.target.value as LayerData['borderStyle'] }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">边框颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={current.borderColor || current.color || '#dbeafe'}
                onChange={(e) => setForm((f) => ({ ...f, borderColor: e.target.value }))}
                className="w-8 h-8 p-0 border rounded"
              />
              <input
                type="text"
                value={current.borderColor || ''}
                onChange={(e) => setForm((f) => ({ ...f, borderColor: e.target.value }))}
                placeholder="默认"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">X 坐标</label>
            <input
              type="number"
              value={current.x ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, x: Number(e.target.value) }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">Y 坐标</label>
            <input
              type="number"
              value={current.y ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, y: Number(e.target.value) }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="p-4 border-t flex justify-between">
        <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">删除</button>
        <div className="flex gap-2">
          <button onClick={() => setEditingLayer(null)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">取消</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
        </div>
      </div>
    </dialog>
  );
}
