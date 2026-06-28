import { useMemo, useState } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { EdgeData, Direction } from '../model/types';

export default function EdgeEditor() {
  const { editingEdgeId, project, updateEdge, deleteEdge, setEditingEdge } = useGraphStore();

  const edge = useMemo<EdgeData | null>(() => {
    if (!editingEdgeId) return null;
    for (const layer of project.layers) {
      const found = layer.edges.find((e) => e.id === editingEdgeId);
      if (found) return found;
    }
    return project.crossEdges.find((e) => e.id === editingEdgeId) ?? null;
  }, [editingEdgeId, project.layers, project.crossEdges]);

  const allNodes = useMemo(
    () => project.layers.flatMap((l) => l.nodes.map((n) => ({ id: n.id, name: n.name, layerName: l.name }))),
    [project.layers]
  );

  const [form, setForm] = useState<Partial<EdgeData>>({});

  if (!edge) return null;

  const current = { ...edge, ...form };

  const handleSave = () => {
    updateEdge(edge.id, form);
    setEditingEdge(null);
    setForm({});
  };

  const handleDelete = () => {
    if (confirm('确定删除该连线？')) {
      deleteEdge(edge.id);
      setEditingEdge(null);
      setForm({});
    }
  };

  return (
    <dialog open className="fixed inset-0 z-50 m-auto p-0 rounded-lg shadow-xl bg-white w-[28rem] max-h-[90vh] overflow-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">编辑连线</h3>
        <button onClick={() => setEditingEdge(null)} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-600">连线 ID</label>
          <input readOnly value={current.id} className="w-full border rounded px-2 py-1 text-sm bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">起点指标</label>
            <select
              value={current.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {allNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.layerName})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">终点指标</label>
            <select
              value={current.target}
              onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {allNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.layerName})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">方向</label>
            <select
              value={current.direction}
              onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as Direction }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="forward">正向（起点 → 终点）</option>
              <option value="backward">反向（起点 ← 终点）</option>
              <option value="bidirectional">双向</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">连线类型</label>
            <input
              value={current.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">简要表述</label>
          <input
            value={current.brief}
            onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">复杂表述</label>
          <textarea
            value={current.detail}
            onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            rows={3}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">关联表格（Markdown 表格）</label>
          <textarea
            value={current.table}
            onChange={(e) => setForm((f) => ({ ...f, table: e.target.value }))}
            rows={4}
            className="w-full border rounded px-2 py-1 text-sm font-mono"
          />
        </div>
      </div>
      <div className="p-4 border-t flex justify-between">
        <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">删除</button>
        <div className="flex gap-2">
          <button onClick={() => setEditingEdge(null)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">取消</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
        </div>
      </div>
    </dialog>
  );
}
