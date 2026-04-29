import React, { useState, useEffect } from 'react';
import './ModuleForm.css';

export default function ModuleForm({ module, onSave, saving }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="module-form">
      <section className="form-section">
        <h3>Module Details</h3>

        <div className="form-group">
          <label>Module Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Module 1: Basics"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what this module covers..."
            className="form-textarea"
            rows="3"
          />
          <small>{formData.description.length}/2000 characters</small>
        </div>
      </section>

      <div className="form-actions">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Module'}
        </button>
      </div>
    </form>
  );
}
