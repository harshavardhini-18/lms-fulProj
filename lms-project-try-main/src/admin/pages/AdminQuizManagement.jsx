import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminQuizService } from '../services/adminQuizService';
import { adminQuestionService } from '../services/adminQuestionService';
import { adminQuizCategoryService } from '../services/adminQuizCategoryService';
import Toast from '../components/common/Toast';
import Pagination from '../components/quiz/Pagination';
import QuestionEditorModal from '../components/quiz/QuestionEditorModal';
import CategoryEditorModal from '../components/quiz/CategoryEditorModal';
import ConfirmDialog from '../components/quiz/ConfirmDialog';
import QuizPreviewModal from '../components/quiz/QuizPreviewModal';
import QuizAnswerKeyModal from '../components/quiz/QuizAnswerKeyModal';
import './AdminQuizManagement.css';

const TAB_QUIZZES = 'quizzes';
const TAB_QUESTIONS = 'questions';
const TAB_CATEGORIES = 'categories';

const TYPE_LABELS = {
  mcq: 'MCQ',
  multi_choice: 'Multi-choice',
  true_false: 'True / False',
  fill_blank: 'Fill-in',
  code_image: 'Code image',
};

function normalizeQuizStatus(status) {
  if (status === 'active') return 'published';
  if (status === 'draft' || status === 'published' || status === 'archived') return status;
  return 'draft';
}

function quizStatusLabel(status) {
  const s = normalizeQuizStatus(status);
  if (s === 'published') return 'Published';
  if (s === 'archived') return 'Archived';
  return 'Draft';
}

function quizStatusBadgeClass(status) {
  const s = normalizeQuizStatus(status);
  if (s === 'published') return 'aqm-badge--status-published';
  if (s === 'archived') return 'aqm-badge--status-archived';
  return 'aqm-badge--status-draft';
}

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function AdminQuizManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TAB_QUIZZES);
  const [toast, setToast] = useState(null);
  const [categories, setCategories] = useState([]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function loadCategories() {
    adminQuizCategoryService
      .list()
      .then(setCategories)
      .catch(() => {});
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="aqm-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-center"
          onClose={() => setToast(null)}
        />
      )}

      <div className="aqm-header">
        <div className="aqm-header-text">
          <h1>Quizzes &amp; Question Bank</h1>
          <p>Build a reusable bank of questions, then assemble them into quizzes. Quizzes can also import existing questions or create new ones inline.</p>
        </div>
      </div>

      <div className="aqm-tabs">
        <button
          className={`aqm-tab ${activeTab === TAB_QUIZZES ? 'is-active' : ''}`}
          onClick={() => setActiveTab(TAB_QUIZZES)}
        >
          Quizzes
        </button>
        <button
          className={`aqm-tab ${activeTab === TAB_QUESTIONS ? 'is-active' : ''}`}
          onClick={() => setActiveTab(TAB_QUESTIONS)}
        >
          Question Bank
        </button>
        <button
          className={`aqm-tab ${activeTab === TAB_CATEGORIES ? 'is-active' : ''}`}
          onClick={() => setActiveTab(TAB_CATEGORIES)}
        >
          Categories
          <span className="aqm-tab-count">{categories.length}</span>
        </button>
      </div>

      {activeTab === TAB_QUIZZES && (
        <QuizzesTab
          categories={categories}
          showToast={showToast}
          onNew={() => navigate('/admin/quizzes/new')}
          onEdit={(qz) => navigate(`/admin/quizzes/${qz.id}/edit`)}
        />
      )}

      {activeTab === TAB_QUESTIONS && (
        <QuestionsTab categories={categories} showToast={showToast} />
      )}

      {activeTab === TAB_CATEGORIES && (
        <CategoriesTab
          categories={categories}
          reload={loadCategories}
          showToast={showToast}
        />
      )}
    </div>
  );
}

/* ── Quizzes tab ──────────────────────────────────────────────────────── */
function QuizzesTab({ categories, showToast, onNew, onEdit }) {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', categoryId: '', status: '' });
  const debouncedQ = useDebounced(filters.q, 300);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [lifecycleBusyId, setLifecycleBusyId] = useState(null);
  const [attemptQuiz, setAttemptQuiz] = useState(null); // step-through session (was eye preview)
  const [answerKeyQuiz, setAnswerKeyQuiz] = useState(null); // scrollable answer key (eye)
  const [previewLoading, setPreviewLoading] = useState(false);
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);

  useEffect(() => {
    function onDocMouseDown(e) {
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (!el.closest('.aqm-status-dropdown-root')) {
        setOpenStatusMenuId(null);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  function load(page = pagination.page) {
    setLoading(true);
    setError('');
    const params = {
      page,
      pageSize: pagination.pageSize,
      sort: 'updated_at:desc',
    };
    if (debouncedQ) params.q = debouncedQ;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.status) params.status = filters.status;

    adminQuizService
      .list(params)
      .then((res) => {
        setData(res.data);
        setPagination(res.pagination);
      })
      .catch((e) => setError(e.message || 'Failed to load quizzes'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, filters.categoryId, filters.status]);

  useEffect(() => {
    if (location.pathname !== '/admin/quizzes') return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.key]);

  async function handleDuplicate(qz) {
    setBusyId(qz.id);
    try {
      await adminQuizService.duplicate(qz.id);
      showToast('Quiz duplicated');
      load(1);
    } catch (e) {
      showToast(e.message || 'Failed to duplicate', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePublishQuiz(qz) {
    setLifecycleBusyId(qz.id);
    setOpenStatusMenuId(null);
    try {
      await adminQuizService.publish(qz.id);
      showToast('Quiz published');
      load(pagination.page);
    } catch (e) {
      showToast(e.message || 'Failed to publish', 'error');
    } finally {
      setLifecycleBusyId(null);
    }
  }

  async function handleArchiveQuiz(qz) {
    setLifecycleBusyId(qz.id);
    setOpenStatusMenuId(null);
    try {
      await adminQuizService.archive(qz.id);
      showToast('Quiz archived');
      load(pagination.page);
    } catch (e) {
      showToast(e.message || 'Failed to archive', 'error');
    } finally {
      setLifecycleBusyId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    setBusyId(confirmTarget.id);
    try {
      await adminQuizService.remove(confirmTarget.id);
      showToast('Quiz deleted');
      setConfirmTarget(null);
      load(pagination.page);
    } catch (e) {
      showToast(e.message || 'Failed to delete quiz', 'error');
    } finally {
      setBusyId(null);
    }
  }

  function mapQuizPayload(full) {
    return {
      title: full.title,
      questions: (full.questions || []).map((q) => ({
        prompt: q.prompt,
        type: q.type,
        options: q.options || [],
        acceptedAnswers: q.acceptedAnswers || [],
        answerValidationMode: q.answerValidationMode || 'strict',
        codeImageUrl: q.codeImageUrl || '',
        effectivePoints: q.pointsOverride ?? q.points ?? 1,
      })),
    };
  }

  async function openAttemptQuiz(qz) {
    setPreviewLoading(true);
    try {
      const full = await adminQuizService.getById(qz.id);
      setAttemptQuiz(mapQuizPayload(full));
    } catch (e) {
      showToast('Failed to load quiz', 'error');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function openAnswerKeyPreview(qz) {
    setPreviewLoading(true);
    try {
      const full = await adminQuizService.getById(qz.id);
      setAnswerKeyQuiz(mapQuizPayload(full));
    } catch (e) {
      showToast('Failed to load quiz preview', 'error');
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <>
      <div className="aqm-toolbar">
        <div className="aqm-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search quizzes…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
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
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <p className="aqm-error" style={{ marginBottom: 12 }}>{error}</p>}

      <div className="aqm-table-action-bar">
        <button className="aqm-btn aqm-btn--primary" onClick={onNew}>
          New quiz
        </button>
      </div>

      <div className="aqm-table-card">
        {loading ? (
          <div className="aqm-table-loading">Loading…</div>
        ) : data.length === 0 ? (
          <div className="aqm-table-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h4>No quizzes yet</h4>
            <p>Click <strong>New quiz</strong> to build your first one.</p>
          </div>
        ) : (
          <>
            <table className="aqm-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Questions</th>
                  <th>Points</th>
                  <th>Updated</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Test</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((qz) => (
                  <tr key={qz.id}>
                    <td>
                      <div className="aqm-table-title">{qz.title}</div>
                      {qz.description && <div className="aqm-table-sub">{qz.description}</div>}
                    </td>
                    <td>
                      {qz.categoryName ? (
                        <span className="aqm-badge aqm-badge--neutral">{qz.categoryName}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>{qz.questionCount}</td>
                    <td>{qz.totalPoints}</td>
                    <td style={{ color: '#64748b', fontSize: 12.5 }}>
                      {new Date(qz.updatedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="aqm-status-dropdown-root">
                      <div className="aqm-status-cell">
                        <span className={`aqm-badge ${quizStatusBadgeClass(qz.status)}`}>
                          {quizStatusLabel(qz.status)}
                        </span>
                        <button
                          type="button"
                          className="aqm-status-edit-btn"
                          aria-label="Change publication status"
                          aria-expanded={openStatusMenuId === qz.id}
                          aria-haspopup="listbox"
                          disabled={lifecycleBusyId === qz.id || busyId === qz.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenStatusMenuId((id) => (id === qz.id ? null : qz.id));
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {openStatusMenuId === qz.id ? (
                          <ul className="aqm-status-menu" role="listbox">
                            {normalizeQuizStatus(qz.status) === 'published' ? (
                              <li role="option">
                                <button
                                  type="button"
                                  className="aqm-status-menu-item"
                                  onClick={() => handleArchiveQuiz(qz)}
                                  disabled={lifecycleBusyId === qz.id}
                                >
                                  Archive
                                </button>
                              </li>
                            ) : (
                              <li role="option">
                                <button
                                  type="button"
                                  className="aqm-status-menu-item aqm-status-menu-item--publish"
                                  onClick={() => handlePublishQuiz(qz)}
                                  disabled={lifecycleBusyId === qz.id}
                                >
                                  Publish
                                </button>
                              </li>
                            )}
                          </ul>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <button
                        type="button"
                        className="aqm-btn aqm-btn--primary aqm-btn--sm"
                        onClick={() => openAttemptQuiz(qz)}
                        disabled={previewLoading}
                      >
                        Test quiz
                      </button>
                    </td>
                    <td>
                      <div className="aqm-actions-cell">
                        {/* 1. Preview (answer key, scrollable) */}
                        <button
                          className="aqm-icon-btn"
                          onClick={() => openAnswerKeyPreview(qz)}
                          disabled={previewLoading}
                          title="Preview all questions and correct answers"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        {/* 2. Edit */}
                        <button
                          className="aqm-icon-btn"
                          onClick={() => onEdit(qz)}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* 3. Duplicate */}
                        <button
                          className="aqm-icon-btn"
                          onClick={() => handleDuplicate(qz)}
                          disabled={busyId === qz.id}
                          title="Duplicate"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                        {/* 4. Delete */}
                        <button
                          className="aqm-icon-btn aqm-icon-btn--danger"
                          onClick={() => setConfirmTarget(qz)}
                          disabled={busyId === qz.id}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPageChange={(p) => load(p)} />
          </>
        )}
      </div>

      {confirmTarget && (
        <ConfirmDialog
          title="Delete this quiz?"
          message={`"${confirmTarget.title}" will be removed. Its questions stay in your bank.`}
          confirmLabel="Delete quiz"
          isDangerous
          busy={busyId === confirmTarget.id}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {attemptQuiz && (
        <QuizPreviewModal
          quizTitle={attemptQuiz.title}
          questions={attemptQuiz.questions}
          onClose={() => setAttemptQuiz(null)}
        />
      )}

      {answerKeyQuiz && (
        <QuizAnswerKeyModal
          quizTitle={answerKeyQuiz.title}
          questions={answerKeyQuiz.questions}
          onClose={() => setAnswerKeyQuiz(null)}
        />
      )}
    </>
  );
}

/* ── Questions tab ────────────────────────────────────────────────────── */
function QuestionsTab({ categories, showToast }) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', type: '', categoryId: '', difficulty: '', status: '' });
  const debouncedQ = useDebounced(filters.q, 300);
  const [editTarget, setEditTarget] = useState(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [busyId, setBusyId] = useState(null);

  function load(page = pagination.page) {
    setLoading(true);
    setError('');
    const params = {
      page,
      pageSize: pagination.pageSize,
      sort: 'updated_at:desc',
    };
    if (debouncedQ) params.q = debouncedQ;
    if (filters.type) params.type = filters.type;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.status) params.status = filters.status;

    adminQuestionService
      .list(params)
      .then((res) => {
        setData(res.data);
        setPagination(res.pagination);
      })
      .catch((e) => setError(e.message || 'Failed to load questions'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, filters.type, filters.categoryId, filters.difficulty, filters.status]);

  async function handleCreate(value) {
    setSubmitting(true);
    try {
      await adminQuestionService.create(value);
      showToast('Question created');
      setCreating(false);
      load(1);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(value) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await adminQuestionService.update(editTarget.id, value);
      showToast('Question updated');
      setEditTarget(null);
      load(pagination.page);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(force = false) {
    if (!confirmTarget) return;
    setBusyId(confirmTarget.id);
    try {
      await adminQuestionService.remove(confirmTarget.id, { force });
      showToast('Question deleted');
      setConfirmTarget(null);
      setForceDelete(false);
      load(pagination.page);
    } catch (e) {
      if (e.code === 'IN_USE') {
        setForceDelete(true);
      } else {
        showToast(e.message || 'Failed to delete', 'error');
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="aqm-toolbar">
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
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
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
        <button className="aqm-btn aqm-btn--primary" onClick={() => setCreating(true)}>
          New question
        </button>
      </div>

      {error && <p className="aqm-error" style={{ marginBottom: 12 }}>{error}</p>}

      <div className="aqm-table-card">
        {loading ? (
          <div className="aqm-table-loading">Loading…</div>
        ) : data.length === 0 ? (
          <div className="aqm-table-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h4>No questions yet</h4>
            <p>Click <strong>New question</strong> to add one to your bank.</p>
          </div>
        ) : (
          <>
            <table className="aqm-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Question format</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Used in</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((q) => (
                  <tr key={q.id}>
                    <td
                      className="aqm-qbank-prompt-cell"
                      title={
                        q.tags?.length
                          ? `${q.prompt}\n\n${q.tags.map((t) => `#${t}`).join(' ')}`
                          : q.prompt
                      }
                    >
                      <div className="aqm-table-title aqm-table-title--single-line">{q.prompt}</div>
                    </td>
                    <td>
                      <span className={`aqm-badge aqm-badge--type-${q.type}`}>
                        {TYPE_LABELS[q.type] || q.type}
                      </span>
                    </td>
                    <td>
                      {q.categoryName ? (
                        <span className="aqm-badge aqm-badge--neutral">{q.categoryName}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`aqm-badge aqm-badge--diff-${q.difficulty}`}>{q.difficulty}</span>
                    </td>
                    <td>{q.usageCount}</td>
                    <td>
                      <div className="aqm-actions-cell">
                        <button
                          className="aqm-icon-btn"
                          onClick={() => setEditTarget(q)}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="aqm-icon-btn aqm-icon-btn--danger"
                          onClick={() => { setConfirmTarget(q); setForceDelete(false); }}
                          disabled={busyId === q.id}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPageChange={(p) => load(p)} />
          </>
        )}
      </div>

      {(creating || editTarget) && (
        <QuestionEditorModal
          initial={editTarget}
          categories={categories}
          submitting={submitting}
          onClose={() => { setCreating(false); setEditTarget(null); }}
          onSubmit={editTarget ? handleUpdate : handleCreate}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title={forceDelete ? 'Question is in use' : 'Delete this question?'}
          message={
            forceDelete
              ? `This question is linked to ${confirmTarget.usageCount} quiz(zes). Deleting it will also remove it from those quizzes.`
              : 'It will be removed from your bank. This cannot be undone.'
          }
          confirmLabel={forceDelete ? 'Delete anyway' : 'Delete question'}
          isDangerous
          busy={busyId === confirmTarget.id}
          onConfirm={() => handleDelete(forceDelete)}
          onCancel={() => { setConfirmTarget(null); setForceDelete(false); }}
        />
      )}
    </>
  );
}

/* ── Categories tab ───────────────────────────────────────────────────── */
function CategoriesTab({ categories, reload, showToast }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      await adminQuizCategoryService.create(payload);
      showToast('Category created');
      setCreating(false);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(payload) {
    if (!editing) return;
    setSubmitting(true);
    try {
      await adminQuizCategoryService.update(editing.id, payload);
      showToast('Category updated');
      setEditing(null);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setBusyId(confirmTarget.id);
    try {
      await adminQuizCategoryService.remove(confirmTarget.id);
      showToast('Category deleted');
      setConfirmTarget(null);
      reload();
    } catch (e) {
      showToast(e.message || 'Failed to delete category', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="aqm-toolbar">
        <div className="aqm-cat-toolbar-text">
          {categories.length === 0 ? (
            'No categories yet — create one to organize your questions and quizzes.'
          ) : (
            <span className="aqm-cat-toolbar-hint">
              Summary only: cards show how many questions and quizzes use each category—they do not list
              question text. Use the <strong>Question Bank</strong> tab to view or edit questions.
            </span>
          )}
        </div>
        <button className="aqm-btn aqm-btn--primary" onClick={() => setCreating(true)}>
          New category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="aqm-table-card">
          <div className="aqm-table-empty">
            <h4>No categories yet</h4>
            <p>Categories let you group related questions and filter quizzes.</p>
          </div>
        </div>
      ) : (
        <div className="aqm-cat-list">
          {categories.map((c) => (
            <article key={c.id} className="aqm-cat-card">
              <div className="aqm-cat-card-actions">
                <button
                  type="button"
                  className="aqm-icon-btn"
                  onClick={() => setEditing(c)}
                  title="Edit category"
                  aria-label="Edit category"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="aqm-icon-btn aqm-icon-btn--danger"
                  onClick={() => setConfirmTarget(c)}
                  disabled={busyId === c.id}
                  title="Delete category"
                  aria-label="Delete category"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>

              <h4>{c.name}</h4>

              {c.description ? (
                <p>{c.description}</p>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description</p>
              )}

              <div className="aqm-cat-card-meta">
                <span className="aqm-cat-card-meta-item" title="Questions in this category">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <strong>{c.questionCount}</strong> question{c.questionCount === 1 ? '' : 's'}
                </span>
                <span className="aqm-cat-card-meta-item" title="Quizzes in this category">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <strong>{c.quizCount}</strong> quiz{c.quizCount === 1 ? '' : 'zes'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoryEditorModal
          initial={editing}
          submitting={submitting}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={editing ? handleUpdate : handleCreate}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Delete this category?"
          message={`"${confirmTarget.name}" — questions and quizzes in this category will become uncategorized.`}
          confirmLabel="Delete category"
          isDangerous
          busy={busyId === confirmTarget.id}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </>
  );
}
