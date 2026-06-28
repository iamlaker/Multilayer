import { useEffect, useRef } from 'react';
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
  const { detailPopup, project, closeDetailPopup } = useGraphStore();
  const ref = useRef<HTMLDivElement>(null);

  const edge = detailPopup
    ? project.layers
        .flatMap((l) => l.edges)
        .concat(project.crossEdges)
        .find((e) => e.id === detailPopup.edgeId)
    : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeDetailPopup();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [closeDetailPopup]);

  if (!detailPopup || !edge) return null;

  const tableHtml = markdownTableToHtml(edge.table);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border shadow-xl rounded-lg p-4 w-80 max-w-sm"
      style={{ left: detailPopup.x + 12, top: detailPopup.y + 12 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-sm">{edge.brief || '关联详情'}</h4>
        <button onClick={closeDetailPopup} className="text-gray-500 hover:text-gray-700 text-xs">✕</button>
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{edge.detail}</div>
      {tableHtml && (
        <div className="overflow-auto">
          <table
            className="w-full text-xs border-collapse border border-gray-300"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
          />
        </div>
      )}
    </div>
  );
}
