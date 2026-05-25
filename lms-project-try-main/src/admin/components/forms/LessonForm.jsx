import React, { useState, useEffect, useRef, useCallback } from 'react';
import LessonInlineContentEditor from './LessonInlineContentEditor';
import QuizPreviewModal from '../quiz/QuizPreviewModal';
import { adminQuizService } from '../../services/adminQuizService';
import './LessonForm.css';

const EMPTY_DOC = { type: 'doc', content: [] };

const STEP_LABELS = ['Topic info', 'Video', 'Content', 'Quiz info'];

/** Render a TipTap doc node as React for the student preview */
function renderPreviewNode(node, key) {
  if (!node || typeof node !== 'object') return null;
  const ch = Array.isArray(node.content)
    ? node.content.map((c, i) => renderPreviewNode(c, `${key}-${i}`))
    : null;

  if (node.type === 'text') {
    let el = node.text || '';
    (node.marks || []).forEach((m) => {
      if (m.type === 'bold') el = <strong key={`${key}b`}>{el}</strong>;
      if (m.type === 'italic') el = <em key={`${key}i`}>{el}</em>;
      if (m.type === 'underline') el = <u key={`${key}u`}>{el}</u>;
      if (m.type === 'code') el = <code key={`${key}c`} style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 4 }}>{el}</code>;
      if (m.type === 'link') el = <a key={`${key}a`} href={m.attrs?.href} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{el}</a>;
    });
    return <React.Fragment key={key}>{el}</React.Fragment>;
  }
  if (node.type === 'paragraph') return <p key={key} style={{ margin: '0 0 10px' }}>{ch}</p>;
  if (node.type === 'heading') {
    const lvl = node.attrs?.level || 2;
    const Tag = `h${lvl}`;
    return <Tag key={key} style={{ margin: '18px 0 8px', fontWeight: 700 }}>{ch}</Tag>;
  }
  if (node.type === 'bulletList') return <ul key={key} style={{ paddingLeft: 22, margin: '0 0 10px' }}>{ch}</ul>;
  if (node.type === 'orderedList') return <ol key={key} style={{ paddingLeft: 22, margin: '0 0 10px' }}>{ch}</ol>;
  if (node.type === 'listItem') return <li key={key} style={{ marginBottom: 4 }}>{ch}</li>;
  if (node.type === 'blockquote') return <blockquote key={key} style={{ borderLeft: '3px solid #6366f1', paddingLeft: 12, color: '#475569', margin: '0 0 10px' }}>{ch}</blockquote>;
  if (node.type === 'codeBlock') return <pre key={key} style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 14px', borderRadius: 8, overflowX: 'auto', fontSize: 13, margin: '0 0 10px' }}>{ch}</pre>;
  if (node.type === 'hardBreak') return <br key={key} />;
  if (node.type === 'image') {
    const src = node.attrs?.src;
    if (!src) return null;
    return <img key={key} src={src} alt={node.attrs?.alt || ''} style={{ maxWidth: '100%', borderRadius: 8, margin: '10px 0', display: 'block' }} />;
  }
  if (ch) return <React.Fragment key={key}>{ch}</React.Fragment>;
  return null;
}

function extractYoutubeId(url) {
  const m = String(url || '').match(/^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]+).*/);
  return m && m[1] && m[1].length >= 6 ? m[1] : null;
}

function extractVimeoId(url) {
  const m = String(url || '').match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function VideoInlinePreview({ url }) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return null;

  if (/youtu/i.test(trimmed)) {
    const id = extractYoutubeId(trimmed);
    if (!id) return <p className="lf-video-preview-error">Could not parse a YouTube ID from that URL.</p>;
    return (
      <iframe
        className="lf-video-preview-frame"
        src={`https://www.youtube.com/embed/${id}`}
        title="Video preview"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (/vimeo/i.test(trimmed)) {
    const id = extractVimeoId(trimmed);
    if (!id) return <p className="lf-video-preview-error">Could not parse a Vimeo ID from that URL.</p>;
    return (
      <iframe
        className="lf-video-preview-frame"
        src={`https://player.vimeo.com/video/${id}`}
        title="Video preview"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    );
  }
  return (
    <video className="lf-video-preview-frame" controls preload="metadata">
      <source src={trimmed} />
      Your browser does not support video playback.
    </video>
  );
}

function hasRenderableContent(doc) {
  if (!doc || typeof doc !== 'object') return false;
  const stack = [doc];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (current.type === 'text' && String(current.text || '').trim()) return true;
    if (current.type === 'image' && String(current.attrs?.src || '').trim()) return true;
    if (Array.isArray(current.content)) stack.push(...current.content);
  }
  return false;
}

export default function LessonForm({ lesson, onSave, saving }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    status: 'draft',
    videoUrl: '',
    videoDuration: '',
    videoType: 'mp4',
    thumbnailUrl: '',
    contentJson: EMPTY_DOC,
    quizId: '',
  });

  const [saveError, setSaveError] = useState('');
  const [stepError, setStepError] = useState('');
  const [contentViewMode, setContentViewMode] = useState('edit'); // 'edit' | 'preview'
  const thumbFileRef = useRef(null);

  const [quizOptions, setQuizOptions] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizPreview, setQuizPreview] = useState(null);

  const loadQuizOptions = useCallback(async () => {
    setQuizzesLoading(true);
    try {
      const all = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await adminQuizService.list({
          page,
          pageSize: 100,
          sort: 'title:asc',
          status: 'published',
        });
        all.push(...(res.data || []));
        totalPages = res.pagination?.totalPages || 1;
        page += 1;
      } while (page <= totalPages && page <= 50);
      setQuizOptions(all);
    } catch {
      setStepError('Could not load quizzes. Try Refresh or check you are logged in.');
    } finally {
      setQuizzesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 4) loadQuizOptions();
  }, [step, loadQuizOptions]);

  // Auto-refresh the quiz list when the user comes back from the "Add quiz" tab.
  useEffect(() => {
    if (step !== 4) return;
    function onFocus() { loadQuizOptions(); }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [step, loadQuizOptions]);

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        summary: lesson.summary || '',
        status: lesson.status || 'draft',
        videoUrl: lesson.videoUrl || '',
        videoDuration: lesson.videoDuration ?? '',
        videoType: lesson.videoType || 'mp4',
        thumbnailUrl: lesson.thumbnailUrl || '',
        contentJson: lesson.contentJson || EMPTY_DOC,
        quizId: lesson.quizId ? String(lesson.quizId) : '',
      });
      setSaveError('');
      setStepError('');
      setStep(1);
    }
  }, [lesson]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveError('');
    setStepError('');
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleThumbFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setStepError('Image must be PNG/JPG and less than 5MB.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, thumbnailUrl: dataUrl }));
      setStepError('');
    } catch {
      /* ignore */
    }
  };

  const clearThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
  };

  const goNext = () => {
    setStepError('');
    if (step === 1) {
      if (!formData.title.trim()) {
        setStepError('Topic title is required.');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setStepError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== 4) return;
    setSaveError('');

    if (!formData.title.trim()) {
      setSaveError('Topic title is required.');
      return;
    }

    if (formData.status === 'published' && !formData.videoUrl.trim()) {
      setSaveError('A video URL is required to publish this topic.');
      return;
    }

    if (formData.status === 'published' && !formData.summary.trim()) {
      setSaveError('Summary is required to publish this topic.');
      return;
    }

    if (formData.status === 'published' && !hasRenderableContent(formData.contentJson)) {
      setSaveError('Add topic content before publishing.');
      return;
    }

    onSave({
      title: formData.title.trim(),
      summary: formData.summary,
      status: formData.status,
      contentType: 'video',
      videoUrl: formData.videoUrl,
      videoDuration: Number(formData.videoDuration) || 0,
      videoType: formData.videoType,
      thumbnailUrl: formData.thumbnailUrl,
      contentJson: formData.contentJson,
      quizId: formData.quizId || '',
    });
  };

  const contentHasData = hasRenderableContent(formData.contentJson);

  async function handleOpenQuizPreview() {
    if (!formData.quizId) return;
    setStepError('');
    try {
      const quiz = await adminQuizService.getById(formData.quizId);
      const questions = (quiz.questions || []).map((q) => ({
        prompt: q.prompt,
        type: q.type,
        options: q.options || [],
        acceptedAnswers: q.acceptedAnswers || [],
        answerValidationMode: q.answerValidationMode || 'strict',
        codeImageUrl: q.codeImageUrl || '',
        effectivePoints: q.effectivePoints ?? q.points ?? 1,
      }));
      setQuizPreview({ title: quiz.title || 'Quiz', questions });
    } catch {
      setStepError('Could not load quiz for preview.');
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="lf-form">
        <div className="lf-wizard" aria-label="Topic setup steps">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <React.Fragment key={label}>
                <div className={`lf-wizard-stepcell${active ? ' active' : ''}${done ? ' done' : ''}`}>
                  <span className="lf-wizard-dot" aria-current={active ? 'step' : undefined}>
                    {done ? '✓' : n}
                  </span>
                  <span className="lf-wizard-label">{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <span className="lf-wizard-line" aria-hidden />}
              </React.Fragment>
            );
          })}
        </div>

        {stepError && (
          <div className="lf-step-error" role="alert">
            {stepError}
          </div>
        )}

        {/* Step 1 — Topic info */}
        {step === 1 && (
          <div className="lf-section">
            <h3 className="lf-section-title">Topic information</h3>
            <p className="lf-section-lead">Basics shown in the course outline (course → module → topic).</p>

            <div className="lf-field">
              <label className="lf-label">
                Title <span className="lf-required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Introduction to React Hooks"
                className="lf-input"
                required
              />
            </div>

            <div className="lf-field">
              <label className="lf-label">
                Summary
                <span className="lf-char-count">{formData.summary.length}/500</span>
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Short description shown below the topic title..."
                className="lf-textarea"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="lf-field lf-field-narrow">
              <label className="lf-label">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="lf-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2 — Video & thumbnail */}
        {step === 2 && (
          <div className="lf-section">
            <h3 className="lf-section-title">Video & thumbnail</h3>
            <p className="lf-section-lead">Primary video and preview image for this topic.</p>

            <div className="lf-field">
              <label className="lf-label">Video URL</label>
              <input
                type="text"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="YouTube, Vimeo, or direct file URL"
                className="lf-input"
              />
              {formData.videoUrl && (
                <div className="lf-video-preview-wrap">
                  <VideoInlinePreview url={formData.videoUrl} />
                </div>
              )}
            </div>

            <div className="lf-row">
              <div className="lf-field">
                <label className="lf-label">Duration (seconds)</label>
                <input
                  type="number"
                  name="videoDuration"
                  value={formData.videoDuration}
                  onChange={handleChange}
                  placeholder="e.g. 312"
                  className="lf-input"
                  min="0"
                />
              </div>
              <div className="lf-field">
                <label className="lf-label">Video format</label>
                <select name="videoType" value={formData.videoType} onChange={handleChange} className="lf-select">
                  <option value="mp4">MP4</option>
                  <option value="hls">HLS</option>
                </select>
              </div>
            </div>

            <div className="lf-field">
              <label className="lf-label">Thumbnail image</label>
              <input
                ref={thumbFileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="lf-file-input"
                onChange={handleThumbFile}
              />
              {!formData.thumbnailUrl ? (
                <button type="button" className="lf-media-dropzone" onClick={() => thumbFileRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="lf-dropzone-copy">
                    <span>Upload image</span>
                    <small>PNG or JPG • Max 5MB</small>
                  </span>
                </button>
              ) : (
                <div className="lf-img-preview-wrap lf-media-preview-wrap">
                  <div className="lf-thumb-preview">
                    <img src={formData.thumbnailUrl} alt="Thumbnail preview" onError={(e) => { e.target.style.opacity = '0.3'; }} />
                  </div>
                  <button type="button" className="lf-preview-delete" onClick={clearThumbnail} title="Remove thumbnail" aria-label="Remove thumbnail">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Rich content */}
        {step === 3 && (
          <div className="lf-section">
            <div className="lf-content-header">
              <div>
                <h3 className="lf-section-title">Topic content</h3>
              </div>
              {/* Edit / Preview toggle */}
              <div className="lf-mode-toggle">
                <button
                  type="button"
                  className={`lf-mode-btn${contentViewMode === 'edit' ? ' active' : ''}`}
                  onClick={() => setContentViewMode('edit')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
                <button
                  type="button"
                  className={`lf-mode-btn${contentViewMode === 'preview' ? ' active' : ''}`}
                  onClick={() => setContentViewMode('preview')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  Preview
                </button>
              </div>
            </div>

            {/* ── EDIT MODE ── */}
            {contentViewMode === 'edit' && (
              <div className="lf-content-block">
                <LessonInlineContentEditor
                  value={formData.contentJson}
                  onChange={(json) => setFormData((prev) => ({ ...prev, contentJson: json }))}
                />
              </div>
            )}

            {/* ── PREVIEW MODE ── (what student sees) */}
            {contentViewMode === 'preview' && (
              <div className="lf-preview-wrap">
                <div className="lf-preview-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  Student view — read only
                </div>
                <div className="lf-preview-card">
                  {/* Simulated video player placeholder */}
                  {formData.videoUrl ? (
                    <div className="lf-preview-video-placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      <span>Video: {formData.videoUrl.length > 48 ? formData.videoUrl.slice(0, 48) + '…' : formData.videoUrl}</span>
                    </div>
                  ) : null}

                  {/* Topic title */}
                  <h2 className="lf-preview-title">{formData.title || 'Untitled topic'}</h2>
                  {formData.summary && <p className="lf-preview-summary">{formData.summary}</p>}

                  {/* Rendered content */}
                  <div className="lf-preview-content">
                    {contentHasData
                      ? (formData.contentJson.content || []).map((node, i) =>
                          renderPreviewNode(node, `prev-${i}`)
                        )
                      : <p className="lf-preview-empty">No content added yet.</p>
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Quiz (optional, one per topic) */}
        {step === 4 && (
          <div className="lf-section">
            <h3 className="lf-section-title">Quiz info</h3>
            <p className="lf-section-lead">
              Link one quiz from your bank to this topic. Pick from existing quizzes, or open the Quizzes admin to build a new one.
            </p>

            <div className="lf-quiz-card">
              <label className="lf-label" htmlFor="lf-topic-quiz">Topic quiz</label>
              <div className="lf-quiz-controls">
                <div className="lf-quiz-select-wrap">
                  <select
                    id="lf-topic-quiz"
                    name="quizId"
                    value={formData.quizId}
                    onChange={handleChange}
                    className="lf-select lf-quiz-select"
                    disabled={quizzesLoading}
                  >
                    <option value="">
                      {quizzesLoading ? 'Loading quizzes…' : 'Select quiz'}
                    </option>
                    {quizOptions.map((q) => (
                      <option key={q.id} value={String(q.id)}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="lf-quiz-preview-btn"
                  onClick={handleOpenQuizPreview}
                  disabled={!formData.quizId || quizzesLoading}
                  title={formData.quizId ? 'Preview this quiz as a student' : 'Select a quiz to enable preview'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Preview
                </button>
              </div>

              {!formData.quizId && !quizzesLoading && (
                <p className="lf-quiz-hint">Optional — you can save the topic without a quiz.</p>
              )}
            </div>
          </div>
        )}

        {saveError && (
          <div className="lf-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {saveError}
          </div>
        )}

        <div className="lf-actions">
          <div className="lf-status-hint">
            {formData.status === 'published' ? (
              <span className="lf-hint-published">● Visible to students when saved</span>
            ) : (
              <span className="lf-hint-draft">● Saved as draft — not visible to students</span>
            )}
          </div>
          <div className="lf-actions-nav">
            {step > 1 && (
              <button type="button" className="lf-back-btn" onClick={goBack} disabled={saving}>
                Back
              </button>
            )}
            {step < 4 && (
              <button type="button" className="lf-next-btn" onClick={goNext} disabled={saving}>
                Next
              </button>
            )}
            {step === 4 && (
              <button type="submit" disabled={saving} className="lf-save-btn">
                {saving ? (
                  <>
                    <span className="lf-spinner" />
                    Saving…
                  </>
                ) : (
                  'Save topic'
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {quizPreview && (
        <QuizPreviewModal
          quizTitle={quizPreview.title}
          questions={quizPreview.questions}
          onClose={() => setQuizPreview(null)}
        />
      )}
    </>
  );
}
