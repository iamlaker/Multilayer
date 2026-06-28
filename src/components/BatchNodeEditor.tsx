import { useState } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { NodeData } from '../model/types';

export default function BatchNodeEditor() {
  const { selectedNodeIds, batchEditingOpen, setBatchEditingOpen, batchUpdateNodes } = useGraphStore();
  const [form, setForm] = useState<Partial<NodeData>>({});

  if (!batchEditingOpen || selectedNodeIds.length === 0) return null;

  const handleSave = () => {
    const patch: Partial<NodeData> = {};
    if (form.shape) patch.shape = form.shape;
    if (form.borderStyle) patch.borderStyle = form.borderStyle;
    if (form.borderColor) patch.borderColor = form.borderColor;
    if (form.backgroundColor) patch.backgroundColor = form.backgroundColor;
    if (form.fontColor) patch.fontColor = form.fontColor;
    if (form.fontSize !== undefined) patch.fontSize = form.fontSize;
    if (form.fontFamily !== undefined) patch.fontFamily = form.fontFamily || undefined;
    if (form.fontWeight !== undefined) patch.fontWeight = form.fontWeight || undefined;
    if (form.width !== undefined) patch.width = form.width;
    if (form.height !== undefined) patch.height = form.height;

    batchUpdateNodes(patch);
    setBatchEditingOpen(false);
    setForm({});
  };

  return (
    <dialog open className="fixed inset-0 z-50 m-auto p-0 rounded-lg shadow-xl bg-white w-96">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">批量编辑指标（{selectedNodeIds.length} 个）</h3>
        <button onClick={() => setBatchEditingOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">形状</label>
            <select
              value={form.shape || ''}
              onChange={(e) => setForm((f) => ({ ...f, shape: e.target.value || undefined }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">保持不变</option>
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
          <div className="flex-1">
            <label className="block text-sm text-gray-600">边框样式</label>
            <select
              value={form.borderStyle || ''}
              onChange={(e) => setForm((f) => ({ ...f, borderStyle: (e.target.value as NodeData['borderStyle']) || undefined }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">保持不变</option>
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">边框颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.borderColor || '#6b7280'}
                onChange={(e) => setForm((f) => ({ ...f, borderColor: e.target.value }))}
                className="w-8 h-8 p-0 border rounded"
              />
              <input
                type="text"
                value={form.borderColor || ''}
                onChange={(e) => setForm((f) => ({ ...f, borderColor: e.target.value }))}
                placeholder="保持不变"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">背景颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.backgroundColor || '#ffffff'}
                onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                className="w-8 h-8 p-0 border rounded"
              />
              <input
                type="text"
                value={form.backgroundColor || ''}
                onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))}
                placeholder="保持不变"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600">字体颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.fontColor || '#1f2937'}
                onChange={(e) => setForm((f) => ({ ...f, fontColor: e.target.value }))}
                className="w-8 h-8 p-0 border rounded"
              />
              <input
                type="text"
                value={form.fontColor || ''}
                onChange={(e) => setForm((f) => ({ ...f, fontColor: e.target.value }))}
                placeholder="保持不变"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">字号</label>
            <input
              type="number"
              value={form.fontSize ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fontSize: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="保持不变"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600">字体</label>
            <select
              value={form.fontFamily || ''}
              onChange={(e) => setForm((f) => ({ ...f, fontFamily: e.target.value || undefined }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">保持不变</option>
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
              value={form.fontWeight || ''}
              onChange={(e) => setForm((f) => ({ ...f, fontWeight: e.target.value || undefined }))}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">保持不变</option>
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
              value={form.width ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, width: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="保持不变"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600">高度</label>
            <input
              type="number"
              value={form.height ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, height: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="保持不变"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="p-4 border-t flex justify-end gap-2">
        <button
          onClick={() => setBatchEditingOpen(false)}
          className="px-3 py-1.5 rounded text-sm border bg-white text-gray-700 hover:bg-gray-50"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
        >
          应用
        </button>
      </div>
    </dialog>
  );
}
