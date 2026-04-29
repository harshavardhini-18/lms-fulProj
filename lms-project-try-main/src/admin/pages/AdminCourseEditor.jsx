import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminCourseService } from '../services/adminCourseService';
import { adminModuleService } from '../services/adminModuleService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import './AdminCourseEditor.css';

export default function AdminCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isNewCourse = courseId === 'new';

  // State
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(!isNewCourse);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    status: 'draft',
  });

  useEffect(() => {
    if (!isNewCourse) {
      fetchCourseData();
    }
  }, [courseId, isNewCourse]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await adminCourseService.getCourse(courseId);
      setCourse(response.data);
      setFormData({
        title: response.data.title,
        description: response.data.description,
        level: response.data.level,
        status: response.data.status,
      });
      setModules(response.data.modules || []);
    } catch (error) {
      showToast('Failed to load course', 'error');
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
    // Validate
    if (!formData.title.trim()) {
      showToast('Course title is required', 'error');
      return;
    }
    if (!formData.description.trim()) {
      showToast('Course description is required', 'error');
      return;
    }

    try {
      setSaving(true);

      if (isNewCourse) {
        // Create new course
        const response = await adminCourseService.createCourse(formData);
        setCourse(response.data);
        showToast('Course created successfully!', 'success');
        // Redirect to edit page
        navigate(`/admin/courses/${response.data._id}`);
      } else {
        // Update existing course
        await adminCourseService.updateCourse(courseId, formData);
        setCourse(prev => ({ ...prev, ...formData }));
        showToast('Course updated successfully!', 'success');
      }
    } catch (error) {
      showToast('Error saving course', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    const title = prompt('Enter module title:');
    if (!title) return;

    try {
      const response = await adminModuleService.createModule(courseId, {
        title,
        description: '',
        order: modules.length,
      });
      setModules(prev => [...prev, response.data]);
      showToast('Module created!', 'success');
    } catch (error) {
      showToast('Error creating module', 'error');
      console.error(error);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;

    try {
      await adminModuleService.deleteModule(courseId, moduleId);
      setModules(prev => prev.filter(m => m._id !== moduleId));
      showToast('Module deleted', 'success');
    } catch (error) {
      showToast('Error deleting module', 'error');
      console.error(error);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await adminCourseService.deleteCourse(courseId);
      showToast('Course deleted', 'success');
      navigate('/admin/courses');
    } catch (error) {
      showToast('Error deleting course', 'error');
      console.error(error);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="course-editor">
      {/* Header */}
      <div className="editor-header">
        <Link to="/admin/courses" className="back-button">
          ← Back
        </Link>
        <h1>{isNewCourse ? 'Create New Course' : `Editing: ${formData.title}`}</h1>
      </div>

      <div className="editor-layout">
        {/* Main Content */}
        <div className="editor-main">
          {/* Course Info Section */}
          <section className="editor-section">
            <h2>Course Information</h2>
            <div className="form-group">
              <label>Course Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="e.g., React Fundamentals"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Describe what students will learn..."
                className="form-textarea"
                rows="4"
              />
              <small>{formData.description.length}/500 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Level *</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleFormChange}
                  className="form-select"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="form-select"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </section>

          {/* Modules Section */}
          {!isNewCourse && (
            <section className="editor-section">
              <div className="section-header">
                <h2>Modules & Lessons ({modules.length})</h2>
                <button onClick={handleAddModule} className="btn-add">
                  ➕ Add Module
                </button>
              </div>

              {modules.length > 0 ? (
                <div className="modules-list">
                  {modules.map((module, index) => (
                    <div key={module._id} className="module-item">
                      <div className="module-header">
                        <div className="module-info">
                          <h3>Module {index + 1}: {module.title}</h3>
                          <p>{module.lessons?.length || 0} lessons</p>
                        </div>
                        <div className="module-actions">
                          <Link
                            to={`/admin/courses/${courseId}/modules/${module._id}`}
                            className="btn-small"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteModule(module._id)}
                            className="btn-small delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {module.lessons && module.lessons.length > 0 && (
                        <div className="lessons-list">
                          {module.lessons.map((lesson, lessonIdx) => (
                            <div key={lesson._id} className="lesson-item">
                              <span className="lesson-number">Lesson {lessonIdx + 1}</span>
                              <span className="lesson-title">{lesson.title}</span>
                              <span className="lesson-duration">{lesson.videoDuration}s</span>
                              <span className={`lesson-status ${lesson.videoUrl ? 'has-video' : 'no-video'}`}>
                                {lesson.videoUrl ? '✓ Video' : '✗ No Video'}
                              </span>
                              <Link
                                to={`/admin/courses/${courseId}/modules/${module._id}/lessons/${lesson._id}`}
                                className="btn-small"
                              >
                                Edit
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No modules yet. Create one to add lessons.</p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar Stats */}
        <aside className="editor-sidebar">
          <div className="stat-box">
            <div className="stat-label">Modules</div>
            <div className="stat-value">{modules.length}</div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Total Lessons</div>
            <div className="stat-value">
              {modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Status</div>
            <div className={`status-badge ${formData.status}`}>
              {formData.status}
            </div>
          </div>
        </aside>
      </div>

      {/* Action Buttons */}
      <div className="editor-footer">
        <div className="footer-buttons">
          <Link to="/admin/courses" className="btn-secondary">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Course'}
          </button>
          {!isNewCourse && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger"
            >
              Delete Course
            </button>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title="Delete Course?"
          message="This action cannot be undone. All modules and lessons will be deleted."
          onConfirm={handleDeleteCourse}
          onCancel={() => setShowDeleteModal(false)}
          isDangerous
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
