import { useMemo, useState } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { NodeData } from '../model/types';

export default function NodeEditor() {
  const { editingNodeId, project, updateNode, deleteNode, setEditingNode } = useGraphStore();

  const node = useMemo(() => {
    if (!editingNodeId) return null;
    for (const layer of project.layers) {
      const found = layer.nodes.find((n) => n.id === editingNodeId);
      if (found) return found;
    }
    return null;
  }, [editingNodeId, project.layers]);

  const [form, setForm] = useState<Partial<NodeData>>({});

  if (!node) return null;

  const current = { ...node, ...form };

  const handleSave = () => {
    updateNode(node.id, form);
    setEditingNode(null);
    setForm({});
  };

  const handleDelete = () => {
    if (confirm('确定删除该指标节点？相关连线也会被删除。')) {
      deleteNode(node.id);
      setEditingNode(null);
      setForm({});
    }
  };

  return (
    <dialog open className="fixed inset-0 z-50 m-auto p-0 rounded-lg shadow-xl bg-white w-96">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">编辑指标</h3>
        <button onClick={() => setEditingNode(null)} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-600">指标 ID</label>
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
          <label className="block text-sm text-gray-600">类型</label>
          <input
            value={current.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">相对 X</label>
            <input
              type="number"
              value={current.x}
              onChange={(e) => setForm((f) => ({ ...f, x: Number(e.target.value) }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">相对 Y</label>
            <input
              type="number"
              value={current.y}
              onChange={(e) => setForm((f) => ({ ...f, y: Number(e.target.value) }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="p-4 border-t flex justify-between">
        <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">删除</button>
        <div className="flex gap-2">
          <button onClick={() => setEditingNode(null)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">取消</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
        </div>
      </div>
    </dialog>
  );
}
