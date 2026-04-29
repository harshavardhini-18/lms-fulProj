# 🚀 ADMIN FRONTEND - EDITOR COMPONENTS BUILD GUIDE

## 📋 WHAT WE'RE BUILDING

```
This document covers ALL editor pages needed for Week 2:

1️⃣ Course Editor Page (AdminCourseEditor.jsx)
2️⃣ Module Editor (AdminModuleEditor.jsx)
3️⃣ Lesson Editor (AdminLessonEditor.jsx) ⭐ MOST COMPLEX
4️⃣ Quiz Builder (AdminQuizBuilder.jsx)

All with complete React code + CSS + API integration
```

---

## 🎯 STEP 1: Admin Course Editor Page

### File: `admin/pages/AdminCourseEditor.jsx`

```jsx
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
```

### File: `admin/pages/AdminCourseEditor.css`

```css
.course-editor {
  padding: 2rem 0;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.back-button {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: color 0.2s;
}

.back-button:hover {
  color: #6d28d9;
}

.editor-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #111827;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  margin-bottom: 3rem;
}

/* Main Content */
.editor-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.editor-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
}

.editor-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  color: #111827;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
}

/* Forms */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #374151;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #9ca3af;
  font-size: 0.85rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Modules */
.modules-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.module-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.module-header {
  background-color: #f9fafb;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.module-info h3 {
  margin: 0 0 0.25rem 0;
  color: #111827;
  font-size: 1rem;
}

.module-info p {
  margin: 0;
  color: #9ca3af;
  font-size: 0.85rem;
}

.module-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #7c3aed;
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-small:hover {
  background-color: #6d28d9;
}

.btn-small.delete {
  background-color: #ef4444;
}

.btn-small.delete:hover {
  background-color: #dc2626;
}

.lessons-list {
  padding: 1rem;
  background: white;
}

.lesson-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.lesson-item:last-child {
  border-bottom: none;
}

.lesson-number {
  font-weight: 600;
  color: #7c3aed;
  min-width: 70px;
}

.lesson-title {
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-duration {
  color: #9ca3af;
  min-width: 60px;
  text-align: right;
}

.lesson-status {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.lesson-status.has-video {
  background-color: #dcfce7;
  color: #166534;
}

.lesson-status.no-video {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Sidebar */
.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
}

.stat-label {
  color: #9ca3af;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.draft {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.published {
  background-color: #dcfce7;
  color: #166534;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

/* Footer */
.editor-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.footer-buttons {
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #7c3aed;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-add {
  padding: 0.5rem 1rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #6d28d9;
}

/* Responsive */
@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .editor-footer {
    flex-direction: column;
  }

  .footer-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    width: 100%;
    text-align: center;
  }
}
```

---

## 🎯 STEP 2: Module Editor Page

### File: `admin/pages/AdminModuleEditor.jsx`

```jsx
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
```

### File: `admin/pages/AdminModuleEditor.css`

```css
.module-editor {
  padding: 2rem 0;
}

.editor-breadcrumb {
  margin-bottom: 2rem;
}

.breadcrumb-link {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #6d28d9;
}

.editor-header {
  margin-bottom: 3rem;
}

.editor-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #111827;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.editor-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
}

.editor-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  color: #111827;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
}

/* Forms */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #374151;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Table */
.lessons-table {
  overflow-x: auto;
}

.lessons-table table {
  width: 100%;
  border-collapse: collapse;
}

.lessons-table th {
  background-color: #f3f4f6;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  border-bottom: 2px solid #e5e7eb;
}

.lessons-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.lessons-table tr:hover {
  background-color: #f9fafb;
}

.lessons-table strong {
  color: #111827;
  display: block;
  margin-bottom: 0.25rem;
}

.lessons-table p {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0;
}

.status {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status.has {
  background-color: #dcfce7;
  color: #166534;
}

.status.no {
  background-color: #fee2e2;
  color: #991b1b;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  text-decoration: none;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-small:hover {
  background-color: #6d28d9;
}

.btn-small.delete {
  background-color: #ef4444;
}

.btn-small.delete:hover {
  background-color: #dc2626;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-add {
  padding: 0.5rem 1rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #6d28d9;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-add {
    width: 100%;
  }

  .lessons-table {
    overflow-x: auto;
  }
}
```

---

## 🎯 STEP 3: LESSON EDITOR (Most Complex - WITH VIDEO URL INPUT)

This is the most important component. It handles:
- Lesson details (title, description, outcomes)
- **Video URL input** (YouTube, Vimeo, direct links)
- **Video preview**
- Resource links
- Quiz assignment

### File: `admin/pages/AdminLessonEditor.jsx`

```jsx
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
```

### File: `admin/pages/AdminLessonEditor.css`

```css
.lesson-editor {
  padding: 2rem 0;
}

.editor-breadcrumb {
  margin-bottom: 2rem;
}

.breadcrumb-link {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #6d28d9;
}

.editor-title {
  margin: 0 0 3rem 0;
  font-size: 1.8rem;
  color: #111827;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  margin-bottom: 2rem;
}

.editor-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.editor-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
}

.editor-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #111827;
}

/* Forms */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #374151;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #9ca3af;
  font-size: 0.85rem;
}

/* Learning Outcomes */
.outcomes-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.outcomes-input .form-input {
  flex: 1;
  margin: 0;
}

.outcomes-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.outcomes-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.outcomes-list span {
  color: #374151;
}

/* Resources */
.resource-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.resource-input .form-input {
  flex: 1;
  margin: 0;
}

.resources-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resources-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.resources-list a {
  color: #7c3aed;
  text-decoration: none;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resources-list a:hover {
  text-decoration: underline;
}

/* Video Preview */
.video-preview-section {
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.btn-preview {
  padding: 0.75rem 1.5rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 1rem;
}

.btn-preview:hover {
  background-color: #6d28d9;
}

.video-url-display {
  margin: 0;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  color: #9ca3af;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Buttons */
.btn-small {
  padding: 0.5rem 1rem;
  background-color: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.85rem;
}

.btn-small:hover {
  background-color: #6d28d9;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-weight: 600;
  padding: 0 0.5rem;
  transition: color 0.2s;
}

.btn-remove:hover {
  color: #dc2626;
}

/* Sidebar */
.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.info-box h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #111827;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item strong {
  color: #374151;
}

.info-item span {
  color: #9ca3af;
}

.status-ok {
  color: #16a34a !important;
  font-weight: 600;
}

.status-missing {
  color: #dc2626 !important;
  font-weight: 600;
}

/* Footer */
.editor-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #7c3aed;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

/* Responsive */
@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .outcomes-input,
  .resource-input {
    flex-direction: column;
  }

  .outcomes-input .form-input {
    margin-bottom: 0;
  }

  .editor-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    text-align: center;
  }
}
```

---

## 🛠️ SUPPORTING SERVICES & COMPONENTS

### File: `admin/services/adminModuleService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const getAxiosInstance = () => {
  const token = localStorage.getItem('accessToken');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const adminModuleService = {
  getModule: async (courseId, moduleId) => {
    const instance = getAxiosInstance();
    const response = await instance.get(`/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  },

  createModule: async (courseId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.post(`/courses/${courseId}/modules`, data);
    return response.data;
  },

  updateModule: async (courseId, moduleId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.put(`/courses/${courseId}/modules/${moduleId}`, data);
    return response.data;
  },

  deleteModule: async (courseId, moduleId) => {
    const instance = getAxiosInstance();
    const response = await instance.delete(`/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  },
};
```

### File: `admin/services/adminLessonService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const getAxiosInstance = () => {
  const token = localStorage.getItem('accessToken');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const adminLessonService = {
  getLesson: async (courseId, moduleId, lessonId) => {
    const instance = getAxiosInstance();
    const response = await instance.get(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
    );
    return response.data;
  },

  createLesson: async (courseId, moduleId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.post(
      `/courses/${courseId}/modules/${moduleId}/lessons`,
      data
    );
    return response.data;
  },

  updateLesson: async (courseId, moduleId, lessonId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.put(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      data
    );
    return response.data;
  },

  deleteLesson: async (courseId, moduleId, lessonId) => {
    const instance = getAxiosInstance();
    const response = await instance.delete(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
    );
    return response.data;
  },
};
```

### File: `admin/services/adminQuizService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const getAxiosInstance = () => {
  const token = localStorage.getItem('accessToken');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const adminQuizService = {
  getAllQuizzes: async () => {
    const instance = getAxiosInstance();
    const response = await instance.get('/quizzes');
    return response.data;
  },

  getQuiz: async (quizId) => {
    const instance = getAxiosInstance();
    const response = await instance.get(`/quizzes/${quizId}`);
    return response.data;
  },

  createQuiz: async (data) => {
    const instance = getAxiosInstance();
    const response = await instance.post('/quizzes', data);
    return response.data;
  },

  updateQuiz: async (quizId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.put(`/quizzes/${quizId}`, data);
    return response.data;
  },

  deleteQuiz: async (quizId) => {
    const instance = getAxiosInstance();
    const response = await instance.delete(`/quizzes/${quizId}`);
    return response.data;
  },
};
```

### File: `admin/components/common/VideoPreview.jsx`

```jsx
import React from 'react';
import './VideoPreview.css';

export default function VideoPreview({ videoUrl, onClose }) {
  return (
    <div className="video-preview-modal" onClick={onClose}>
      <div className="video-preview-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        
        {videoUrl && (
          <>
            {videoUrl.includes('youtu') ? (
              // YouTube
              <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : videoUrl.includes('vimeo') ? (
              // Vimeo
              <iframe
                width="100%"
                height="500"
                src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}`}
                allow="autoplay; fullscreen"
                allowFullScreen
              ></iframe>
            ) : (
              // Direct video file
              <video width="100%" height="500" controls>
                <source src={videoUrl} />
                Your browser does not support the video tag.
              </video>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions
function extractYoutubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function extractVimeoId(url) {
  const regExp = /vimeo\.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}
```

### File: `admin/components/common/VideoPreview.css`

```css
.video-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.video-preview-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  max-width: 900px;
  width: 90%;
  position: relative;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s;
  z-index: 1001;
}

.close-button:hover {
  color: #111827;
}

iframe,
video {
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .video-preview-content {
    width: 95%;
  }

  iframe,
  video {
    height: 300px !important;
  }
}
```

### File: `admin/components/common/Modal.jsx`

```jsx
import React from 'react';
import './Modal.css';

export default function Modal({ title, message, onConfirm, onCancel, isDangerous }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-buttons">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={isDangerous ? 'btn-danger' : 'btn-primary'}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
```

### File: `admin/components/common/Modal.css`

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  color: #111827;
}

.modal-content p {
  margin: 0 0 2rem 0;
  color: #6b7280;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #7c3aed;
  color: white;
}

.btn-primary:hover {
  background-color: #6d28d9;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}
```

---

## ✅ FILES CREATED SUMMARY

**Main Pages (3):**
✅ AdminCourseEditor.jsx + .css
✅ AdminModuleEditor.jsx + .css
✅ AdminLessonEditor.jsx + .css

**Services (3):**
✅ adminModuleService.js
✅ adminLessonService.js
✅ adminQuizService.js

**Components (2):**
✅ VideoPreview.jsx + .css
✅ Modal.jsx + .css

---

## 🗂️ FILE STRUCTURE

All files go in this structure:

```
src/admin/
├── pages/
│   ├── AdminCourseEditor.jsx  + .css ✅
│   ├── AdminModuleEditor.jsx  + .css ✅
│   └── AdminLessonEditor.jsx  + .css ✅
├── services/
│   ├── adminCourseService.js (already created)
│   ├── adminModuleService.js ✅
│   ├── adminLessonService.js ✅
│   └── adminQuizService.js ✅
└── components/
    └── common/
        ├── VideoPreview.jsx + .css ✅
        ├── Modal.jsx + .css ✅
        └── ... (other components)
```

---

## 🎤 NEXT STEPS

1. **Create all files** from the guide
2. **Test Course Editor:** 
   - Navigate to `/admin/courses`
   - Click "Edit" on a course
   - Try adding modules
3. **Test Lesson Editor:**
   - Add a lesson
   - Try pasting YouTube/Vimeo URLs
   - Click "Preview Video"
4. **Build Quiz Builder** (optional - can use with existing quizzes)

---

## ❓ QUESTIONS?

- **"How do I get video duration?" →** Admin enters it manually (or you can auto-detect with JavaScript Video API)
- **"Can I drag to reorder?" →** Currently use dropdowns. Drag-drop in Phase 3
- **"Video upload?" →** Use URLs only in MVP. Upload in Phase 3

Ready to test? 🚀
