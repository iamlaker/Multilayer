import { useEffect, useRef, useState } from 'react';
import { useGraphStore } from '../store/graphStore';

function markdownTableToHtml(md: string): string {
  const lines = md.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return '';
  const [headerLine, , ...bodyLines] = lines;
  const headers = headerLine.split('|').map((c) => c.trim()).filter(Boolean);
  const rows = bodyLines.map((line) =>
    line.split('|').map((c) => c.trim()).filter(Boolean)
  );
  let html = '<thead><tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr></thead>';
  html += '<tbody>' + rows.map((row) => '<tr>' + row.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
  return html;
}

export default function DetailPopup() {
  const { detailPopup, project, closeDetailPopup, updateEdge } = useGraphStore();
  const ref = useRef<HTMLDivElement>(null);

  const edge = detailPopup
    ? project.layers
        .flatMap((l) => l.edges)
        .concat(project.crossEdges)
        .find((e) => e.id === detailPopup.edgeId)
    : null;

  const [form, setForm] = useState({ brief: '', detail: '', table: '' });

  useEffect(() => {
    if (edge) {
      setForm({ brief: edge.brief, detail: edge.detail, table: edge.table });
    }
  }, [edge, edge?.id, edge?.brief, edge?.detail, edge?.table]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeDetailPopup();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [closeDetailPopup]);

  const handleChange = (patch: Partial<typeof form>) => {
    if (!edge) return;
    const next = { ...form, ...patch };
    setForm(next);
    updateEdge(edge.id, next);
  };

  if (!detailPopup || !edge) return null;

  const tableHtml = markdownTableToHtml(form.table);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border shadow-xl rounded-lg p-4 w-80 max-w-sm max-h-[80vh] overflow-auto"
      style={{ left: detailPopup.x + 12, top: detailPopup.y + 12 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-sm">关联详情</h4>
        <button onClick={closeDetailPopup} className="text-gray-500 hover:text-gray-700 text-xs">✕</button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">简要表述</label>
          <input
            value={form.brief}
            onChange={(e) => handleChange({ brief: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">复杂表述</label>
          <textarea
            value={form.detail}
            onChange={(e) => handleChange({ detail: e.target.value })}
            rows={3}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">相关表格（Markdown 表格）</label>
          <textarea
            value={form.table}
            onChange={(e) => handleChange({ table: e.target.value })}
            rows={4}
            className="w-full border rounded px-2 py-1 text-sm font-mono"
          />
        </div>
        {tableHtml && (
          <div className="overflow-auto">
            <table
              className="w-full text-xs border-collapse border border-gray-300"
              dangerouslySetInnerHTML={{ __html: tableHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
