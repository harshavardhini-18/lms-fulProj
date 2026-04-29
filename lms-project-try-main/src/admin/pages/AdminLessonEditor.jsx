import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminLessonService } from '../services/adminLessonService';
import { adminQuizService } from '../services/adminQuizService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import VideoPreview from '../components/common/VideoPreview';
import './AdminLessonEditor.css';

export default function AdminLessonEditor() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    videoDuration: 0,
    learningOutcomes: [],
    resources: [],
    quizId: '',
    passingScore: 70,
  });

  const [newOutcome, setNewOutcome] = useState('');
  const [newResource, setNewResource] = useState('');

  useEffect(() => {
    fetchLessonData();
    fetchQuizzes();
  }, [courseId, moduleId, lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const response = await adminLessonService.getLesson(courseId, moduleId, lessonId);
      const lesson = response.data;
      setLesson(lesson);
      setFormData({
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl || '',
        videoDuration: lesson.videoDuration || 0,
        learningOutcomes: lesson.learningOutcomes || [],
        resources: lesson.resources || [],
        quizId: lesson.quizId || '',
        passingScore: lesson.passingScore || 70,
      });
    } catch (error) {
      showToast('Failed to load lesson', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await adminQuizService.getAllQuizzes();
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'videoDuration' || name === 'passingScore' ? parseInt(value) : value
    }));
  };

  const handleAddOutcome = () => {
    if (!newOutcome.trim()) return;
    setFormData(prev => ({
      ...prev,
      learningOutcomes: [...prev.learningOutcomes, newOutcome]
    }));
    setNewOutcome('');
    showToast('Outcome added!', 'success');
  };

  const handleRemoveOutcome = (index) => {
    setFormData(prev => ({
      ...prev,
      learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
    }));
  };

  const handleAddResource = () => {
    if (!newResource.trim()) return;
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, newResource]
    }));
    setNewResource('');
    showToast('Resource added!', 'success');
  };

  const handleRemoveResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      showToast('Lesson title is required', 'error');
      return;
    }
    if (!formData.videoUrl.trim()) {
      showToast('Video URL is required', 'error');
      return;
    }
    if (formData.videoDuration <= 0) {
      showToast('Video duration must be greater than 0', 'error');
      return;
    }

    try {
      setSaving(true);
      await adminLessonService.updateLesson(courseId, moduleId, lessonId, formData);
      showToast('Lesson saved successfully!', 'success');
      setTimeout(() => navigate(`/admin/courses/${courseId}`), 1500);
    } catch (error) {
      showToast('Error saving lesson', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="lesson-editor">
      <div className="editor-breadcrumb">
        <Link to={`/admin/courses/${courseId}`} className="breadcrumb-link">
          ← Back to Course
        </Link>
      </div>

      <h1 className="editor-title">Editing Lesson: {formData.title}</h1>

      <div className="editor-layout">
        <div className="editor-main">
          {/* Lesson Details */}
          <section className="editor-section">
            <h2>Lesson Details</h2>

            <div className="form-group">
              <label>Lesson Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                className="form-input"
                placeholder="e.g., Understanding React Hooks"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="form-textarea"
                rows="4"
                placeholder="What will students learn in this lesson?"
              />
            </div>

            <div className="form-group">
              <label>Learning Outcomes</label>
              <div className="outcomes-input">
                <input
                  type="text"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="e.g., Understand useState hook"
                  className="form-input"
                />
                <button onClick={handleAddOutcome} className="btn-small">
                  Add
                </button>
              </div>

              {formData.learningOutcomes.length > 0 && (
                <ul className="outcomes-list">
                  {formData.learningOutcomes.map((outcome, idx) => (
                    <li key={idx}>
                      <span>✓ {outcome}</span>
                      <button
                        onClick={() => handleRemoveOutcome(idx)}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Video Input & Preview */}
          <section className="editor-section">
            <h2>Video Content</h2>

            <div className="form-group">
              <label>Video URL *</label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleFormChange}
                className="form-input"
                placeholder="https://youtu.be/... or https://vimeo.com/... or your-video.mp4"
              />
              <small>
                Supports: YouTube, Vimeo, or direct MP4 links
              </small>
            </div>

            <div className="form-group">
              <label>Video Duration (seconds) *</label>
              <input
                type="number"
                name="videoDuration"
                value={formData.videoDuration}
                onChange={handleFormChange}
                className="form-input"
                placeholder="600"
                min="1"
              />
              <small>Duration in seconds (e.g., 600 = 10 minutes)</small>
            </div>

            {/* Video Preview */}
            <div className="video-preview-section">
              <button
                onClick={() => setVideoPreviewOpen(true)}
                className="btn-preview"
              >
                👁️ Preview Video
              </button>
              {formData.videoUrl && (
                <p className="video-url-display">
                  <strong>URL:</strong> {formData.videoUrl.substring(0, 60)}...
                </p>
              )}
            </div>
          </section>

          {/* Resources */}
          <section className="editor-section">
            <h2>Resources & Links</h2>

            <div className="form-group">
              <label>Add Resource Link</label>
              <div className="resource-input">
                <input
                  type="url"
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                  placeholder="https://example.com/resource"
                  className="form-input"
                />
                <button onClick={handleAddResource} className="btn-small">
                  Add
                </button>
              </div>

              {formData.resources.length > 0 && (
                <ul className="resources-list">
                  {formData.resources.map((resource, idx) => (
                    <li key={idx}>
                      <a href={resource} target="_blank" rel="noopener noreferrer">
                        🔗 {resource.substring(0, 50)}...
                      </a>
                      <button
                        onClick={() => handleRemoveResource(idx)}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Quiz Assignment */}
          <section className="editor-section">
            <h2>Quiz Assignment</h2>

            <div className="form-group">
              <label>Assign Quiz at End of Lesson (optional)</label>
              <select
                name="quizId"
                value={formData.quizId}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="">-- No Quiz --</option>
                {quizzes.map(quiz => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.title} (Pass: {quiz.passingScore}%)
                  </option>
                ))}
              </select>
            </div>

            {formData.quizId && (
              <div className="form-group">
                <label>Passing Score (%)</label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleFormChange}
                  className="form-input"
                  min="0"
                  max="100"
                />
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="editor-sidebar">
          <div className="info-box">
            <h3>Lesson Info</h3>
            <div className="info-item">
              <strong>Duration:</strong>
              <span>{formData.videoDuration}s ({Math.round(formData.videoDuration / 60)}m)</span>
            </div>
            <div className="info-item">
              <strong>Video URL:</strong>
              <span className={formData.videoUrl ? 'status-ok' : 'status-missing'}>
                {formData.videoUrl ? '✓ Added' : '✗ Missing'}
              </span>
            </div>
            <div className="info-item">
              <strong>Learning Outcomes:</strong>
              <span>{formData.learningOutcomes.length}</span>
            </div>
            <div className="info-item">
              <strong>Resources:</strong>
              <span>{formData.resources.length}</span>
            </div>
            <div className="info-item">
              <strong>Quiz:</strong>
              <span>{formData.quizId ? '✓ Assigned' : '✗ None'}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Action Buttons */}
      <div className="editor-footer">
        <Link to={`/admin/courses/${courseId}`} className="btn-secondary">
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>

      {/* Video Preview Modal */}
      {videoPreviewOpen && (
        <VideoPreview
          videoUrl={formData.videoUrl}
          onClose={() => setVideoPreviewOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
