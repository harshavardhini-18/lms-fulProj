import React, { useState, useRef } from 'react';
import './ModuleList.css';

const STATUS_CONFIG = {
  published: { color: '#10b981', icon: '✔', label: 'Published' },
  draft:     { color: '#f59e0b', icon: '◐', label: 'Draft' },
  archived:  { color: '#64748b', icon: '○', label: 'Archived' },
};

export default function ModuleList({
  modules = [],
  selectedModuleId,
  selectedLessonId,
  newlyCreatedModuleId,
  newlyCreatedLessonId,
  onSelectCourse,
  onSelectModule,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onSelectLesson,
  onDeleteLesson,
  onReorderModules,   // (newOrderedModules) => void
  onReorderLessons,  // (moduleId, newOrderedLessons) => void
  viewMode,
}) {
  const [expandedModules, setExpandedModules] = useState(
    new Set(modules.map((m) => m._id))
  );

  // ── drag state ──────────────────────────────────────────────
  const dragModuleIdx = useRef(null);
  const dragLessonInfo = useRef(null); // { moduleId, lessonIdx }

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // ── module drag handlers ─────────────────────────────────────
  const handleModuleDragStart = (e, idx) => {
    dragModuleIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleModuleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleModuleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragModuleIdx.current;
    if (from === null || from === idx) return;
    if (!onReorderModules) return;
    const reordered = [...modules];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(idx, 0, moved);
    onReorderModules(reordered);
    dragModuleIdx.current = null;
  };

  // ── lesson drag handlers ─────────────────────────────────────
  const handleLessonDragStart = (e, moduleId, lessonIdx) => {
    dragLessonInfo.current = { moduleId, lessonIdx };
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };
  const handleLessonDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleLessonDrop = (e, moduleId, lessonIdx) => {
    e.preventDefault();
    e.stopPropagation();
    const info = dragLessonInfo.current;
    if (!info || info.moduleId !== moduleId || info.lessonIdx === lessonIdx) return;
    if (!onReorderLessons) return;
    const module = modules.find((m) => m._id === moduleId);
    if (!module) return;
    const reordered = [...(module.lessons || [])];
    const [moved] = reordered.splice(info.lessonIdx, 1);
    reordered.splice(lessonIdx, 0, moved);
    onReorderLessons(moduleId, reordered);
    dragLessonInfo.current = null;
  };

  return (
    <div className="ml-root">
      {/* Course overview button */}
      <button
        type="button"
        className={`ml-overview-btn${viewMode === 'course' ? ' active' : ''}`}
        onClick={onSelectCourse}
      >
        <svg className="ml-overview-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
        Course Overview
      </button>

      {/* Modules header */}
      <div className="ml-modules-header">
        <span className="ml-modules-label">Modules</span>
        <span className="ml-modules-count">{modules.length}</span>
      </div>

      {modules.length === 0 && (
        <div className="ml-empty">
          <p>No modules yet.</p>
          <p>Click <strong>+ Add Module</strong> below.</p>
        </div>
      )}

      <div className="ml-module-list">
        {modules.map((module, idx) => {
          const isExpanded = expandedModules.has(module._id);
          const isModuleSelected = selectedModuleId === module._id && viewMode === 'module';
          const isNew = newlyCreatedModuleId === module._id;

          return (
            <div
              key={module._id}
              className={`ml-module${isNew ? ' is-new' : ''}`}
              draggable
              onDragStart={(e) => handleModuleDragStart(e, idx)}
              onDragOver={(e) => handleModuleDragOver(e, idx)}
              onDrop={(e) => handleModuleDrop(e, idx)}
            >
              {/* Module row */}
              <div className={`ml-module-row${isModuleSelected ? ' selected' : ''}`}>
                {/* Drag handle */}
                <span className="ml-drag-handle" title="Drag to reorder">
                  <svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor">
                    <circle cx="3" cy="3" r="1.5" />
                    <circle cx="7" cy="3" r="1.5" />
                    <circle cx="3" cy="8" r="1.5" />
                    <circle cx="7" cy="8" r="1.5" />
                    <circle cx="3" cy="13" r="1.5" />
                    <circle cx="7" cy="13" r="1.5" />
                  </svg>
                </span>

                {/* Chevron */}
                <button
                  type="button"
                  className="ml-chevron"
                  onClick={() => toggleModule(module._id)}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Module icon + name */}
                <button
                  type="button"
                  className="ml-module-name"
                  onClick={() => onEditModule(module)}
                >
                  <span className="ml-module-icon" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L11 21.73a2 2 0 0 0 2 0L20 17.73A2 2 0 0 0 21 16z" />
                    </svg>
                  </span>
                  <span className="ml-module-title">{module.title}</span>
                </button>

                {/* Actions (hover) */}
                <div className="ml-module-actions">
                  <button
                    type="button"
                    className="ml-icon-btn ml-icon-btn-add"
                    onClick={() => onAddLesson(module)}
                    title="Add topic"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="ml-icon-btn ml-icon-btn-danger"
                    onClick={() => {
                      if (window.confirm(`Delete "${module.title}" and all its topics?`)) {
                        onDeleteModule(module._id);
                      }
                    }}
                    title="Delete module"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Topics */}
              {isExpanded && (
                <div className="ml-lessons">
                  {module.lessons && module.lessons.length > 0 ? (
                    module.lessons.map((lesson, lessonIdx) => {
                      const isLessonSelected = selectedLessonId === lesson._id && viewMode === 'lesson';
                      const isNewLesson = newlyCreatedLessonId === lesson._id;
                      const st = STATUS_CONFIG[lesson.status] || STATUS_CONFIG.draft;

                      return (
                        <div
                          key={lesson._id}
                          className={`ml-lesson-row${isLessonSelected ? ' selected' : ''}${isNewLesson ? ' is-new' : ''}`}
                          draggable
                          onDragStart={(e) => handleLessonDragStart(e, module._id, lessonIdx)}
                          onDragOver={handleLessonDragOver}
                          onDrop={(e) => handleLessonDrop(e, module._id, lessonIdx)}
                        >
                          {/* Drag handle */}
                          <span className="ml-drag-handle ml-drag-handle-lesson" title="Drag to reorder">
                            <svg width="8" height="12" viewBox="0 0 10 16" fill="currentColor">
                              <circle cx="3" cy="3" r="1.5" />
                              <circle cx="7" cy="3" r="1.5" />
                              <circle cx="3" cy="8" r="1.5" />
                              <circle cx="7" cy="8" r="1.5" />
                              <circle cx="3" cy="13" r="1.5" />
                              <circle cx="7" cy="13" r="1.5" />
                            </svg>
                          </span>

                          <button
                            type="button"
                            className="ml-lesson-btn"
                            onClick={() => onSelectLesson(module._id, lesson)}
                          >
                            {/* Bullet + status */}
                            <span
                              className="ml-lesson-bullet"
                              style={{ color: st.color }}
                              title={st.label}
                            >
                              {st.icon}
                            </span>
                            <span className="ml-lesson-title">{lesson.title}</span>
                          </button>

                          <button
                            type="button"
                            className="ml-icon-btn ml-icon-btn-danger ml-lesson-delete"
                            onClick={() => {
                              if (window.confirm(`Delete topic "${lesson.title}"?`)) {
                                onDeleteLesson(module._id, lesson._id);
                              }
                            }}
                            title="Delete topic"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="ml-no-lessons">No topics yet</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
