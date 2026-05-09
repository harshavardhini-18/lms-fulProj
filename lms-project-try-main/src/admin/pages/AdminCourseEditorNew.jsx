import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminCourseService } from '../services/adminCourseService';
import { adminModuleService } from '../services/adminModuleService';
import { adminLessonService } from '../services/adminLessonService';
import CourseForm from '../components/forms/CourseForm';
import ModuleForm from '../components/forms/ModuleForm';
import LessonForm from '../components/forms/LessonForm';
import ModuleList from '../components/layout/ModuleList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import './AdminCourseEditorNew.css';

const STATUS_META = {
  published: { label: 'Published', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  draft: { label: 'Draft', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  archived: { label: 'Archived', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

export default function AdminCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isNewCourse = courseId === 'new';

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(!isNewCourse);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // What's selected
  const [viewMode, setViewMode] = useState('course'); // 'course' | 'module' | 'lesson'
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedLessonModuleId, setSelectedLessonModuleId] = useState(null);

  // Highlight newly created items
  const [newlyCreatedModuleId, setNewlyCreatedModuleId] = useState(null);
  const [newlyCreatedLessonId, setNewlyCreatedLessonId] = useState(null);

  // Inline modals for creating module / lesson
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitleInput, setModuleTitleInput] = useState('');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonTitleInput, setLessonTitleInput] = useState('');
  const [lessonTargetModule, setLessonTargetModule] = useState(null);

  useEffect(() => {
    if (!isNewCourse) fetchCourseData();
  }, [courseId, isNewCourse]);

  useEffect(() => {
    if (!newlyCreatedModuleId && !newlyCreatedLessonId) return;
    const t = setTimeout(() => {
      setNewlyCreatedModuleId(null);
      setNewlyCreatedLessonId(null);
    }, 3500);
    return () => clearTimeout(t);
  }, [newlyCreatedModuleId, newlyCreatedLessonId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await adminCourseService.getCourse(courseId);
      setCourse(response.data);
      setModules(response.data.modules || []);
    } catch {
      showToast('Failed to load course', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Course ─────────────────────────────────── */
  const handleSaveCourse = async (formData) => {
    if (!formData.title?.trim()) {
      showToast('Course title is required', 'error');
      return;
    }
    try {
      setSaving(true);
      if (isNewCourse) {
        const response = await adminCourseService.createCourse(formData);
        setCourse(response.data);
        showToast('Course created!', 'success');
        navigate(`/admin/courses/${response.data._id}`);
      } else {
        await adminCourseService.updateCourse(courseId, formData);
        setCourse((prev) => ({ ...prev, ...formData }));
        showToast('Course saved!', 'success');
      }
    } catch {
      showToast('Error saving course', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Modules ─────────────────────────────────── */
  const handleAddModule = () => {
    setModuleTitleInput('');
    setShowModuleModal(true);
  };

  const handleCreateModule = async () => {
    const title = moduleTitleInput.trim();
    if (!title) { showToast('Module title is required', 'error'); return; }
    try {
      setSaving(true);
      const response = await adminModuleService.createModule(courseId, {
        title,
        description: '',
        order: modules.length,
      });
      const updated = [...modules, response.data];
      setModules(updated);
      setNewlyCreatedModuleId(response.data._id);
      setSelectedModuleId(response.data._id);
      setSelectedModule(response.data);
      setViewMode('module');
      setShowModuleModal(false);
      showToast('Module created!', 'success');
    } catch {
      showToast('Error creating module', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditModule = (module) => {
    setSelectedModuleId(module._id);
    setSelectedModule(module);
    setSelectedLesson(null);
    setViewMode('module');
  };

  const handleSaveModule = async (formData) => {
    if (!selectedModuleId) return;
    try {
      setSaving(true);
      await adminModuleService.updateModule(courseId, selectedModuleId, formData);
      setModules((prev) =>
        prev.map((m) => (m._id === selectedModuleId ? { ...m, ...formData } : m))
      );
      setSelectedModule((prev) => ({ ...prev, ...formData }));
      showToast('Module saved!', 'success');
    } catch {
      showToast('Error saving module', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      setSaving(true);
      await adminModuleService.deleteModule(courseId, moduleId);
      setModules((prev) => prev.filter((m) => m._id !== moduleId));
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
        setSelectedModule(null);
        setViewMode('course');
      }
      showToast('Module deleted', 'success');
    } catch {
      showToast('Error deleting module', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Lessons ─────────────────────────────────── */
  const handleAddLesson = (module) => {
    setLessonTargetModule(module);
    setLessonTitleInput('');
    setShowLessonModal(true);
  };

  const handleCreateLesson = async () => {
    const title = lessonTitleInput.trim();
    if (!title) { showToast('Topic title is required', 'error'); return; }
    if (!lessonTargetModule?._id) { showToast('No module selected', 'error'); return; }
    try {
      setSaving(true);
      const response = await adminLessonService.createLesson(courseId, lessonTargetModule._id, {
        title,
        summary: '',
        status: 'draft',
        contentType: 'video',
        videoUrl: '',
        videoDuration: 0,
        videoType: 'mp4',
        thumbnailUrl: '',
        contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
        notesEnabled: true,
        order: lessonTargetModule.lessons?.length || 0,
      });
      setModules((prev) =>
        prev.map((m) =>
          m._id === lessonTargetModule._id
            ? { ...m, lessons: [...(m.lessons || []), response.data] }
            : m
        )
      );
      setSelectedLesson(response.data);
      setSelectedLessonModuleId(lessonTargetModule._id);
      setSelectedModuleId(lessonTargetModule._id);
      setViewMode('lesson');
      setNewlyCreatedModuleId(lessonTargetModule._id);
      setNewlyCreatedLessonId(response.data._id);
      setShowLessonModal(false);
      showToast('Topic created!', 'success');
    } catch {
      showToast('Error creating topic', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectLesson = (moduleId, lesson) => {
    setSelectedLesson(lesson);
    setSelectedLessonModuleId(moduleId);
    setSelectedModuleId(moduleId);
    setViewMode('lesson');
  };

  const handleSaveLesson = async (formData) => {
    if (!selectedLessonModuleId || !selectedLesson) return;
    try {
      setSaving(true);
      await adminLessonService.updateLesson(courseId, selectedLessonModuleId, selectedLesson._id, formData);
      setModules((prev) =>
        prev.map((m) =>
          m._id === selectedLessonModuleId
            ? { ...m, lessons: m.lessons.map((l) => (l._id === selectedLesson._id ? { ...l, ...formData } : l)) }
            : m
        )
      );
      setSelectedLesson((prev) => ({ ...prev, ...formData }));
      showToast('Topic saved!', 'success');
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      showToast(apiMessage || 'Error saving topic', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    try {
      setSaving(true);
      await adminLessonService.deleteLesson(courseId, moduleId, lessonId);
      setModules((prev) =>
        prev.map((m) =>
          m._id === moduleId
            ? { ...m, lessons: m.lessons.filter((l) => l._id !== lessonId) }
            : m
        )
      );
      if (selectedLesson?._id === lessonId) {
        setSelectedLesson(null);
        setViewMode('course');
      }
      showToast('Topic deleted', 'success');
    } catch {
      showToast('Error deleting topic', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── drag-and-drop reorder → persist `position` in PostgreSQL (`order` in API body) ──
  const snapshotModules = (list) =>
    list.map((m) => ({
      ...m,
      lessons: Array.isArray(m.lessons) ? [...m.lessons] : [],
    }));

  const handleReorderModules = async (reordered) => {
    const previous = snapshotModules(modules);
    setModules(reordered);
    try {
      setSaving(true);
      await Promise.all(
        reordered.map((m, idx) => adminModuleService.updateModule(courseId, m._id, { order: idx }))
      );
      showToast('Module order saved', 'success');
    } catch (error) {
      setModules(previous);
      const apiMessage = error?.response?.data?.message;
      showToast(apiMessage || 'Could not save module order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReorderLessons = async (moduleId, reorderedLessons) => {
    const previous = snapshotModules(modules);
    setModules((prev) =>
      prev.map((m) => (m._id === moduleId ? { ...m, lessons: reorderedLessons } : m))
    );
    try {
      setSaving(true);
      await Promise.all(
        reorderedLessons.map((lesson, idx) =>
          adminLessonService.updateLesson(courseId, moduleId, lesson._id, { order: idx })
        )
      );
      showToast('Topic order saved', 'success');
    } catch (error) {
      setModules(previous);
      const apiMessage = error?.response?.data?.message;
      showToast(apiMessage || 'Could not save topic order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <LoadingSpinner />;

  const statusMeta = course ? (STATUS_META[course.status] || STATUS_META.draft) : null;

  /* ─── New course: full-width form ─────────────── */
  if (isNewCourse) {
    return (
      <div className="ace-new-course">
        <div className="ace-new-header">
          <Link to="/admin/courses" className="ace-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            All Courses
          </Link>
          <h1 className="ace-new-title">Create New Course</h1>
          <p className="ace-new-subtitle">Fill in the details below to publish your first course.</p>
        </div>
        <div className="ace-new-body">
          <CourseForm onSave={handleSaveCourse} saving={saving} />
        </div>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            position="top-center"
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  /* ─── Existing course: two-panel layout ───────── */
  return (
    <div className="ace-layout">
      {/* Left Sidebar */}
      <aside className="ace-sidebar">
        {/* Sidebar header */}
        <div className="ace-sidebar-top">
          <Link to="/admin/courses" className="ace-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            All Courses
          </Link>

          <div className="ace-course-info">
            <p className="ace-course-name">{course?.title || 'Untitled Course'}</p>
            {statusMeta && (
              <span
                className="ace-course-status"
                style={{ color: statusMeta.color, background: statusMeta.bg }}
              >
                {statusMeta.label}
              </span>
            )}
          </div>
        </div>

        {/* Navigation tree */}
        <div className="ace-sidebar-nav">
          <ModuleList
            modules={modules}
            selectedModuleId={selectedModuleId}
            selectedLessonId={selectedLesson?._id}
            newlyCreatedModuleId={newlyCreatedModuleId}
            newlyCreatedLessonId={newlyCreatedLessonId}
            viewMode={viewMode}
            onSelectCourse={() => setViewMode('course')}
            onSelectModule={handleEditModule}
            onEditModule={handleEditModule}
            onDeleteModule={handleDeleteModule}
            onAddLesson={handleAddLesson}
            onSelectLesson={handleSelectLesson}
            onDeleteLesson={handleDeleteLesson}
            onReorderModules={handleReorderModules}
            onReorderLessons={handleReorderLessons}
          />
        </div>

        {/* Add module button */}
        <div className="ace-sidebar-footer">
          <button type="button" className="ace-add-module-btn" onClick={handleAddModule}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Module
          </button>
        </div>
      </aside>

      {/* Right Panel */}
      <main className="ace-panel">
        {viewMode === 'course' && (
          <div className="ace-panel-inner">
            <div className="ace-panel-header">
              <div>
                <h2 className="ace-panel-title">Course Details</h2>
                <p className="ace-panel-subtitle">Edit the core information for this course</p>
              </div>
            </div>
            <CourseForm course={course} onSave={handleSaveCourse} saving={saving} />
          </div>
        )}

        {viewMode === 'module' && selectedModule && (
          <div className="ace-panel-inner">
            <div className="ace-panel-header">
              <div>
                <h2 className="ace-panel-title">Edit Module</h2>
                <p className="ace-panel-subtitle">{selectedModule.title}</p>
              </div>
              <button
                type="button"
                className="ace-panel-back-btn"
                onClick={() => setViewMode('course')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Overview
              </button>
            </div>
            <ModuleForm module={selectedModule} onSave={handleSaveModule} saving={saving} />
          </div>
        )}

        {viewMode === 'lesson' && selectedLesson && (
          <div className="ace-panel-inner">
            <div className="ace-panel-header">
              <div>
                <h2 className="ace-panel-title">Edit topic</h2>
                <p className="ace-panel-subtitle">{selectedLesson.title}</p>
              </div>
              <button
                type="button"
                className="ace-panel-back-btn"
                onClick={() => {
                  setViewMode('module');
                  const mod = modules.find((m) => m._id === selectedLessonModuleId);
                  if (mod) { setSelectedModule(mod); }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Module
              </button>
            </div>
            <LessonForm lesson={selectedLesson} onSave={handleSaveLesson} saving={saving} />
          </div>
        )}

        {viewMode === 'course' && !course && (
          <div className="ace-empty-state">
            <p>Select something from the sidebar to start editing.</p>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-center"
          onClose={() => setToast(null)}
        />
      )}

      {/* Add Module modal */}
      {showModuleModal && (
        <div className="ace-modal-overlay" onClick={() => setShowModuleModal(false)}>
          <div className="ace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ace-modal-header">
              <h3>New Module</h3>
              <button className="ace-modal-close" onClick={() => setShowModuleModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="ace-modal-desc">Enter a title for your new module.</p>
            <input
              type="text"
              value={moduleTitleInput}
              onChange={(e) => setModuleTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
              placeholder="e.g., Introduction to React"
              className="ace-modal-input"
              autoFocus
            />
            <div className="ace-modal-actions">
              <button type="button" className="ace-modal-cancel" onClick={() => setShowModuleModal(false)}>
                Cancel
              </button>
              <button type="button" className="ace-modal-confirm" onClick={handleCreateModule} disabled={saving}>
                {saving ? 'Creating…' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lesson modal */}
      {showLessonModal && (
        <div className="ace-modal-overlay" onClick={() => setShowLessonModal(false)}>
          <div className="ace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ace-modal-header">
              <h3>New topic</h3>
              <button className="ace-modal-close" onClick={() => setShowLessonModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="ace-modal-desc">
              Adding to <strong>{lessonTargetModule?.title}</strong>
            </p>
            <input
              type="text"
              value={lessonTitleInput}
              onChange={(e) => setLessonTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateLesson()}
              placeholder="e.g., Introduction to Hooks"
              className="ace-modal-input"
              autoFocus
            />
            <div className="ace-modal-actions">
              <button type="button" className="ace-modal-cancel" onClick={() => setShowLessonModal(false)}>
                Cancel
              </button>
              <button type="button" className="ace-modal-confirm" onClick={handleCreateLesson} disabled={saving}>
                {saving ? 'Creating…' : 'Create topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
