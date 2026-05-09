import React, { useEffect, useRef, useState } from 'react';
import { adminCourseService } from '../services/adminCourseService';
import { adminQuizService } from '../services/adminQuizService';
import Toast from '../components/common/Toast';
import './AdminQuizManagement.css';

// ─── helpers ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyMcqChoice() {
  return { id: uid(), label: '', isCorrect: false };
}

function emptyQuestion(type = 'mcq') {
  const base = { id: uid(), type, question: '' };
  if (type === 'mcq') return { ...base, choices: [emptyMcqChoice(), emptyMcqChoice()] };
  if (type === 'fill_blank') return { ...base, acceptedAnswers: [''] };
  if (type === 'code_image') return { ...base, codeImageUrl: '', choices: [emptyMcqChoice(), emptyMcqChoice()] };
  return base;
}

const CHOICE_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function emptyQuiz(courseId, subtopicId) {
  return {
    title: '',
    description: '',
    triggerTimestampSeconds: 0,
    courseId,
    subtopicId,
    status: 'active',
    questions: [emptyQuestion('mcq')],
  };
}

const TYPE_LABELS = { mcq: 'Multiple Choice', fill_blank: 'Fill in the Blank', code_image: 'Code Snippet' };

// ─── QuestionCard ────────────────────────────────────────────────────────────

function QuestionCard({ question, index, onChange, onDelete, total, isActive, onActivate }) {
  const fileRef = useRef();

  function updateField(key, value) {
    onChange({ ...question, [key]: value });
  }

  function updateChoice(cIndex, key, value) {
    const choices = question.choices.map((c, i) =>
      i === cIndex ? { ...c, [key]: value } : key === 'isCorrect' && value ? { ...c, isCorrect: false } : c
    );
    onChange({ ...question, choices });
  }

  function addChoice() {
    if ((question.choices?.length ?? 0) >= 5) return;
    onChange({ ...question, choices: [...(question.choices || []), emptyMcqChoice()] });
  }

  function removeChoice(cIndex) {
    if ((question.choices?.length ?? 0) <= 2) return;
    onChange({ ...question, choices: question.choices.filter((_, i) => i !== cIndex) });
  }

  function updateAnswer(aIndex, value) {
    const arr = [...(question.acceptedAnswers || [''])];
    arr[aIndex] = value;
    onChange({ ...question, acceptedAnswers: arr });
  }

  function addAnswer() {
    onChange({ ...question, acceptedAnswers: [...(question.acceptedAnswers || ['']), ''] });
  }

  function removeAnswer(aIndex) {
    if ((question.acceptedAnswers?.length ?? 1) <= 1) return;
    onChange({ ...question, acceptedAnswers: question.acceptedAnswers.filter((_, i) => i !== aIndex) });
  }

  function handleCodeImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => updateField('codeImageUrl', ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const choiceList = (namePrefix, showRemove) => (
    <div className="aqm-choices">
      <p className="aqm-choices-label">
        Answer choices
        <span className="aqm-hint"> — select the correct one</span>
      </p>
      {(question.choices || []).map((choice, cIdx) => (
        <div
          key={choice.id}
          className={`aqm-choice-row ${choice.isCorrect ? 'is-correct' : ''}`}
          onClick={() => updateChoice(cIdx, 'isCorrect', true)}
        >
          <span className="aqm-choice-letter">{CHOICE_LETTERS[cIdx] ?? cIdx + 1}</span>
          <input
            type="radio"
            name={`${namePrefix}-${question.id}`}
            checked={choice.isCorrect}
            onChange={() => updateChoice(cIdx, 'isCorrect', true)}
            className="aqm-radio-hidden"
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            className="aqm-choice-input"
            placeholder={`Option ${CHOICE_LETTERS[cIdx] ?? cIdx + 1}`}
            value={choice.label}
            onChange={(e) => updateChoice(cIdx, 'label', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onFocus={onActivate}
          />
          {showRemove && (question.choices?.length ?? 0) > 2 && (
            <button
              type="button"
              className="aqm-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                removeChoice(cIdx);
              }}
              title="Remove"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {(question.choices?.length ?? 0) < 5 && (
        <button type="button" className="aqm-add-choice-btn" onClick={addChoice}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add option
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`aqm-qcard ${isActive ? 'is-active' : ''}`}
      onClick={onActivate}
      onFocusCapture={onActivate}
    >
      {/* ── toolbar ── */}
      <div className="aqm-qcard-header">
        <span className="aqm-qnum">Q{index + 1}</span>
        <div className="aqm-qcard-divider" />
        <select
          className="aqm-type-select"
          value={question.type}
          onChange={(e) => onChange(emptyQuestion(e.target.value))}
        >
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <div className="aqm-qcard-spacer" />
        {total > 1 && (
          <button type="button" className="aqm-icon-btn aqm-icon-btn--danger" onClick={onDelete} title="Delete question">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>

      {/* ── body ── */}
      <div className="aqm-qcard-body">
        <div className="aqm-field">
          <label className="aqm-label">Question</label>
          <textarea
            className="aqm-textarea"
            rows={2}
            placeholder="Write your question here…"
            value={question.question}
            onChange={(e) => updateField('question', e.target.value)}
            onFocus={onActivate}
          />
        </div>

        {question.type === 'mcq' && choiceList('correct', true)}

        {question.type === 'fill_blank' && (
          <div className="aqm-answers">
            <p className="aqm-choices-label">
              Accepted answers
              <span className="aqm-hint"> — case-insensitive, any one match counts</span>
            </p>
            {(question.acceptedAnswers || ['']).map((ans, aIdx) => (
              <div className="aqm-answer-row" key={aIdx}>
                <span className="aqm-answer-num">{aIdx + 1}</span>
                <input
                  type="text"
                  className="aqm-input"
                  placeholder={`Accepted answer ${aIdx + 1}`}
                  value={ans}
                  onChange={(e) => updateAnswer(aIdx, e.target.value)}
                  onFocus={onActivate}
                />
                {(question.acceptedAnswers?.length ?? 1) > 1 && (
                  <button type="button" className="aqm-icon-btn" onClick={() => removeAnswer(aIdx)} title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="aqm-add-choice-btn" onClick={addAnswer}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add answer
            </button>
          </div>
        )}

        {question.type === 'code_image' && (
          <div className="aqm-code-image-section">
            <p className="aqm-choices-label">Code snippet image</p>
            {question.codeImageUrl ? (
              <div className="aqm-code-preview">
                <img src={question.codeImageUrl} alt="Code snippet" />
                <button
                  type="button"
                  className="aqm-code-delete"
                  onClick={() => updateField('codeImageUrl', '')}
                  title="Remove image"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <button type="button" className="aqm-code-dropzone" onClick={() => fileRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload code snippet image</span>
                <small>PNG or JPG · Max 5MB</small>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCodeImage} />
            {choiceList('correct-ci', true)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QuizEditor ──────────────────────────────────────────────────────────────

function QuizEditor({ courseId, subtopic, existingQuiz, onSaved, onDeleted }) {
  const editorRef = useRef(null);
  function buildInitialQuiz() {
    return existingQuiz
      ? {
          title: existingQuiz.title || '',
          description: existingQuiz.description || '',
          triggerTimestampSeconds: existingQuiz.triggerTimestampSeconds ?? 0,
          status: existingQuiz.status || 'active',
          courseId,
          subtopicId: subtopic._id,
          questions: existingQuiz.questions?.length
            ? existingQuiz.questions
            : [emptyQuestion('mcq')],
        }
      : emptyQuiz(courseId, subtopic._id);
  }

  const [quiz, setQuiz] = useState(() =>
    buildInitialQuiz()
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState(() => buildInitialQuiz().questions[0]?.id || null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [previewSelections, setPreviewSelections] = useState({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  useEffect(() => {
    setQuiz(buildInitialQuiz());
    setError('');
    setActiveQuestionId(buildInitialQuiz().questions[0]?.id || null);
    setIsPreviewMode(false);
  }, [existingQuiz, subtopic._id, courseId]);

  useEffect(() => {
    if (!isPreviewMode) return;
    // Keep preview opening at the top so layout is stable.
    editorRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [isPreviewMode]);

  useEffect(() => {
    if (!quiz.questions.length) {
      setActiveQuestionId(null);
      return;
    }
    if (!quiz.questions.some((q) => q.id === activeQuestionId)) {
      setActiveQuestionId(quiz.questions[0].id);
    }
  }, [quiz.questions, activeQuestionId]);

  function updateQuestion(index, updated) {
    const questions = quiz.questions.map((q, i) => (i === index ? updated : q));
    setQuiz((prev) => ({ ...prev, questions }));
  }

  function addQuestion(type = 'mcq') {
    setQuiz((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion(type)] }));
  }

  function deleteQuestion(index) {
    setQuiz((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  }

  function validateQuiz() {
    if (!quiz.title.trim()) return 'Quiz title is required.';
    if (!quiz.questions.length) return 'Add at least one question.';
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.question.trim()) return `Question ${i + 1}: question text is required.`;
      if (q.type === 'mcq' || q.type === 'code_image') {
        if (!q.choices || q.choices.length < 2) return `Question ${i + 1}: at least 2 choices required.`;
        if (!q.choices.some((c) => c.isCorrect)) return `Question ${i + 1}: mark one correct choice.`;
        if (q.choices.some((c) => !c.label.trim())) return `Question ${i + 1}: all choices must have text.`;
        if (q.type === 'code_image' && !q.codeImageUrl) return `Question ${i + 1}: upload a code snippet image.`;
      }
      if (q.type === 'fill_blank') {
        const valid = (q.acceptedAnswers || []).filter((a) => a.trim());
        if (!valid.length) return `Question ${i + 1}: at least one accepted answer required.`;
      }
    }
    return null;
  }

  async function handleSave() {
    const err = validateQuiz();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          ...q,
          id: q.id || uid(),
          acceptedAnswers: q.type === 'fill_blank'
            ? (q.acceptedAnswers || []).filter((a) => a.trim())
            : undefined,
        })),
      };
      let saved;
      if (existingQuiz) {
        saved = await adminQuizService.update(existingQuiz.id || existingQuiz._id, payload);
      } else {
        saved = await adminQuizService.create(payload);
      }
      onSaved(saved);
    } catch (e) {
      setError(e.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingQuiz) return;
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await adminQuizService.remove(existingQuiz.id || existingQuiz._id);
      onDeleted();
    } catch (e) {
      setError(e.message || 'Failed to delete quiz');
    } finally {
      setDeleting(false);
    }
  }

  function handleReset() {
    setQuiz(buildInitialQuiz());
    setError('');
  }

  function handleTogglePreview() {
    setIsPreviewMode((prev) => {
      const next = !prev;
      if (next) {
        setPreviewQuestionIndex(0);
        setPreviewSelections({});
        setPreviewSubmitted(false);
      }
      return next;
    });
  }

  const previewQuestions = quiz.questions || [];
  const previewTotal = previewQuestions.length;
  const currentPreviewQuestion = previewQuestions[previewQuestionIndex] || null;

  function selectPreviewOption(questionId, value) {
    setPreviewSelections((prev) => ({ ...prev, [questionId]: value }));
  }

  function getPreviewScore() {
    let score = 0;
    for (const q of previewQuestions) {
      const key = q.id;
      const selected = previewSelections[key];
      if (q.type === 'fill_blank') {
        const normalized = String(selected || '').trim().toLowerCase();
        const accepted = (q.acceptedAnswers || []).map((a) => String(a || '').trim().toLowerCase());
        if (normalized && accepted.includes(normalized)) score += Number(q.marks || 1);
      } else {
        const correctChoice = (q.choices || []).find((c) => c.isCorrect);
        if (correctChoice && selected === correctChoice.id) score += Number(q.marks || 1);
      }
    }
    return score;
  }

  const previewMaxScore = previewQuestions.reduce((acc, q) => acc + Number(q.marks || 1), 0);

  return (
    <div className="aqm-editor-wrap" ref={editorRef}>
      {isPreviewMode && (
        <div className="aqm-preview-toolbar">
          <button
            type="button"
            className="aqm-preview-btn is-active"
            onClick={handleTogglePreview}
          >
            Back to Edit
          </button>
        </div>
      )}

      <div className="aqm-editor">
        {!isPreviewMode && (
          <div className="aqm-editor-head">
            <div className="aqm-editor-head-main">
              <h3 className="aqm-editor-title">
                {existingQuiz ? 'Edit Quiz' : 'Create Quiz'}
                <span className="aqm-topic-chip">{subtopic.title}</span>
              </h3>
              <p className="aqm-editor-sub">One quiz per topic · quiz is mandatory to proceed to next topic</p>
            </div>
            <button
              type="button"
              className="aqm-preview-btn"
              onClick={handleTogglePreview}
            >
              Preview
            </button>
          </div>
        )}

      {isPreviewMode ? (
        <div className="aqm-preview-wrap">
          {previewTotal === 0 ? (
            <div className="aqm-preview-empty">No questions to preview yet.</div>
          ) : (
            <div className="aqm-preview-exam">
              <div className="aqm-preview-progress-head">
                <span>Question {previewQuestionIndex + 1} of {previewTotal}</span>
                <span>{Math.round(((previewQuestionIndex + 1) / previewTotal) * 100)}%</span>
              </div>
              <div className="aqm-preview-progress-track">
                <div
                  className="aqm-preview-progress-fill"
                  style={{ width: `${((previewQuestionIndex + 1) / previewTotal) * 100}%` }}
                />
              </div>

              {currentPreviewQuestion ? (
                <article className="aqm-preview-question-block">
                  <h4 className="aqm-preview-q-title">Q{previewQuestionIndex + 1}</h4>
                  <p className="aqm-preview-question">
                    {currentPreviewQuestion.question || 'No question text'}
                  </p>

                  {currentPreviewQuestion.type === 'code_image' && currentPreviewQuestion.codeImageUrl ? (
                    <img className="aqm-preview-code" src={currentPreviewQuestion.codeImageUrl} alt="Code snippet preview" />
                  ) : null}

                  {(currentPreviewQuestion.type === 'mcq' || currentPreviewQuestion.type === 'code_image') && (
                    <div className="aqm-preview-options">
                      {(currentPreviewQuestion.choices || []).map((choice, idx) => {
                        const selected = previewSelections[currentPreviewQuestion.id] === choice.id;
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            className={`aqm-preview-option ${selected ? 'is-selected' : ''}`}
                            onClick={() => selectPreviewOption(currentPreviewQuestion.id, choice.id)}
                          >
                            <span className={`aqm-preview-radio ${selected ? 'is-selected' : ''}`} />
                            <span className="aqm-preview-option-label">
                              {String.fromCharCode(65 + idx)}. {choice.label || '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentPreviewQuestion.type === 'fill_blank' && (
                    <div className="aqm-preview-fill">
                      <input
                        type="text"
                        className="aqm-input"
                        placeholder="Type your answer..."
                        value={previewSelections[currentPreviewQuestion.id] || ''}
                        onChange={(e) => selectPreviewOption(currentPreviewQuestion.id, e.target.value)}
                      />
                    </div>
                  )}
                </article>
              ) : null}

              <div className="aqm-preview-actions">
                <button
                  type="button"
                  className="aqm-btn aqm-btn--ghost"
                  onClick={() => setPreviewQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={previewQuestionIndex === 0}
                >
                  Previous
                </button>
                {previewQuestionIndex < previewTotal - 1 ? (
                  <button
                    type="button"
                    className="aqm-btn aqm-btn--primary"
                    onClick={() => setPreviewQuestionIndex((prev) => Math.min(previewTotal - 1, prev + 1))}
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    className="aqm-btn aqm-btn--primary"
                    onClick={() => setPreviewSubmitted(true)}
                  >
                    Submit Quiz
                  </button>
                )}
              </div>

              {previewSubmitted ? (
                <div className="aqm-preview-score">
                  Score: {getPreviewScore()} / {previewMaxScore}
                </div>
              ) : null}
            </div>
          )}
          </div>
      ) : (
        <>
      <div className="aqm-editor-form">
        <h4 className="aqm-section-title">Quiz Info</h4>
        <div className="aqm-field-row">
          <div className="aqm-field aqm-field--grow">
            <label className="aqm-label">Quiz title <span className="aqm-req">*</span></label>
            <input
              type="text"
              className="aqm-input"
              placeholder="e.g. End-of-topic check"
              value={quiz.title}
              onChange={(e) => setQuiz((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div className="aqm-field aqm-field--status">
            <label className="aqm-label">Quiz status</label>
            <label className="aqm-status-toggle">
              <span className={`aqm-status-copy ${quiz.status === 'active' ? 'is-active' : ''}`}>
                {quiz.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <input
                type="checkbox"
                checked={quiz.status === 'active'}
                onChange={(e) => setQuiz((p) => ({ ...p, status: e.target.checked ? 'active' : 'inactive' }))}
              />
              <span className={`aqm-toggle-pill ${quiz.status === 'active' ? 'on' : ''}`} />
            </label>
          </div>
        </div>

        <div className="aqm-field">
          <label className="aqm-label">Description <span className="aqm-hint">(optional)</span></label>
          <textarea
            className="aqm-textarea"
            rows={2}
            placeholder="Short note about this quiz…"
            value={quiz.description}
            onChange={(e) => setQuiz((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
      </div>

      <div className="aqm-questions-header">
        <span className="aqm-questions-label">Questions ({quiz.questions.length})</span>
        <div className="aqm-add-q-btns">
          <button type="button" className="aqm-add-q-btn" onClick={() => addQuestion('mcq')}>+ MCQ</button>
          <button type="button" className="aqm-add-q-btn" onClick={() => addQuestion('fill_blank')}>+ Fill in Blank</button>
          <button type="button" className="aqm-add-q-btn" onClick={() => addQuestion('code_image')}>+ Code Snippet</button>
        </div>
      </div>

      <div className="aqm-questions-list">
        {quiz.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            total={quiz.questions.length}
            onChange={(updated) => updateQuestion(i, updated)}
            onDelete={() => deleteQuestion(i)}
            isActive={activeQuestionId === q.id}
            onActivate={() => setActiveQuestionId(q.id)}
          />
        ))}
      </div>

      {error && <p className="aqm-error">{error}</p>}

      <div className="aqm-editor-footer">
        {existingQuiz && (
          <button
            type="button"
            className="aqm-btn aqm-btn--danger"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? 'Deleting…' : 'Delete Quiz'}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="aqm-btn aqm-btn--ghost"
          onClick={handleReset}
          disabled={saving || deleting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="aqm-btn aqm-btn--primary"
          onClick={handleSave}
          disabled={saving || deleting}
        >
          {saving ? 'Saving…' : existingQuiz ? 'Save Changes' : 'Create Quiz'}
        </button>
      </div>
      </>
      )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminQuizManagement() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quizzes, setQuizzes] = useState({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    setLoadingCourses(true);
    adminCourseService
      .getAllCourses()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setCourses(list.filter((c) => c.status === 'published' || c.status === 'draft'));
      })
      .catch(() => showToast('Failed to load courses', 'error'))
      .finally(() => setLoadingCourses(false));
  }, []);

  async function handleSelectCourse(course) {
    setSelectedCourse(course);
    setSelectedModuleId(null);
    setSelectedTopic(null);
    setCourseDetail(null);
    setQuizzes({});
    setLoadingDetail(true);
    try {
      const res = await adminCourseService.getCourse(course._id || course.id);
      const detail = res?.data ?? res;
      setCourseDetail(detail);
    } catch {
      showToast('Failed to load course details', 'error');
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (!selectedCourse) return;
    const courseId = selectedCourse._id || selectedCourse.id;
    setLoadingQuizzes(true);
    adminQuizService
      .listByCourse(courseId)
      .then((list) => {
        const map = {};
        (Array.isArray(list) ? list : []).forEach((q) => {
          if (q.subtopicId) map[String(q.subtopicId)] = q;
        });
        setQuizzes(map);
      })
      .catch(() => {})
      .finally(() => setLoadingQuizzes(false));
  }, [selectedCourse]);

  const modules = courseDetail?.modules ?? [];

  function handleTopicClick(topic) {
    setSelectedTopic(topic);
  }

  function handleQuizSaved(saved) {
    const key = String(saved.subtopicId);
    setQuizzes((prev) => ({ ...prev, [key]: saved }));
    showToast('Quiz saved successfully');
  }

  function handleQuizDeleted() {
    if (!selectedTopic) return;
    const key = String(selectedTopic._id || selectedTopic.id);
    setQuizzes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast('Quiz deleted');
  }

  const currentQuiz = selectedTopic
    ? quizzes[String(selectedTopic._id || selectedTopic.id)] ?? null
    : null;

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
        <h1 className="aqm-page-title">Quizzes</h1>
        <p className="aqm-page-sub">Create and manage quizzes for each topic. Students must complete a quiz to proceed to the next topic.</p>
      </div>

      <div className="aqm-layout">
        {/* Left sidebar */}
        <aside className="aqm-sidebar">
          <div className="aqm-sidebar-section">
            <p className="aqm-sidebar-label">Course</p>
            {loadingCourses ? (
              <p className="aqm-loading-text">Loading…</p>
            ) : (
              <select
                className="aqm-course-select"
                value={selectedCourse ? String(selectedCourse._id || selectedCourse.id) : ''}
                onChange={(e) => {
                  const c = courses.find((x) => String(x._id || x.id) === e.target.value);
                  if (c) handleSelectCourse(c);
                }}
              >
                <option value="">— Select a course —</option>
                {courses.map((c) => (
                  <option key={c._id || c.id} value={String(c._id || c.id)}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCourse && (
            <div className="aqm-sidebar-section">
              <p className="aqm-sidebar-label">Modules</p>
              {loadingDetail ? (
                <p className="aqm-loading-text">Loading…</p>
              ) : modules.length === 0 ? (
                <p className="aqm-empty-text">No modules yet</p>
              ) : (
                <div className="aqm-module-list">
                  {modules.map((mod) => {
                    const modId = String(mod._id || mod.id);
                    const isExpanded = modId === selectedModuleId;
                    const modTopics = mod.lessons ?? mod.subtopics ?? [];
                    return (
                      <div key={modId} className="aqm-module-group">
                        <button
                          type="button"
                          className={`aqm-module-btn ${isExpanded ? 'active' : ''}`}
                          onClick={() => {
                            if (isExpanded) {
                              setSelectedModuleId(null);
                              setSelectedTopic(null);
                            } else {
                              setSelectedModuleId(modId);
                              setSelectedTopic(null);
                            }
                          }}
                        >
                          <svg
                            className={`aqm-module-chevron ${isExpanded ? 'is-open' : ''}`}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 6 15 12 9 18" />
                          </svg>
                          <span className="aqm-module-name">{mod.title}</span>
                          <span className="aqm-module-count">{modTopics.length}</span>
                        </button>

                        {isExpanded && (
                          <div className="aqm-topic-list">
                            {modTopics.length === 0 ? (
                              <p className="aqm-empty-text aqm-empty-text--nested">No topics in this module</p>
                            ) : (
                              modTopics.map((topic) => {
                                const topicId = String(topic._id || topic.id);
                                const hasQuiz = !!quizzes[topicId];
                                const isActive = String(selectedTopic?._id || selectedTopic?.id) === topicId;
                                return (
                                  <button
                                    key={topicId}
                                    type="button"
                                    className={`aqm-topic-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => handleTopicClick(topic)}
                                  >
                                    <span className="aqm-topic-dot" />
                                    <span className="aqm-topic-name">{topic.title}</span>
                                    {loadingQuizzes ? null : hasQuiz ? (
                                      <span className="aqm-quiz-badge aqm-quiz-badge--has">Quiz</span>
                                    ) : (
                                      <span className="aqm-quiz-badge aqm-quiz-badge--empty">No quiz</span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right panel */}
        <main className="aqm-main">
          {!selectedCourse ? (
            <div className="aqm-empty-state">
              <div className="aqm-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="aqm-empty-title">Select a course</h3>
              <p className="aqm-empty-desc">Choose a course from the left sidebar to manage its quizzes.</p>
            </div>
          ) : !selectedTopic ? (
            <div className="aqm-empty-state">
              <div className="aqm-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h3 className="aqm-empty-title">Select a topic</h3>
              <p className="aqm-empty-desc">Click any topic on the left to create or edit its quiz.</p>
            </div>
          ) : (
            <QuizEditor
              key={String(selectedTopic._id || selectedTopic.id)}
              courseId={String(selectedCourse._id || selectedCourse.id)}
              subtopic={selectedTopic}
              existingQuiz={currentQuiz}
              onSaved={handleQuizSaved}
              onDeleted={handleQuizDeleted}
            />
          )}
        </main>
      </div>
    </div>
  );
}
