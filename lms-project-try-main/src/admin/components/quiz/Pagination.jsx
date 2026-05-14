import React from 'react';

function buildPages(current, total, max = 7) {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => pages.add(n));
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
    result.push(sorted[i]);
  }
  return result;
}

export default function Pagination({ pagination, onPageChange }) {
  const { page = 1, pageSize = 20, total = 0, totalPages = 1 } = pagination || {};
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pages = buildPages(page, totalPages);

  return (
    <div className="aqm-pagination">
      <div className="aqm-pagination-info">
        {total === 0 ? 'No items' : `Showing ${start}–${end} of ${total}`}
      </div>
      <div className="aqm-pagination-controls">
        <button
          className="aqm-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p, idx) =>
          p === '…' ? (
            <span key={`gap-${idx}`} className="aqm-pagination-btn" style={{ border: 'none', background: 'transparent', cursor: 'default' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`aqm-pagination-btn ${p === page ? 'is-active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="aqm-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
