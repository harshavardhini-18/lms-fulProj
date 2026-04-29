import React, { useState, useEffect } from 'react';
import './LessonForm.css';

export default function LessonForm({ lesson, onSave, saving }) {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    status: 'draft',
    contentType: 'video',
    videoUrl: '',
    videoDuration: 0,
    videoType: 'mp4',
    thumbnailUrl: '',
    version: 1,
    contentJsonText: JSON.stringify({ type: 'doc', content: [] }, null, 2),
    textContent: '',
    description: '',
    quizId: '',
    assignmentDetails: {
      instructions: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        summary: lesson.summary || '',
        status: lesson.status || 'draft',
        contentType: lesson.contentType || 'video',
        videoUrl: lesson.videoUrl || '',
        videoDuration: lesson.videoDuration || 0,
        videoType: lesson.videoType || 'mp4',
        thumbnailUrl: lesson.thumbnailUrl || '',
        version: lesson.version || 1,
        contentJsonText: JSON.stringify(
          lesson.contentJson || { type: 'doc', content: [] },
          null,
          2
        ),
        textContent: lesson.textContent || '',
        description: lesson.description || '',
        quizId: lesson.quizId || '',
        assignmentDetails: {
          instructions: lesson.assignmentDetails?.instructions || '',
          dueDate: lesson.assignmentDetails?.dueDate ? lesson.assignmentDetails.dueDate.split('T')[0] : '',
        },
      });
    }
  }, [lesson]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      assignmentDetails: {
        ...prev.assignmentDetails,
        [name]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let parsedContentJson;
    try {
      parsedContentJson = JSON.parse(formData.contentJsonText || '{}');
    } catch {
      window.alert('Invalid Content JSON. Please fix JSON format.');
      return;
    }

    onSave({
      title: formData.title,
      summary: formData.summary,
      status: formData.status,
      contentType: formData.contentType,
      videoUrl: formData.videoUrl,
      videoDuration: Number(formData.videoDuration || 0),
      videoType: formData.videoType,
      thumbnailUrl: formData.thumbnailUrl,
      version: Number(formData.version || 1),
      contentJson: parsedContentJson,
      textContent: formData.textContent,
      description: formData.description,
      quizId: formData.quizId,
      assignmentDetails: formData.assignmentDetails,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="lesson-form">
      {/* Basic Info */}
      <section className="form-section">
        <h3>Lesson Information</h3>

        <div className="form-group">
          <label>Lesson Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Getting Started with React"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Summary (max 500 chars)</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="Short intro shown below lesson title..."
            className="form-textarea"
            rows="2"
            maxLength="500"
          />
        </div>

        <div className="form-group">
          <label>Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-select"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="form-group">
          <label>Content Type *</label>
          <select
            name="contentType"
            value={formData.contentType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="video">Video</option>
            <option value="text">Text/Article</option>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of this lesson..."
            className="form-textarea"
            rows="2"
          />
        </div>
      </section>

      {/* Content Type Specific */}
      {formData.contentType === 'video' && (
        <section className="form-section">
          <h3>Video Content</h3>

          <div className="form-group">
            <label>Video URL *</label>
            <input
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=... or your video URL"
              required
              className="form-input"
            />
            <small>Supports YouTube, Vimeo, or direct video URLs</small>
          </div>

          <div className="form-group">
            <label>Video Duration (seconds)</label>
            <input
              type="number"
              name="videoDuration"
              value={formData.videoDuration}
              onChange={handleChange}
              min="0"
              placeholder="Auto-detected or enter manually"
              className="form-input"
            />
            <small>Leave blank for auto-detection</small>
          </div>

          <div className="form-group">
            <label>Video Type *</label>
            <select
              name="videoType"
              value={formData.videoType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="mp4">MP4</option>
              <option value="hls">HLS</option>
            </select>
          </div>

          <div className="form-group">
            <label>Thumbnail URL</label>
            <input
              type="url"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://...thumbnail.jpg"
              className="form-input"
            />
          </div>
        </section>
      )}

      {formData.contentType === 'text' && (
        <section className="form-section">
          <h3>Text Content</h3>

          <div className="form-group">
            <label>Content (Markdown supported)</label>
            <textarea
              name="textContent"
              value={formData.textContent}
              onChange={handleChange}
              placeholder="Enter your text content here... Markdown is supported"
              className="form-textarea code-textarea"
              rows="6"
            />
            <small>Supports Markdown formatting</small>
          </div>
        </section>
      )}

      {formData.contentType === 'assignment' && (
        <section className="form-section">
          <h3>Assignment Details</h3>

          <div className="form-group">
            <label>Assignment Instructions</label>
            <textarea
              name="instructions"
              value={formData.assignmentDetails.instructions}
              onChange={handleAssignmentChange}
              placeholder="Describe the assignment task..."
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Due Date (Optional)</label>
            <input
              type="date"
              name="dueDate"
              value={formData.assignmentDetails.dueDate}
              onChange={handleAssignmentChange}
              className="form-input"
            />
          </div>
        </section>
      )}

      <section className="form-section">
        <h3>Structured Lesson Content (JSON)</h3>
        <div className="form-group">
          <label>Content JSON *</label>
          <textarea
            name="contentJsonText"
            value={formData.contentJsonText}
            onChange={handleChange}
            className="form-textarea code-textarea"
            rows="10"
            placeholder='{"type":"doc","content":[...]}'
          />
          <small>Temporary input until TipTap editor is integrated.</small>
        </div>

        <div className="form-group">
          <label>Version</label>
          <input
            type="number"
            name="version"
            value={formData.version}
            min="1"
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </section>

      <div className="form-actions">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>
    </form>
  );
}
