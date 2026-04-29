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

export default function AdminCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isNewCourse = courseId === 'new';

  // Main state
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(!isNewCourse);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // UI state
  const [viewMode, setViewMode] = useState('course'); // 'course', 'module', 'lesson'
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [newlyCreatedModuleId, setNewlyCreatedModuleId] = useState(null);
  const [newlyCreatedLessonId, setNewlyCreatedLessonId] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);

  // Form modal state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitleInput, setModuleTitleInput] = useState('');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonTitleInput, setLessonTitleInput] = useState('');
  const [lessonTargetModule, setLessonTargetModule] = useState(null);

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
      setModules(response.data.modules || []);
    } catch (error) {
      showToast('Failed to load course', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Course handlers
  const handleSaveCourse = async (formData) => {
    if (!formData.title.trim()) {
      showToast('Course title is required', 'error');
      return;
    }

    try {
      setSaving(true);
      if (isNewCourse) {
        const response = await adminCourseService.createCourse(formData);
        setCourse(response.data);
        showToast('Course created successfully!', 'success');
        navigate(`/admin/courses/${response.data._id}`);
      } else {
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

  // Module handlers
  const handleAddModule = async () => {
    setModuleTitleInput('');
    setShowModuleModal(true);
  };

  const handleCreateModule = async () => {
    const title = moduleTitleInput.trim();
    if (!title) {
      showToast('Module title is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await adminModuleService.createModule(courseId, {
        title,
        description: '',
        order: modules.length,
      });
      const updatedModules = [...modules, response.data];
      setModules(updatedModules);
      setSelectedModuleId(response.data._id);
      setSelectedModule(response.data);
      setNewlyCreatedModuleId(response.data._id);
      setShowModuleModal(false);
      showToast('Module created!', 'success');
    } catch (error) {
      showToast('Error creating module', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectModule = (module) => {
    setSelectedModuleId(module._id);
    setSelectedModule(module);
    setSelectedLesson(null);
    setEditingLesson(null);
    setViewMode('module');
  };

  const handleEditModule = (module) => {
    setSelectedModuleId(module._id);
    setSelectedModule(module);
    setSelectedLesson(null);
    setEditingLesson(null);
    setViewMode('module');
  };

  const handleSaveModule = async (formData) => {
    if (!selectedModuleId) return;

    try {
      setSaving(true);
      await adminModuleService.updateModule(courseId, selectedModuleId, formData);
      setModules(prev =>
        prev.map(m =>
          m._id === selectedModuleId ? { ...m, ...formData } : m
        )
      );
      setSelectedModule(prev => ({ ...prev, ...formData }));
      showToast('Module updated!', 'success');
    } catch (error) {
      showToast('Error saving module', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      setSaving(true);
      await adminModuleService.deleteModule(courseId, moduleId);
      setModules(prev => prev.filter(m => m._id !== moduleId));
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
        setSelectedModule(null);
        setViewMode('course');
      }
      showToast('Module deleted', 'success');
    } catch (error) {
      showToast('Error deleting module', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Lesson handlers
  const handleAddLesson = async (module) => {
    setLessonTargetModule(module);
    setLessonTitleInput('');
    setShowLessonModal(true);
  };

  const handleCreateLesson = async () => {
    const title = lessonTitleInput.trim();
    if (!title) {
      showToast('Lesson title is required', 'error');
      return;
    }
    if (!lessonTargetModule?._id) {
      showToast('Select a valid module first', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await adminLessonService.createLesson(courseId, lessonTargetModule._id, {
        title,
        summary: '',
        status: 'draft',
        description: '',
        contentType: 'video',
        videoUrl: '',
        videoDuration: 0,
        videoType: 'mp4',
        thumbnailUrl: '',
        version: 1,
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '' }],
            },
          ],
        },
        notesEnabled: true,
        order: (lessonTargetModule.lessons?.length || 0),
      });
      
      // Update modules with new lesson
      setModules(prev =>
        prev.map(m =>
          m._id === lessonTargetModule._id
            ? {
                ...m,
                lessons: [...(m.lessons || []), response.data],
              }
            : m
        )
      );
      
      setSelectedLesson(response.data);
      setEditingLesson(response.data);
      setViewMode('lesson');
      setNewlyCreatedModuleId(lessonTargetModule._id);
      setNewlyCreatedLessonId(response.data._id);
      setShowLessonModal(false);
      showToast('Lesson created!', 'success');
    } catch (error) {
      showToast('Error creating lesson', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectLesson = (moduleId, lesson) => {
    setSelectedLesson(lesson);
    setEditingLesson(lesson);
    setViewMode('lesson');
  };

  const handleSaveLesson = async (formData) => {
    if (!selectedModuleId || !selectedLesson) return;

    try {
      setSaving(true);
      await adminLessonService.updateLesson(
        courseId,
        selectedModuleId,
        selectedLesson._id,
        formData
      );
      
      // Update modules with updated lesson
      setModules(prev =>
        prev.map(m =>
          m._id === selectedModuleId
            ? {
                ...m,
                lessons: m.lessons.map(l =>
                  l._id === selectedLesson._id ? { ...l, ...formData } : l
                ),
              }
            : m
        )
      );
      
      setSelectedLesson(prev => ({ ...prev, ...formData }));
      setEditingLesson(prev => ({ ...prev, ...formData }));
      showToast('Lesson updated!', 'success');
    } catch (error) {
      showToast('Error saving lesson', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    try {
      setSaving(true);
      await adminLessonService.deleteLesson(courseId, moduleId, lessonId);
      
      setModules(prev =>
        prev.map(m =>
          m._id === moduleId
            ? {
                ...m,
                lessons: m.lessons.filter(l => l._id !== lessonId),
              }
            : m
        )
      );
      
      if (selectedLesson?._id === lessonId) {
        setSelectedLesson(null);
        setEditingLesson(null);
        setViewMode('module');
      }
      showToast('Lesson deleted', 'success');
    } catch (error) {
      showToast('Error deleting lesson', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!newlyCreatedModuleId && !newlyCreatedLessonId) return;
    const timer = setTimeout(() => {
      setNewlyCreatedModuleId(null);
      setNewlyCreatedLessonId(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [newlyCreatedModuleId, newlyCreatedLessonId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="course-editor-new">
      {/* Header */}
      <div className="editor-header">
        <Link to="/admin/courses" className="back-button">
          ← Back to Courses
        </Link>
        <div className="header-title">
          <h1>{isNewCourse ? 'Create New Course' : course?.title}</h1>
          {!isNewCourse && <p>{course?.status}</p>}
        </div>
        {!isNewCourse && (
          <div className="header-actions">
            <button
              onClick={() => {
                setShowCourseDetails(true);
                setViewMode('course');
              }}
              className="btn-primary"
            >
              View Course
            </button>
          </div>
        )}
      </div>

      <div className="editor-layout">
        {/* Left Panel - Modules List */}
        {!isNewCourse && (
          <div className="editor-left-panel">
            <div className="panel-header">
              <h2>Modules</h2>
              <button onClick={handleAddModule} className="btn-add">
                Add
              </button>
            </div>

            <ModuleList
              courseId={courseId}
              modules={modules}
              selectedModuleId={selectedModuleId}
              newlyCreatedModuleId={newlyCreatedModuleId}
              newlyCreatedLessonId={newlyCreatedLessonId}
              onSelectModule={handleSelectModule}
              onEditModule={handleEditModule}
              onDeleteModule={handleDeleteModule}
              onAddLesson={handleAddLesson}
              onSelectLesson={handleSelectLesson}
              onDeleteLesson={handleDeleteLesson}
            />
          </div>
        )}

        {/* Right Panel - Editing Form */}
        <div className="editor-right-panel">
          {!showCourseDetails ? (
            <div className="empty-state">
              <p>Click <strong>View Course</strong> to open course details.</p>
            </div>
          ) : viewMode === 'course' ? (
            <div className="form-container">
              <h2>Course Details</h2>
              <CourseForm
                course={course}
                onSave={handleSaveCourse}
                saving={saving}
              />
            </div>
          ) : null}

          {showCourseDetails && viewMode === 'module' && selectedModule && (
            <div className="form-container">
              <div className="form-header">
                <button className="btn-back" onClick={() => setViewMode('course')}>
                  ← Back
                </button>
                <h2>Module: {selectedModule.title}</h2>
              </div>
              <ModuleForm
                module={selectedModule}
                onSave={handleSaveModule}
                saving={saving}
              />
            </div>
          )}

          {showCourseDetails && viewMode === 'lesson' && editingLesson && (
            <div className="form-container">
              <div className="form-header">
                <button
                  className="btn-back"
                  onClick={() => {
                    setViewMode('module');
                    setSelectedLesson(null);
                    setEditingLesson(null);
                  }}
                >
                  ← Back to Module
                </button>
                <h2>Lesson: {editingLesson.title}</h2>
              </div>
              <LessonForm
                lesson={editingLesson}
                onSave={handleSaveLesson}
                saving={saving}
              />
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {showModuleModal && (
        <div className="inline-modal-overlay" onClick={() => setShowModuleModal(false)}>
          <div className="inline-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add Module</h3>
            <p>Enter a title for your new module.</p>
            <input
              type="text"
              value={moduleTitleInput}
              onChange={(e) => setModuleTitleInput(e.target.value)}
              placeholder="e.g., Module 1: Fundamentals"
              className="inline-modal-input"
              autoFocus
            />
            <div className="inline-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModuleModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleCreateModule} disabled={saving}>
                {saving ? 'Adding...' : 'Add Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLessonModal && (
        <div className="inline-modal-overlay" onClick={() => setShowLessonModal(false)}>
          <div className="inline-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add Lesson</h3>
            <p>Enter a lesson title for <strong>{lessonTargetModule?.title || 'selected module'}</strong>.</p>
            <input
              type="text"
              value={lessonTitleInput}
              onChange={(e) => setLessonTitleInput(e.target.value)}
              placeholder="e.g., Lesson 1: Introduction"
              className="inline-modal-input"
              autoFocus
            />
            <div className="inline-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowLessonModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleCreateLesson} disabled={saving}>
                {saving ? 'Adding...' : 'Add Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
