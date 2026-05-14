import React from 'react';

const TYPE_LABELS = {
  mcq: 'Multiple Choice (single correct)',
  multi_choice: 'Multiple Choice (multiple correct)',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
  code_image: 'Code Snippet',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function emptyOption() {
  return { id: uid(), label: '', isCorrect: false };
}

export function defaultsForType(type) {
  if (type === 'mcq') return { type, options: [emptyOption(), emptyOption()], acceptedAnswers: [], codeImageUrl: '' };
  if (type === 'multi_choice') return { type, options: [emptyOption(), emptyOption()], acceptedAnswers: [], codeImageUrl: '' };
  if (type === 'true_false') return {
    type,
    options: [
      { id: 'tf-true', label: 'True', isCorrect: true },
      { id: 'tf-false', label: 'False', isCorrect: false },
    ],
    acceptedAnswers: [],
    codeImageUrl: '',
  };
  if (type === 'fill_blank') {
    return {
      type,
      options: [],
      acceptedAnswers: [''],
      codeImageUrl: '',
    };
  }
  if (type === 'code_image') return { type, options: [emptyOption(), emptyOption()], acceptedAnswers: [], codeImageUrl: '' };
  return { type: 'mcq', options: [emptyOption(), emptyOption()], acceptedAnswers: [], codeImageUrl: '' };
}

export default function QuestionFormFields({ value, onChange, categories = [], disabled }) {
  const set = (patch) => onChange({ ...value, ...patch });

  function changeType(newType) {
    onChange({
      ...value,
      ...defaultsForType(newType),
    });
  }

  function updateOption(idx, patch) {
    const opts = [...(value.options || [])];
    if (value.type === 'mcq' || value.type === 'code_image') {
      if (patch.isCorrect) {
        opts.forEach((o, i) => { o.isCorrect = i === idx; });
      } else {
        opts[idx] = { ...opts[idx], ...patch };
      }
    } else {
      opts[idx] = { ...opts[idx], ...patch };
    }
    set({ options: opts });
  }

  function addOption() {
    const max = value.type === 'multi_choice' ? 8 : 6;
    if ((value.options?.length ?? 0) >= max) return;
    set({ options: [...(value.options || []), emptyOption()] });
  }

  function removeOption(idx) {
    if ((value.options?.length ?? 0) <= 2) return;
    set({ options: value.options.filter((_, i) => i !== idx) });
  }

  function pickTrueFalse(isTrue) {
    set({
      options: [
        { id: 'tf-true', label: 'True', isCorrect: isTrue },
        { id: 'tf-false', label: 'False', isCorrect: !isTrue },
      ],
    });
  }

  return (
    <div>
      <div className="aqm-field-row">
        <div className="aqm-field">
          <label className="aqm-label">Type <span className="aqm-req">*</span></label>
          <select
            className="aqm-select"
            value={value.type || 'mcq'}
            onChange={(e) => changeType(e.target.value)}
            disabled={disabled}
          >
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="aqm-field">
          <label className="aqm-label">Category</label>
          <select
            className="aqm-select"
            value={value.categoryId ?? ''}
            onChange={(e) => set({ categoryId: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="aqm-field">
        <label className="aqm-label">
          Question text
          <span className="aqm-req"> *</span>
        </label>
        <textarea
          className="aqm-textarea"
          rows={value.type === 'code_image' ? 5 : 3}
          placeholder={
            value.type === 'code_image'
              ? 'Paste or type the code / question text students will see…'
              : 'Enter the full wording students will see…'
          }
          value={value.prompt || ''}
          onChange={(e) => set({ prompt: e.target.value })}
          disabled={disabled}
        />
      </div>

      {(value.type === 'mcq' || value.type === 'multi_choice' || value.type === 'code_image') && (
        <div className="aqm-field">
          <label className="aqm-label">
            Options
            <span className="aqm-hint">
              {' '}— {value.type === 'multi_choice' ? 'mark all correct answers' : 'pick one correct answer'}
            </span>
          </label>
          <div className="aqm-options">
            {(value.options || []).map((opt, idx) => (
              <div
                key={opt.id || idx}
                className={`aqm-option-row ${opt.isCorrect ? 'is-correct' : ''}`}
                onClick={() =>
                  value.type === 'multi_choice'
                    ? updateOption(idx, { isCorrect: !opt.isCorrect })
                    : updateOption(idx, { isCorrect: true })
                }
              >
                <span className="aqm-option-letter">{LETTERS[idx] ?? idx + 1}</span>
                <input
                  type="text"
                  className="aqm-option-input"
                  placeholder={`Option ${LETTERS[idx] ?? idx + 1}`}
                  value={opt.label}
                  onChange={(e) => {
                    const opts = [...value.options];
                    opts[idx] = { ...opts[idx], label: e.target.value };
                    set({ options: opts });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={disabled}
                />
                <input
                  className="aqm-option-correct"
                  type={value.type === 'multi_choice' ? 'checkbox' : 'radio'}
                  name={`correct-${value._id || 'new'}`}
                  checked={!!opt.isCorrect}
                  onChange={() =>
                    value.type === 'multi_choice'
                      ? updateOption(idx, { isCorrect: !opt.isCorrect })
                      : updateOption(idx, { isCorrect: true })
                  }
                  onClick={(e) => e.stopPropagation()}
                />
                {(value.options?.length ?? 0) > 2 && (
                  <button
                    type="button"
                    className="aqm-icon-btn aqm-icon-btn--danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(idx);
                    }}
                    title="Remove option"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="aqm-add-option-btn" onClick={addOption} disabled={disabled}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add option
            </button>
          </div>
        </div>
      )}

      {value.type === 'true_false' && (
        <div className="aqm-field">
          <label className="aqm-label">Correct answer</label>
          <div className="aqm-tf-row">
            <button
              type="button"
              className={`aqm-tf-btn ${value.options?.[0]?.isCorrect ? 'is-correct' : ''}`}
              onClick={() => pickTrueFalse(true)}
              disabled={disabled}
            >
              True
            </button>
            <button
              type="button"
              className={`aqm-tf-btn ${value.options?.[1]?.isCorrect ? 'is-correct' : ''}`}
              onClick={() => pickTrueFalse(false)}
              disabled={disabled}
            >
              False
            </button>
          </div>
        </div>
      )}

      {value.type === 'fill_blank' && (
        <>
          <div className="aqm-field">
            <label className="aqm-label">
              Correct answer
              <span className="aqm-req"> *</span>
            </label>
            <input
              type="text"
              className="aqm-input"
              placeholder="e.g. useState"
              value={(value.acceptedAnswers || [''])[0] || ''}
              onChange={(e) => set({ acceptedAnswers: [e.target.value] })}
              disabled={disabled}
            />
            <span className="aqm-hint">
              Enter one answer. Spacing, case, hyphens, and punctuation are normalized; spelling must match.
            </span>
          </div>
        </>
      )}

      <div className="aqm-field-row">
        <div className="aqm-field">
          <label className="aqm-label">Difficulty</label>
          <select
            className="aqm-select"
            value={value.difficulty || 'medium'}
            onChange={(e) => set({ difficulty: e.target.value })}
            disabled={disabled}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="aqm-field">
          <label className="aqm-label">Default points</label>
          <input
            type="number"
            min={0}
            step={1}
            className="aqm-input"
            value={value.points ?? 1}
            onChange={(e) => set({ points: Math.max(0, Number(e.target.value) || 0) })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
