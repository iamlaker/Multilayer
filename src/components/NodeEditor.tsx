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
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">类型</label>
            <input
              value={current.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">形状</label>
            <select
              value={current.shape || 'roundrectangle'}
              onChange={(e) => setForm((f) => ({ ...f, shape: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="roundrectangle">圆角矩形</option>
              <option value="rectangle">矩形</option>
              <option value="ellipse">椭圆</option>
              <option value="circle">圆形</option>
              <option value="triangle">三角形</option>
              <option value="diamond">菱形</option>
              <option value="pentagon">五边形</option>
              <option value="hexagon">六边形</option>
              <option value="heptagon">七边形</option>
              <option value="octagon">八边形</option>
              <option value="star">星形</option>
              <option value="vee">V 形</option>
              <option value="rhomboid">平行四边形</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">边框样式</label>
            <select
              value={current.borderStyle || 'solid'}
              onChange={(e) => setForm((f) => ({ ...f, borderStyle: e.target.value as NodeData['borderStyle'] }))}
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
                value={current.borderColor || '#6b7280'}
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
        <div>
          <label className="block text-sm text-gray-600">背景颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={current.backgroundColor || '#ffffff'}
              onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
              className="w-8 h-8 p-0 border rounded"
            />
            <input
              type="text"
              value={current.backgroundColor || ''}
              onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
              placeholder="留空则默认白色"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600">字体颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={current.fontColor || '#1f2937'}
                onChange={(e) => setForm((f) => ({ ...f, fontColor: e.target.value }))}
                className="w-8 h-8 p-0 border rounded"
              />
              <input
                type="text"
                value={current.fontColor || ''}
                onChange={(e) => setForm((f) => ({ ...f, fontColor: e.target.value }))}
                placeholder="默认"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">字号</label>
            <input
              type="number"
              value={current.fontSize ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fontSize: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="默认 12"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600">字体</label>
            <select
              value={current.fontFamily || ''}
              onChange={(e) => setForm((f) => ({ ...f, fontFamily: e.target.value || undefined }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">默认</option>
              <option value="system-ui">系统默认</option>
              <option value="SimSun, serif">宋体</option>
              <option value="Microsoft YaHei, sans-serif">微软雅黑</option>
              <option value="PingFang SC, sans-serif">苹方</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">字重</label>
            <select
              value={current.fontWeight || ''}
              onChange={(e) => setForm((f) => ({ ...f, fontWeight: e.target.value || undefined }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">默认</option>
              <option value="normal">常规</option>
              <option value="bold">加粗</option>
              <option value="lighter">细体</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">宽度</label>
            <input
              type="number"
              value={current.width ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, width: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="自动"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">高度</label>
            <input
              type="number"
              value={current.height ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, height: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="自动"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">简要表述</label>
          <input
            value={current.brief || ''}
            onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">复杂表述</label>
          <textarea
            value={current.detail || ''}
            onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            rows={3}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">关联表格（Markdown 表格）</label>
          <textarea
            value={current.table || ''}
            onChange={(e) => setForm((f) => ({ ...f, table: e.target.value }))}
            rows={4}
            className="w-full border rounded px-2 py-1 text-sm font-mono"
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
