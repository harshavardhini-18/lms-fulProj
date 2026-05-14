import React, { useEffect, useState } from 'react';

export default function CategoryEditorModal({ initial, onClose, onSubmit, submitting }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(initial?.name || '');
    setDescription(initial?.description || '');
    setError('');
  }, [initial]);

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required'); return; }
    setError('');
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
    } catch (e) {
      setError(e?.message || 'Failed to save category');
    }
  }

  return (
    <div className="aqm-modal-overlay" onClick={onClose}>
      <div className="aqm-modal aqm-modal--md" onClick={(e) => e.stopPropagation()}>
        <div className="aqm-modal-head">
          <h3>{initial ? 'Edit category' : 'New category'}</h3>
          <button className="aqm-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="aqm-modal-body">
          {error && <p className="aqm-error" style={{ marginBottom: 12 }}>{error}</p>}
          <div className="aqm-field">
            <label className="aqm-label">Name <span className="aqm-req">*</span></label>
            <input
              type="text"
              className="aqm-input"
              placeholder="e.g. Algorithms"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              disabled={submitting}
            />
          </div>
          <div className="aqm-field">
            <label className="aqm-label">Description <span className="aqm-hint">(optional)</span></label>
            <textarea
              className="aqm-textarea"
              rows={3}
              placeholder="What kind of questions belong here?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
        <div className="aqm-modal-foot">
          <button className="aqm-btn aqm-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="aqm-btn aqm-btn--primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : initial ? 'Save' : 'Create category'}
          </button>
        </div>
      </div>
    </div>
  );
}
