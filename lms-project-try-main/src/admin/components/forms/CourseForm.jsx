import React, { useState, useEffect, useRef } from 'react';
import './CourseForm.css';

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const STEP_LABELS = ['Basic info', 'Media', 'Tags'];

export default function CourseForm({ course, onSave, saving }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    level: 'beginner',
    status: 'draft',
    instructor: '',
    isFree: true,
    price: '',
    thumbnailUrl: '',
    bannerUrl: '',
    tags: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState([]);
  const [stepError, setStepError] = useState('');
  const thumbFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  useEffect(() => {
    if (course) {
      const tags = Array.isArray(course.tags) ? course.tags : [];
      setFormData({
        title: course.title || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        level: course.level || 'beginner',
        status: course.status || 'draft',
        instructor: course.instructor || '',
        isFree: course.isFree !== undefined ? course.isFree : true,
        price: course.price || '',
        thumbnailUrl: course.thumbnailUrl || '',
        bannerUrl: course.bannerUrl || '',
        tags: '',
      });
      setTagList(tags);
      setStep(1);
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTagList((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleImageFile = async (field, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setStepError('Image must be PNG/JPG and less than 5MB.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, [field]: dataUrl }));
      setStepError('');
    } catch {
      /* ignore */
    }
  };

  const clearImage = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const goNext = () => {
    setStepError('');
    if (step === 1) {
      if (!formData.title.trim()) {
        setStepError('Course title is required.');
        return;
      }
      if (!formData.description.trim()) {
        setStepError('Description is required.');
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setStepError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== 3) return;
    onSave({
      ...formData,
      tags: tagList,
      price: formData.isFree ? 0 : Number(formData.price) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cf-form">
      {/* Step indicator */}
      <div className="cf-wizard" aria-label="Course setup steps">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <React.Fragment key={label}>
              <div className={`cf-wizard-stepcell${active ? ' active' : ''}${done ? ' done' : ''}`}>
                <span className="cf-wizard-dot" aria-current={active ? 'step' : undefined}>
                  {done ? '✓' : n}
                </span>
                <span className="cf-wizard-label">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <span className="cf-wizard-line" aria-hidden />}
            </React.Fragment>
          );
        })}
      </div>

      {stepError && (
        <div className="cf-step-error" role="alert">
          {stepError}
        </div>
      )}

      {/* Step 1 — Basic info + instructor & pricing */}
      {step === 1 && (
        <>
          <div className="cf-section">
            <h3 className="cf-section-title">Basic information</h3>

            <div className="cf-field cf-field-full">
              <label className="cf-label">
                Course Title <span className="cf-required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Advanced React Development 2024"
                className="cf-input"
                required
                maxLength={220}
              />
              <span className="cf-hint">{formData.title.length}/220</span>
            </div>

            <div className="cf-field cf-field-full">
              <label className="cf-label">Subtitle</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="Optional subtitle — max 220 characters"
                className="cf-input"
                maxLength={220}
              />
              <span className="cf-hint">{formData.subtitle.length}/220</span>
            </div>

            <div className="cf-field cf-field-full">
              <label className="cf-label">
                Description <span className="cf-required">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of what students will learn..."
                className="cf-textarea"
                rows={5}
                required
                maxLength={20000}
              />
              <span className="cf-hint">{formData.description.length}/20000</span>
            </div>

            <div className="cf-row">
              <div className="cf-field">
                <label className="cf-label">Level</label>
                <select name="level" value={formData.level} onChange={handleChange} className="cf-select">
                  {LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="cf-field">
                <label className="cf-label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="cf-select">
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="cf-section">
            <h3 className="cf-section-title">Instructor & pricing</h3>

            <div className="cf-field">
              <label className="cf-label">Instructor name</label>
              <input
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleChange}
                placeholder="Your name or team name"
                className="cf-input"
              />
            </div>

            <div className="cf-pricing-block">
              <label className="cf-toggle-label">
                <div className="cf-toggle-switch">
                  <input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} />
                  <span className="cf-toggle-track" />
                </div>
                <span>Free course</span>
              </label>

              {!formData.isFree && (
                <div className="cf-field cf-price-field">
                  <label className="cf-label">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    className="cf-input cf-price-input"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Step 2 — Media */}
      {step === 2 && (
        <div className="cf-section">
          <h3 className="cf-section-title">Media</h3>

          <div className="cf-media-grid">
            <div className="cf-media-card">
              <label className="cf-label">Banner image</label>
              <input ref={bannerFileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="cf-file-input" onChange={(e) => handleImageFile('bannerUrl', e)} />
              {!formData.bannerUrl ? (
                <button type="button" className="cf-media-dropzone" onClick={() => bannerFileRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  <span className="cf-dropzone-copy">
                    <span>Upload image</span>
                    <small>PNG or JPG • Max 5MB</small>
                  </span>
                </button>
              ) : (
                <div className="cf-img-preview-wrap cf-media-preview-wrap">
                  <div className="cf-img-preview cf-img-banner">
                    <img
                      src={formData.bannerUrl}
                      alt="Banner preview"
                      onError={(e) => { e.target.closest('.cf-img-preview-wrap')?.classList.add('cf-img-error'); }}
                    />
                  </div>
                  <button type="button" className="cf-preview-delete" onClick={() => clearImage('bannerUrl')} title="Remove banner" aria-label="Remove banner">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>

            <div className="cf-media-card">
              <label className="cf-label">Thumbnail image</label>
              <input ref={thumbFileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="cf-file-input" onChange={(e) => handleImageFile('thumbnailUrl', e)} />
              {!formData.thumbnailUrl ? (
                <button type="button" className="cf-media-dropzone" onClick={() => thumbFileRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  <span className="cf-dropzone-copy">
                    <span>Upload image</span>
                    <small>PNG or JPG • Max 5MB</small>
                  </span>
                </button>
              ) : (
                <div className="cf-img-preview-wrap cf-media-preview-wrap">
                  <div className="cf-img-preview cf-img-thumb">
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail preview"
                      onError={(e) => { e.target.closest('.cf-img-preview-wrap')?.classList.add('cf-img-error'); }}
                    />
                  </div>
                  <button type="button" className="cf-preview-delete" onClick={() => clearImage('thumbnailUrl')} title="Remove thumbnail" aria-label="Remove thumbnail">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Tags */}
      {step === 3 && (
        <div className="cf-section">
          <h3 className="cf-section-title">Tags</h3>
          <p className="cf-section-lead">Help students discover this course with searchable tags.</p>

          <div className="cf-field">
            <label className="cf-label">Add tags</label>
            <div className="cf-tag-input-row">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
                className="cf-input"
              />
              <button type="button" className="cf-tag-add-btn" onClick={addTag}>
                Add
              </button>
            </div>
            <span className="cf-hint">Press Enter or comma to add a tag</span>
          </div>

          {tagList.length > 0 && (
            <div className="cf-tags-list">
              {tagList.map((tag) => (
                <span key={tag} className="cf-tag-chip">
                  {tag}
                  <button
                    type="button"
                    className="cf-tag-remove"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="cf-actions">
        <div className="cf-status-badge">
          <span className={`cf-status ${formData.status}`}>{formData.status}</span>
        </div>
        <div className="cf-actions-nav">
          {step > 1 && (
            <button type="button" className="cf-back-btn" onClick={goBack} disabled={saving}>
              Back
            </button>
          )}
          {step < 3 && (
            <button type="button" className="cf-next-btn" onClick={goNext} disabled={saving}>
              Next
            </button>
          )}
          {step === 3 && (
            <button type="submit" disabled={saving} className="cf-save-btn">
              {saving ? (
                <>
                  <span className="cf-spinner" />
                  Saving…
                </>
              ) : (
                'Save course'
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
