import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminQuizService } from '../services/adminQuizService';
import { adminQuizCategoryService } from '../services/adminQuizCategoryService';
import Toast from '../components/common/Toast';
import QuestionEditorModal from '../components/quiz/QuestionEditorModal';
import QuestionPickerModal from '../components/quiz/QuestionPickerModal';
import QuizPreviewModal from '../components/quiz/QuizPreviewModal';
import ConfirmDialog from '../components/quiz/ConfirmDialog';
import './AdminQuizManagement.css';

const TYPE_LABELS = {
  mcq: 'MCQ',
  multi_choice: 'Multi',
  true_false: 'T/F',
  fill_blank: 'Fill',
  code_image: 'Code',
};

function normalizeQuizStatus(status) {
  if (status === 'active') return 'published';
  if (status === 'draft' || status === 'published' || status === 'archived') return status;
  return 'draft';
}

function quizLifecycleLabel(status) {
  const s = normalizeQuizStatus(status);
  if (s === 'published') return 'Published';
  if (s === 'archived') return 'Archived';
  return 'Draft';
}

export default function AdminQuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [categories, setCategories] = useState([]);

  const [lifecycleStatus, setLifecycleStatus] = useState('archived');

  const [meta, setMeta] = useState({
    title: '',
    description: '',
    categoryId: '',
  });

  // Each link: { questionId, prompt, type, points, pointsOverride, options, acceptedAnswers, codeImageUrl, __pending, payload? }
  const [links, setLinks] = useState([]);

  const [createModalKey, setCreateModalKey] = useState(0); // bump to reset modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    adminQuizCategoryService.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    adminQuizService
      .getById(id)
      .then((q) => {
        setLifecycleStatus(normalizeQuizStatus(q.status));
        setMeta({
          title: q.title || '',
          description: q.description || '',
          categoryId: q.categoryId ? String(q.categoryId) : '',
        });
        setLinks(
          (q.questions || []).map((qq) => ({
            questionId: qq.id,
            prompt: qq.prompt,
            type: qq.type,
            points: qq.points,
            pointsOverride: qq.pointsOverride ?? null,
            options: qq.options || [],
            acceptedAnswers: qq.acceptedAnswers || [],
            answerValidationMode: qq.answerValidationMode || 'strict',
            codeImageUrl: qq.codeImageUrl || '',
            __pending: false,
          }))
        );
      })
      .catch((e) => setError(e.message || 'Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const totalPoints = useMemo(
    () => links.reduce((acc, l) => acc + (l.pointsOverride ?? l.points ?? 1), 0),
    [links]
  );

  // Full question data for preview
  const previewQuestions = useMemo(
    () =>
      links.map((link) => ({
        prompt: link.__pending ? link.payload.prompt : link.prompt,
        type: link.__pending ? link.payload.type : link.type,
        options: link.__pending ? link.payload.options || [] : link.options || [],
        acceptedAnswers: link.__pending
          ? link.payload.acceptedAnswers || []
          : link.acceptedAnswers || [],
        answerValidationMode: link.__pending
          ? link.payload.answerValidationMode || 'strict'
          : link.answerValidationMode || 'strict',
        codeImageUrl: link.__pending ? link.payload.codeImageUrl || '' : link.codeImageUrl || '',
        effectivePoints:
          link.pointsOverride ??
          (link.__pending ? link.payload.points : link.points) ??
          1,
      })),
    [links]
  );

  function moveLink(idx, dir) {
    setLinks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function removeLink(idx) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function setOverride(idx, value) {
    setLinks((prev) =>
      prev.map((l, i) =>
        i === idx
          ? { ...l, pointsOverride: value === '' ? null : Math.max(0, Number(value) || 0) }
          : l
      )
    );
  }

  function addQuestionToLinks(v) {
    setLinks((prev) => [
      ...prev,
      {
        questionId: null,
        prompt: v.prompt,
        type: v.type,
        points: v.points ?? 1,
        pointsOverride: null,
        options: v.options || [],
        acceptedAnswers: v.acceptedAnswers || [],
        answerValidationMode: v.answerValidationMode || 'strict',
        codeImageUrl: v.codeImageUrl || '',
        __pending: true,
        payload: v,
      },
    ]);
  }

  // "Create question" — add and close
  function handleCreateQuestion(v) {
    addQuestionToLinks(v);
    setCreateModalOpen(false);
  }

  // "Create & add another" — add, reset modal (keep open)
  function handleCreateAndAddAnother(v) {
    addQuestionToLinks(v);
    setCreateModalKey((k) => k + 1); // forces QuestionEditorModal to remount fresh
  }

  function handlePickerConfirm(picked) {
    if (!picked?.length) { setPickerOpen(false); return; }
    const existingIds = new Set(links.filter((l) => !l.__pending).map((l) => l.questionId));
    const newOnes = picked
      .filter((p) => !existingIds.has(p.id))
      .map((p) => ({
        questionId: p.id,
        prompt: p.prompt,
        type: p.type,
        points: p.points ?? 1,
        pointsOverride: null,
        options: p.options || [],
        acceptedAnswers: p.acceptedAnswers || [],
        answerValidationMode: p.answerValidationMode || 'strict',
        codeImageUrl: p.codeImageUrl || '',
        __pending: false,
      }));
    setLinks((prev) => [...prev, ...newOnes]);
    setPickerOpen(false);
  }

  function buildSubmitPayload() {
    return {
      title: meta.title.trim(),
      description: meta.description.trim(),
      categoryId: meta.categoryId ? Number(meta.categoryId) : null,
      questions: links.map((l) =>
        l.__pending
          ? {
              mode: 'create',
              type: l.payload.type,
              prompt: l.payload.prompt,
              codeImageUrl: l.payload.codeImageUrl,
              options: l.payload.options,
              acceptedAnswers: l.payload.acceptedAnswers,
              answerValidationMode: l.payload.answerValidationMode,
              categoryId: l.payload.categoryId,
              difficulty: l.payload.difficulty,
              tags: l.payload.tags,
              points: l.payload.points,
              status: 'active',
              pointsOverride: l.pointsOverride,
            }
          : {
              mode: 'import',
              questionId: l.questionId,
              pointsOverride: l.pointsOverride,
            }
      ),
    };
  }

  async function handleSave() {
    if (!meta.title.trim()) { setError('Quiz title is required'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = buildSubmitPayload();
      let saved;
      if (isNew) {
        saved = await adminQuizService.create(payload);
        showToast('Quiz created');
        navigate(`/admin/quizzes/${saved.id}/edit`, { replace: true });
      } else {
        saved = await adminQuizService.update(id, payload);
        showToast('Quiz saved');
        const fresh = await adminQuizService.getById(saved.id || id);
        setLifecycleStatus(normalizeQuizStatus(fresh.status));
        setLinks(
          (fresh.questions || []).map((qq) => ({
            questionId: qq.id,
            prompt: qq.prompt,
            type: qq.type,
            points: qq.points,
            pointsOverride: qq.pointsOverride ?? null,
            options: qq.options || [],
            acceptedAnswers: qq.acceptedAnswers || [],
            answerValidationMode: qq.answerValidationMode || 'strict',
            codeImageUrl: qq.codeImageUrl || '',
            __pending: false,
          }))
        );
      }
    } catch (e) {
      setError(e.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew) return;
    setSaving(true);
    try {
      await adminQuizService.remove(id);
      showToast('Quiz deleted');
      navigate('/admin/quizzes');
    } catch (e) {
      setError(e.message || 'Failed to delete quiz');
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="aqm-editor-page">
        <div className="aqm-table-loading">Loading quiz…</div>
      </div>
    );
  }

  const linkedExistingIds = links.filter((l) => !l.__pending).map((l) => l.questionId);

  return (
    <div className="aqm-editor-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-center"
          onClose={() => setToast(null)}
        />
      )}

      <button className="aqm-editor-back" onClick={() => navigate('/admin/quizzes')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Quizzes
      </button>

      <div className="aqm-header" style={{ marginBottom: 18 }}>
        <div className="aqm-header-text">
          <h1>{isNew ? 'New Quiz' : 'Edit Quiz'}</h1>
          <p>
            Import existing questions from your bank or create new ones inline — new ones are automatically saved to the bank too.
          </p>
        </div>
        <div className="aqm-header-actions">
          {!isNew && (
            <button className="aqm-btn aqm-btn--danger" onClick={() => setConfirmDelete(true)} disabled={saving}>
              Delete
            </button>
          )}
          <button className="aqm-btn aqm-btn--ghost" onClick={() => navigate('/admin/quizzes')} disabled={saving}>
            Cancel
          </button>
          <button className="aqm-btn aqm-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create quiz' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && <p className="aqm-error" style={{ marginBottom: 14 }}>{error}</p>}

      <div className="aqm-editor-card">
        <h2>Quiz info</h2>
        <div className="aqm-field">
          <label className="aqm-label">Title <span className="aqm-req">*</span></label>
          <input
            type="text"
            className="aqm-input"
            placeholder="e.g. Arrays — chapter quiz"
            value={meta.title}
            onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
            maxLength={255}
          />
        </div>
        <div className="aqm-field">
          <label className="aqm-label">Description <span className="aqm-hint">(optional)</span></label>
          <textarea
            className="aqm-textarea"
            rows={3}
            placeholder="What's this quiz about?"
            value={meta.description}
            onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
          />
        </div>
        <div className="aqm-field-row">
          <div className="aqm-field">
            <label className="aqm-label">Category</label>
            <select
              className="aqm-select"
              value={meta.categoryId}
              onChange={(e) => setMeta((m) => ({ ...m, categoryId: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="aqm-field">
            <label className="aqm-label">Status</label>
            <div>
              <span className={`aqm-quiz-status-readonly aqm-badge aqm-badge--status-${normalizeQuizStatus(lifecycleStatus)}`}>
                {quizLifecycleLabel(lifecycleStatus)}
              </span>
            </div>
            <span className="aqm-hint" style={{ display: 'block', marginTop: 6 }}>
              New quizzes start as <strong>Archived</strong>. Use <strong>Publish</strong> or <strong>Archive</strong> on the Quizzes list to change this.
            </span>
          </div>
        </div>
      </div>

      <div className="aqm-editor-card">
        <div className="aqm-section-head">
          <h2>
            Questions
            <span className="aqm-tab-count" style={{ marginLeft: 10 }}>{links.length}</span>
            <span className="aqm-hint" style={{ marginLeft: 10 }}>· {totalPoints} pts total</span>
          </h2>
        </div>

        <div className="aqm-add-q-row">
          <button className="aqm-btn aqm-btn--ghost aqm-btn--sm" onClick={() => setPickerOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import questions
          </button>
          <button className="aqm-btn aqm-btn--primary aqm-btn--sm" onClick={() => setCreateModalOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create question
          </button>
          {links.length > 0 && (
            <button
              className="aqm-btn aqm-btn--ghost aqm-btn--sm aqm-preview-quiz-btn"
              onClick={() => {
                setPreviewQuestionIndex(null);
                setPreviewOpen(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview quiz
            </button>
          )}
        </div>

        {links.length === 0 ? (
          <div className="aqm-link-empty">
            No questions yet. Use <strong>Import</strong> to pull from your bank or <strong>Create</strong> to build new ones.
          </div>
        ) : (
          <div className="aqm-link-list">
            {links.map((link, idx) => (
              <div key={`${link.questionId ?? 'pend'}-${idx}`} className="aqm-link-row">
                <div className="aqm-link-row__num">{idx + 1}</div>
                <div className="aqm-link-row__main">
                  <div className="aqm-link-row__question">
                    {link.__pending ? link.payload?.prompt || '(No question text)' : link.prompt || '(No question text)'}
                  </div>
                  <div className="aqm-link-row__meta">
                    <span className={`aqm-badge aqm-badge--type-${link.type}`}>
                      {TYPE_LABELS[link.type] || link.type}
                    </span>
                    {link.__pending ? (
                      <span className="aqm-badge aqm-badge--diff-medium">Pending save</span>
                    ) : (
                      <span className="aqm-badge aqm-badge--neutral">From bank</span>
                    )}
                  </div>
                </div>
                <div className="aqm-link-row__points">
                  <span className="aqm-hint">pts</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    placeholder={String(link.points ?? 1)}
                    value={link.pointsOverride ?? ''}
                    onChange={(e) => setOverride(idx, e.target.value)}
                    title="Override points for this quiz only"
                  />
                </div>
                <div className="aqm-link-row__actions">
                  {/* Preview eye icon */}
                  <button
                    className="aqm-icon-btn"
                    onClick={() => {
                      setPreviewQuestionIndex(idx);
                      setPreviewOpen(true);
                    }}
                    title="Preview this question"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    className="aqm-icon-btn"
                    onClick={() => moveLink(idx, -1)}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    className="aqm-icon-btn"
                    onClick={() => moveLink(idx, 1)}
                    disabled={idx === links.length - 1}
                    title="Move down"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <button
                    className="aqm-icon-btn aqm-icon-btn--danger"
                    onClick={() => removeLink(idx)}
                    title="Remove from quiz"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {createModalOpen && (
        <QuestionEditorModal
          key={createModalKey}
          initial={null}
          categories={categories}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateQuestion}
          onSubmitAndAdd={handleCreateAndAddAnother}
        />
      )}

      {pickerOpen && (
        <QuestionPickerModal
          categories={categories}
          excludeIds={linkedExistingIds}
          excludeQuizId={isNew ? null : id}
          onClose={() => setPickerOpen(false)}
          onConfirm={handlePickerConfirm}
        />
      )}

      {previewOpen && (
        <QuizPreviewModal
          key={previewQuestionIndex == null ? 'preview-all' : `preview-${previewQuestionIndex}`}
          quizTitle={meta.title || 'Untitled Quiz'}
          questions={
            previewQuestionIndex == null
              ? previewQuestions
              : previewQuestions[previewQuestionIndex] != null
                ? [previewQuestions[previewQuestionIndex]]
                : []
          }
          singleQuestion={previewQuestionIndex != null}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewQuestionIndex(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this quiz?"
          message="The quiz will be removed but its questions stay in your bank."
          confirmLabel="Delete quiz"
          isDangerous
          busy={saving}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
