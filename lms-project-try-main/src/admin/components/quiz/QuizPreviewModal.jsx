import React, { useState } from 'react';
import { gradeFillBlankAnswer } from '../../../utils/fillBlankAnswerValidation';

const TYPE_LABELS = {
  mcq: 'Multiple Choice',
  multi_choice: 'Multi-select',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
  code_image: 'Code Snippet',
};

/**
 * Score a single question.
 * Multi-choice uses partial credit:
 *   ratio = max(0, (correctSelected - wrongSelected) / totalCorrect)
 *   earned = ratio * effectivePoints
 */
function calcScore(q, answer) {
  const pts = q.effectivePoints ?? 1;

  if (q.type === 'mcq' || q.type === 'code_image' || q.type === 'true_false') {
    const correct = (q.options || []).find((o) => o.isCorrect);
    return correct && answer === correct.id ? pts : 0;
  }

  if (q.type === 'multi_choice') {
    const correctIds = (q.options || []).filter((o) => o.isCorrect).map((o) => o.id);
    if (!correctIds.length) return 0;
    const selected = answer instanceof Set ? [...answer] : [];
    const selectedCorrect = selected.filter((id) => correctIds.includes(id)).length;
    const selectedWrong = selected.filter((id) => !correctIds.includes(id)).length;
    const ratio = Math.max(0, (selectedCorrect - selectedWrong) / correctIds.length);
    return Math.round(ratio * pts * 10) / 10;
  }

  if (q.type === 'fill_blank') {
    return gradeFillBlankAnswer(q, answer) ? pts : 0;
  }

  return 0;
}

export default function QuizPreviewModal({ quizTitle, questions, onClose, singleQuestion = false }) {
  const [phase, setPhase] = useState('quiz');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(new Map());

  function setAnswer(idx, val) {
    setAnswers((prev) => new Map(prev).set(idx, val));
  }

  function handleMultiToggle(optId) {
    setAnswers((prev) => {
      const cur = prev.get(currentIdx);
      const set = cur instanceof Set ? new Set(cur) : new Set();
      if (set.has(optId)) set.delete(optId);
      else set.add(optId);
      return new Map(prev).set(currentIdx, set);
    });
  }

  const current = questions[currentIdx];

  const scoredQuestions = questions.map((q, i) => ({
    ...q,
    answer: answers.get(i),
    earned: calcScore(q, answers.get(i)),
  }));
  const totalPts = questions.reduce((acc, q) => acc + (q.effectivePoints ?? 1), 0);
  const totalEarned = scoredQuestions.reduce((acc, q) => acc + q.earned, 0);
  const pct = totalPts > 0 ? Math.round((totalEarned / totalPts) * 100) : 0;

  if (phase === 'result') {
    return (
      <ResultScreen
        quizTitle={quizTitle}
        scoredQuestions={scoredQuestions}
        totalEarned={totalEarned}
        totalPts={totalPts}
        pct={pct}
        onClose={onClose}
        onRetry={() => {
          setAnswers(new Map());
          setCurrentIdx(0);
          setPhase('quiz');
        }}
      />
    );
  }

  if (!current) {
    return (
      <div className="aqm-modal-overlay" onClick={onClose}>
        <div className="aqm-modal aqm-modal--sm" onClick={(e) => e.stopPropagation()}>
          <div className="aqm-modal-body">
            <p className="aqm-hint">Nothing to preview.</p>
          </div>
          <div className="aqm-modal-foot">
            <button type="button" className="aqm-btn aqm-btn--primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = answers.get(currentIdx);

  return (
    <div className="aqm-modal-overlay" onClick={onClose}>
      <div
        className={`aqm-modal aqm-modal--xl aqm-preview-modal${singleQuestion ? ' aqm-preview-modal--single' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aqm-preview-header">
          <div className="aqm-preview-header-left">
            <span className="aqm-preview-quiz-title">
              {singleQuestion ? quizTitle || 'Question preview' : quizTitle || 'Quiz Preview'}
            </span>
            {!singleQuestion && (
              <span className="aqm-preview-progress">
                {currentIdx + 1} / {questions.length}
              </span>
            )}
          </div>
          <button className="aqm-icon-btn" onClick={onClose} aria-label="Close preview">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!singleQuestion && (
          <div className="aqm-preview-progress-bar">
            <div
              className="aqm-preview-progress-fill"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        )}

        <div className="aqm-preview-body">
          <div className="aqm-preview-q-meta">
            <span className={`aqm-badge aqm-badge--type-${current.type}`}>
              {TYPE_LABELS[current.type] || current.type}
            </span>
            <span className="aqm-hint">
              {current.effectivePoints ?? 1} pt{(current.effectivePoints ?? 1) !== 1 ? 's' : ''}
            </span>
            {current.type === 'multi_choice' && (
              <span className="aqm-preview-note">Select all that apply · partial credit</span>
            )}
            {current.type === 'fill_blank' && (
              <span className="aqm-preview-note">
                Exact match after normalization (spacing, case, punctuation)
              </span>
            )}
          </div>

          {current.type === 'code_image' && current.codeImageUrl && (
            <div className="aqm-preview-code-img">
              <img src={current.codeImageUrl} alt="Question visual" />
            </div>
          )}

          {!!String(current.prompt || '').trim() && (
            <p className="aqm-preview-prompt">{current.prompt}</p>
          )}

          <div className="aqm-preview-options">
            {(current.type === 'mcq' || current.type === 'true_false' || current.type === 'code_image') &&
              (current.options || []).map((opt, i) => (
                <label
                  key={opt.id}
                  className={`aqm-preview-opt${currentAnswer === opt.id ? ' is-selected' : ''}`}
                >
                  <span className="aqm-preview-opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="aqm-preview-opt-text">{opt.label}</span>
                  <input
                    type="radio"
                    name={`prev-q-${currentIdx}`}
                    value={opt.id}
                    checked={currentAnswer === opt.id}
                    onChange={() => setAnswer(currentIdx, opt.id)}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                  />
                </label>
              ))}

            {current.type === 'multi_choice' &&
              (current.options || []).map((opt, i) => {
                const sel = currentAnswer instanceof Set && currentAnswer.has(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`aqm-preview-opt aqm-preview-opt--check${sel ? ' is-selected' : ''}`}
                    onClick={() => handleMultiToggle(opt.id)}
                  >
                    <span className={`aqm-preview-check${sel ? ' is-checked' : ''}`}>
                      {sel && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="aqm-preview-opt-text">{opt.label}</span>
                  </label>
                );
              })}

            {current.type === 'fill_blank' && (
              <input
                type="text"
                className="aqm-input"
                placeholder="Type your answer…"
                value={currentAnswer || ''}
                onChange={(e) => setAnswer(currentIdx, e.target.value)}
                style={{ maxWidth: 380 }}
                autoFocus
              />
            )}
          </div>
        </div>

        <div className={`aqm-preview-footer${singleQuestion ? ' aqm-preview-footer--single' : ''}`}>
          {singleQuestion ? (
            <button type="button" className="aqm-btn aqm-btn--primary" onClick={onClose}>
              Close
            </button>
          ) : (
            <>
              <button
                className="aqm-btn aqm-btn--ghost"
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
              >
                ← Prev
              </button>

              <span className="aqm-preview-dot-nav">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`aqm-preview-dot${i === currentIdx ? ' is-current' : ''}${answers.has(i) ? ' is-answered' : ''}`}
                    onClick={() => setCurrentIdx(i)}
                    title={`Question ${i + 1}`}
                  />
                ))}
              </span>

              {currentIdx < questions.length - 1 ? (
                <button type="button" className="aqm-btn aqm-btn--primary" onClick={() => setCurrentIdx((i) => i + 1)}>
                  Next →
                </button>
              ) : (
                <button type="button" className="aqm-btn aqm-btn--primary" onClick={() => setPhase('result')}>
                  Submit &amp; view score
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultScreen({ quizTitle, scoredQuestions, totalEarned, totalPts, pct, onClose, onRetry }) {
  const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
  const gradeColor =
    pct >= 75 ? 'var(--aqm-success)' : pct >= 50 ? 'var(--aqm-warning, #f59e0b)' : 'var(--aqm-danger)';
  const circumference = 2 * Math.PI * 50;

  return (
    <div className="aqm-modal-overlay" onClick={onClose}>
      <div className="aqm-modal aqm-modal--xl aqm-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aqm-preview-header">
          <div className="aqm-preview-header-left">
            <span className="aqm-preview-quiz-title">{quizTitle || 'Quiz'} — Results</span>
          </div>
          <button className="aqm-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="aqm-preview-body aqm-result-body">
          <div className="aqm-result-score-ring">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={gradeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill={gradeColor}>
                {pct}%
              </text>
              <text x="60" y="73" textAnchor="middle" fontSize="14" fontWeight="600" fill="#64748b">
                {grade}
              </text>
            </svg>
          </div>

          <p className="aqm-result-pts">
            {totalEarned} / {totalPts} points
          </p>

          <div className="aqm-result-breakdown">
            {scoredQuestions.map((q, i) => {
              const isCorrect = q.earned >= (q.effectivePoints ?? 1);
              const isPartial = q.earned > 0 && !isCorrect;
              return (
                <div
                  key={i}
                  className={`aqm-result-row${isCorrect ? ' is-correct' : isPartial ? ' is-partial' : ' is-wrong'}`}
                >
                  <span className="aqm-result-row-num">{i + 1}</span>
                  <div className="aqm-result-row-main">
                    <span className="aqm-result-row-q">{q.prompt}</span>
                    <span className="aqm-result-row-pts">
                      {q.earned} / {q.effectivePoints ?? 1} pt
                      {isPartial && <span className="aqm-result-partial-badge">partial</span>}
                    </span>
                  </div>
                  <span className="aqm-result-row-icon">
                    {isCorrect ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isPartial ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="aqm-preview-footer">
          <button className="aqm-btn aqm-btn--ghost" onClick={onRetry}>
            Retry preview
          </button>
          <button className="aqm-btn aqm-btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
