import React, { useEffect, useState } from 'react';
import { adminQuestionService } from '../../services/adminQuestionService';
import Pagination from './Pagination';

const TYPE_LABELS = {
  mcq: 'MCQ',
  multi_choice: 'Multi',
  true_false: 'T/F',
  fill_blank: 'Fill',
  code_image: 'Code',
};

export default function QuestionPickerModal({
  categories = [],
  excludeIds = [],
  excludeQuizId = null,
  onClose,
  onConfirm,
  submitting,
}) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [filters, setFilters] = useState({
    q: '',
    type: '',
    categoryId: '',
    difficulty: '',
  });

  function load(page = pagination.page) {
    setLoading(true);
    setError('');
    const params = {
      page,
      pageSize: pagination.pageSize,
      sort: 'updated_at:desc',
      status: 'active',
    };
    if (filters.q) params.q = filters.q;
    if (filters.type) params.type = filters.type;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (excludeQuizId) params.excludeQuizId = excludeQuizId;

    adminQuestionService
      .list(params)
      .then((res) => {
        setItems(res.data);
        setPagination(res.pagination);
      })
      .catch((e) => setError(e.message || 'Failed to load questions'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-load on filter change with debounce on q
  useEffect(() => {
    const t = setTimeout(() => load(1), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.type, filters.categoryId, filters.difficulty]);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(
      [...selectedIds].map((id) => {
        const q = items.find((item) => item.id === id);
        if (!q) return { id };
        return {
          id,
          prompt: q.prompt,
          type: q.type,
          points: q.points ?? 1,
          options: q.options || [],
          acceptedAnswers: q.acceptedAnswers || [],
          answerValidationMode: q.answerValidationMode || 'strict',
          codeImageUrl: q.codeImageUrl || '',
        };
      })
    );
  }

  return (
    <div className="aqm-modal-overlay" onClick={onClose}>
      <div className="aqm-modal aqm-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="aqm-modal-head">
          <h3>Import existing questions</h3>
          <button className="aqm-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="aqm-modal-body">
          <div className="aqm-toolbar" style={{ marginBottom: 14, padding: 10 }}>
            <div className="aqm-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search questions…"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              />
            </div>
            <select
              className="aqm-filter"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">All format</option>
              <option value="mcq">MCQ</option>
              <option value="multi_choice">Multi-choice</option>
              <option value="true_false">True/False</option>
              <option value="fill_blank">Fill-in</option>
              <option value="code_image">Code image</option>
            </select>
            <select
              className="aqm-filter"
              value={filters.categoryId}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="aqm-filter"
              value={filters.difficulty}
              onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
            >
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {error && <p className="aqm-error" style={{ marginBottom: 12 }}>{error}</p>}

          {loading ? (
            <div className="aqm-table-loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="aqm-table-empty">
              <h4>No questions found</h4>
              <p>Try adjusting filters, or create new questions from the Questions tab.</p>
            </div>
          ) : (
            <div className="aqm-picker-list">
              {items.map((q) => {
                const already = excludeIds.includes(q.id);
                const selected = selectedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={`aqm-picker-row ${selected ? 'is-selected' : ''}`}
                    style={already ? { opacity: 0.45, pointerEvents: 'none' } : null}
                    onClick={() => !already && toggle(q.id)}
                  >
                    <span className="aqm-picker-check">
                      {selected ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : null}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="aqm-picker-questionline">{q.prompt}</div>
                      <div className="aqm-picker-meta">
                        <span className={`aqm-badge aqm-badge--type-${q.type}`}>{TYPE_LABELS[q.type] || q.type}</span>
                        {q.categoryName && <span className="aqm-badge aqm-badge--neutral">{q.categoryName}</span>}
                        <span className={`aqm-badge aqm-badge--diff-${q.difficulty}`}>{q.difficulty}</span>
                        <span className="aqm-badge aqm-badge--neutral">{q.points} pt</span>
                        {already && <span className="aqm-badge aqm-badge--neutral">Already added</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <Pagination pagination={pagination} onPageChange={(p) => load(p)} />
          </div>
        </div>
        <div className="aqm-modal-foot">
          <span className="aqm-picker-foot-info">
            {selectedIds.size} selected
          </span>
          <button className="aqm-btn aqm-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="aqm-btn aqm-btn--primary"
            onClick={handleConfirm}
            disabled={submitting || selectedIds.size === 0}
          >
            {submitting ? 'Adding…' : `Add ${selectedIds.size} question${selectedIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
