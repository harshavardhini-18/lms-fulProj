import React, { useState, useEffect } from 'react';
import './ModuleForm.css';

export default function ModuleForm({ module, onSave, saving }) {
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || '',
        description: module.description || '',
      });
    }
  }, [module]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mf-form">
      <div className="mf-section">
        <h3 className="mf-section-title">Module Details</h3>

        <div className="mf-field">
          <label className="mf-label">
            Title <span className="mf-required">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Getting Started with React"
            className="mf-input"
            required
          />
        </div>

        <div className="mf-field">
          <label className="mf-label">
            Description
            <span className="mf-char-count">{formData.description.length}/2000</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What will students learn in this module?"
            className="mf-textarea"
            rows={4}
            maxLength={2000}
          />
        </div>
      </div>

      <div className="mf-actions">
        <button type="submit" disabled={saving} className="mf-save-btn">
          {saving ? (
            <>
              <span className="mf-spinner" />
              Saving…
            </>
          ) : (
            'Save Module'
          )}
        </button>
      </div>
    </form>
  );
}
