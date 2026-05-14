import React, { useEffect, useState } from 'react';
import QuestionFormFields, { defaultsForType } from './QuestionFormFields';

function buildInitial(initial) {
  if (!initial) {
    return {
      ...defaultsForType('mcq'),
      prompt: '',
      categoryId: null,
      difficulty: 'medium',
      tags: [],
      points: 1,
      status: 'active',
    };
  }
  return {
    _id: initial.id ?? initial._id,
    type: initial.type || 'mcq',
    prompt: initial.prompt || '',
    options: Array.isArray(initial.options) && initial.options.length
      ? initial.options.map((o) => ({ ...o }))
      : defaultsForType(initial.type || 'mcq').options,
    acceptedAnswers: Array.isArray(initial.acceptedAnswers) && initial.acceptedAnswers.length
      ? [String(initial.acceptedAnswers[0] || '').trim()]
      : defaultsForType(initial.type || 'mcq').acceptedAnswers,
    answerValidationMode: initial.answerValidationMode || 'strict',
    codeImageUrl: initial.codeImageUrl || '',
    categoryId: initial.categoryId ?? null,
    difficulty: initial.difficulty || 'medium',
    tags: Array.isArray(initial.tags) ? [...initial.tags] : [],
    points: initial.points ?? 1,
    status: initial.status || 'active',
  };
}

/**
 * onSubmitAndAdd — optional. When provided (create mode only), shows a
 * "Create & add another" button that saves the current question then resets
 * the form so the admin can immediately create the next one.
 */
export default function QuestionEditorModal({ initial, categories, onClose, onSubmit, onSubmitAndAdd, submitting }) {
  const [value, setValue] = useState(() => buildInitial(initial));
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(buildInitial(initial));
    setError('');
  }, [initial]);

  function localValidate() {
    if (value.type === 'code_image') {
      if (!value.prompt.trim()) return 'Question text is required';
      if ((value.options || []).filter((o) => o.label.trim()).length < 2) return 'At least 2 options required';
      if (!value.options.some((o) => o.isCorrect)) return 'Mark one option as correct';
      return null;
    }

    if (!value.prompt.trim()) return 'Question text is required';
    if (value.type === 'mcq') {
      if ((value.options || []).filter((o) => o.label.trim()).length < 2) return 'At least 2 options required';
      if (!value.options.some((o) => o.isCorrect)) return 'Mark one option as correct';
    }
    if (value.type === 'multi_choice') {
      if ((value.options || []).filter((o) => o.label.trim()).length < 2) return 'At least 2 options required';
      if (!value.options.some((o) => o.isCorrect)) return 'Mark at least one option as correct';
    }
    if (value.type === 'fill_blank') {
      const answer = String((value.acceptedAnswers || [])[0] || '').trim();
      if (!answer) return 'Enter the correct answer';
    }
    return null;
  }

  async function handleSubmit(mode = 'save') {
    const err = localValidate();
    if (err) { setError(err); return; }
    setError('');
    try {
      if (mode === 'addAnother') {
        await onSubmitAndAdd(value);
        // parent resets the modal key; we don't close here
      } else {
        await onSubmit(value);
      }
    } catch (e) {
      setError(e?.message || 'Failed to save question');
    }
  }

  return (
    <div className="aqm-modal-overlay" onClick={onClose}>
      <div className="aqm-modal aqm-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="aqm-modal-head">
          <h3>{initial ? 'Edit question' : 'Create question'}</h3>
          <button className="aqm-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="aqm-modal-body">
          {error && <p className="aqm-error" style={{ marginBottom: 14 }}>{error}</p>}
          <QuestionFormFields
            value={value}
            onChange={setValue}
            categories={categories}
            disabled={submitting}
          />
        </div>
        <div className="aqm-modal-foot">
          <button className="aqm-btn aqm-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          {/* "Create & add another" only in create mode when parent provides the handler */}
          {!initial && onSubmitAndAdd && (
            <button
              className="aqm-btn aqm-btn--ghost"
              onClick={() => handleSubmit('addAnother')}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Create & add another'}
            </button>
          )}
          <button className="aqm-btn aqm-btn--primary" onClick={() => handleSubmit('save')} disabled={submitting}>
            {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create question'}
          </button>
        </div>
      </div>
    </div>
  );
}
