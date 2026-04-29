import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminModuleService } from '../services/adminModuleService';
import { adminLessonService } from '../services/adminLessonService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import './AdminModuleEditor.css';

export default function AdminModuleEditor() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchModule();
  }, [courseId, moduleId]);

  const fetchModule = async () => {
    try {
      setLoading(true);
      const response = await adminModuleService.getModule(courseId, moduleId);
      setModule(response.data);
      setFormData({
        title: response.data.title,
        description: response.data.description,
      });
    } catch (error) {
      showToast('Failed to load module', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('Module title is required', 'error');
      return;
    }

    try {
      setSaving(true);
      await adminModuleService.updateModule(courseId, moduleId, formData);
      setModule(prev => ({ ...prev, ...formData }));
      showToast('Module updated!', 'success');
    } catch (error) {
      showToast('Error saving module', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async () => {
    const title = prompt('Enter lesson title:');
    if (!title) return;

    try {
      const response = await adminLessonService.createLesson(courseId, moduleId, {
        title,
        description: '',
        videoUrl: '',
        videoDuration: 0,
        order: (module.lessons?.length || 0),
      });
      setModule(prev => ({
        ...prev,
        lessons: [...(prev.lessons || []), response.data]
      }));
      showToast('Lesson created!', 'success');
    } catch (error) {
      showToast('Error creating lesson', 'error');
      console.error(error);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;

    try {
      await adminLessonService.deleteLesson(courseId, moduleId, lessonId);
      setModule(prev => ({
        ...prev,
        lessons: prev.lessons.filter(l => l._id !== lessonId)
      }));
      showToast('Lesson deleted', 'success');
    } catch (error) {
      showToast('Error deleting lesson', 'error');
      console.error(error);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="module-editor">
      <div className="editor-breadcrumb">
        <Link to={`/admin/courses/${courseId}`} className="breadcrumb-link">
          ← Back to Course
        </Link>
      </div>

      <div className="editor-header">
        <h1>Editing Module: {formData.title}</h1>
      </div>

      <div className="editor-content">
        {/* Module Info */}
        <section className="editor-section">
          <h2>Module Details</h2>

          <div className="form-group">
            <label>Module Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="form-textarea"
              rows="3"
              placeholder="What will students learn in this module?"
            />
          </div>

          <div className="form-group">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Module'}
            </button>
          </div>
        </section>

        {/* Lessons */}
        <section className="editor-section">
          <div className="section-header">
            <h2>Lessons ({module?.lessons?.length || 0})</h2>
            <button onClick={handleAddLesson} className="btn-add">
              ➕ Add Lesson
            </button>
          </div>

          {module?.lessons && module.lessons.length > 0 ? (
            <div className="lessons-table">
              <table>
                <thead>
                  <tr>
                    <th>Lesson</th>
                    <th>Video</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {module.lessons.map((lesson, index) => (
                    <tr key={lesson._id}>
                      <td>
                        <strong>Lesson {index + 1}</strong>
                        <p>{lesson.title}</p>
                      </td>
                      <td>
                        <span className={`status ${lesson.videoUrl ? 'has' : 'no'}`}>
                          {lesson.videoUrl ? '✓ Added' : '✗ Missing'}
                        </span>
                      </td>
                      <td>{lesson.videoDuration}s</td>
                      <td className="actions">
                        <Link
                          to={`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson._id}`}
                          className="btn-small"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteLesson(lesson._id)}
                          className="btn-small delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No lessons yet. Add one to get started!</p>
            </div>
          )}
        </section>
      </div>

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
