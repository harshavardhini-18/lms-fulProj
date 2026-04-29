import React, { useState, useEffect } from 'react';
import './CourseForm.css';

export default function CourseForm({ course, onSave, saving }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    level: 'beginner',
    status: 'draft',
    language: 'en',
    instructor: '',
    price: 0,
    isFree: true,
    thumbnailUrl: '',
    bannerUrl: '',
    tags: '',
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        level: course.level || 'beginner',
        status: course.status || 'draft',
        language: course.language || 'en',
        instructor: course.instructor || '',
        price: course.price || 0,
        isFree: course.isFree !== undefined ? course.isFree : true,
        thumbnailUrl: course.thumbnailUrl || '',
        bannerUrl: course.bannerUrl || '',
        tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({
      ...formData,
      tags: tagsArray,
      price: formData.isFree ? 0 : formData.price,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="course-form">
      {/* Basic Info */}
      <section className="form-section">
        <h3>Basic Information</h3>
        
        <div className="form-group">
          <label>Course Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., React Fundamentals"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Subtitle</label>
          <input
            type="text"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            placeholder="Optional subtitle"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what students will learn..."
            required
            className="form-textarea"
            rows="4"
          />
          <small>{formData.description.length}/20000 characters</small>
        </div>

        <div className="form-row-3">
          <div className="form-group">
            <label>Level</label>
            <select name="level" value={formData.level} onChange={handleChange} className="form-select">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="form-select">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      {/* Instructor & Pricing */}
      <section className="form-section">
        <h3>Instructor & Pricing</h3>

        <div className="form-group">
          <label>Instructor Name</label>
          <input
            type="text"
            name="instructor"
            value={formData.instructor}
            onChange={handleChange}
            placeholder="Your name or team name"
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isFree"
                checked={formData.isFree}
                onChange={handleChange}
              />
              <span>Free Course</span>
            </label>
          </div>

          {!formData.isFree && (
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-input"
              />
            </div>
          )}
        </div>
      </section>

      {/* Media */}
      <section className="form-section">
        <h3>Media</h3>

        <div className="form-group">
          <label>Thumbnail Image URL</label>
          <input
            type="url"
            name="thumbnailUrl"
            value={formData.thumbnailUrl}
            onChange={handleChange}
            placeholder="https://example.com/thumbnail.jpg"
            className="form-input"
          />
          {formData.thumbnailUrl && (
            <div className="image-preview">
              <img src={formData.thumbnailUrl} alt="Thumbnail preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Banner Image URL</label>
          <input
            type="url"
            name="bannerUrl"
            value={formData.bannerUrl}
            onChange={handleChange}
            placeholder="https://example.com/banner.jpg"
            className="form-input"
          />
          {formData.bannerUrl && (
            <div className="image-preview large">
              <img src={formData.bannerUrl} alt="Banner preview" />
            </div>
          )}
        </div>
      </section>

      {/* Tags */}
      <section className="form-section">
        <h3>Tags</h3>

        <div className="form-group">
          <label>Tags (comma-separated)</label>
          <textarea
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., React, JavaScript, Web Development"
            className="form-textarea"
            rows="2"
          />
          <small>Enter tags separated by commas</small>
        </div>

        {formData.tags && (
          <div className="tags-preview">
            {formData.tags.split(',').map((tag, idx) => (
              tag.trim() && (
                <span key={idx} className="tag-chip">
                  {tag.trim()}
                </span>
              )
            ))}
          </div>
        )}
      </section>

      <div className="form-actions">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Course'}
        </button>
      </div>
    </form>
  );
}
