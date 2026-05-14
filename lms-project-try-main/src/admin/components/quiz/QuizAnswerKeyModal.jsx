import React from 'react';
import { getFillBlankCorrectAnswer } from '../../../utils/fillBlankAnswerValidation';

const TYPE_LABELS = {
  mcq: 'Multiple Choice',
  multi_choice: 'Multi-select',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
  code_image: 'Code Snippet',
};

function formatCorrectAnswerSummary(q) {
  if (q.type === 'fill_blank') {
    const answer = getFillBlankCorrectAnswer(q);
    return answer || '—';
  }
  const correctOpts = (q.options || []).filter((o) => o.isCorrect);
  if (!correctOpts.length) return '—';
  return correctOpts.map((o) => o.label).join(' · ');
}

export default function QuizAnswerKeyModal({ quizTitle, questions, onClose }) {
  return (
    <div className="aqm-modal-overlay" onClick={onClose}>
      <div
        className="aqm-modal aqm-modal--xl aqm-preview-modal aqm-answer-key-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aqm-preview-header">
          <div className="aqm-preview-header-left">
            <span className="aqm-preview-quiz-title">
              {quizTitle || 'Quiz'} — preview (all questions and correct answers)
            </span>
          </div>
          <button type="button" className="aqm-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="aqm-answer-key-scroll">
          {questions.length === 0 ? (
            <p className="aqm-answer-key-empty">No questions in this quiz.</p>
          ) : (
            questions.map((q, i) => (
              <section key={i} className="aqm-answer-key-block">
                <div className="aqm-answer-key-block-head">
                  <span className="aqm-answer-key-num">{i + 1}</span>
                  <div className="aqm-answer-key-block-meta">
                    <span className={`aqm-badge aqm-badge--type-${q.type}`}>
                      {TYPE_LABELS[q.type] || q.type}
                    </span>
                    <span className="aqm-hint">
                      {q.effectivePoints ?? 1} pt{(q.effectivePoints ?? 1) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {q.type === 'code_image' && q.codeImageUrl && (
                  <div className="aqm-preview-code-img aqm-answer-key-code-img">
                    <img src={q.codeImageUrl} alt="Code snippet" />
                  </div>
                )}

                {!!String(q.prompt || '').trim() && (
                  <p className="aqm-preview-prompt aqm-answer-key-prompt">{q.prompt}</p>
                )}

                {(q.type === 'mcq' || q.type === 'true_false' || q.type === 'code_image' || q.type === 'multi_choice') && (
                  <div className="aqm-preview-options aqm-answer-key-options">
                    {(q.options || []).map((opt, j) => (
                      <div
                        key={opt.id || j}
                        className={`aqm-preview-opt aqm-answer-key-opt${opt.isCorrect ? ' is-correct-key' : ''}`}
                      >
                        <span className="aqm-preview-opt-letter">{String.fromCharCode(65 + j)}</span>
                        <span className="aqm-preview-opt-text">{opt.label}</span>
                        {opt.isCorrect && (
                          <span className="aqm-answer-key-correct-tag">Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'fill_blank' && (
                  <div className="aqm-answer-key-fill">
                    <span className="aqm-answer-key-fill-label">Accepted answer(s)</span>
                    <div className="aqm-answer-key-fill-values">{formatCorrectAnswerSummary(q)}</div>
                  </div>
                )}
              </section>
            ))
          )}
        </div>

        <div className="aqm-preview-footer aqm-answer-key-footer">
          <span className="aqm-answer-key-foot-hint">{questions.length} question{questions.length === 1 ? '' : 's'}</span>
          <button type="button" className="aqm-btn aqm-btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
