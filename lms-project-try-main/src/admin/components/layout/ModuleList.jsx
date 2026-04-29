import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ModuleList.css';

export default function ModuleList({
  courseId,
  modules = [],
  selectedModuleId,
  newlyCreatedModuleId,
  newlyCreatedLessonId,
  onSelectModule,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onSelectLesson,
  onDeleteLesson,
}) {
  const [expandedModules, setExpandedModules] = useState(new Set([modules[0]?._id]));

  const toggleModuleExpand = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  if (!modules.length) {
    return (
      <div className="module-list empty">
        <p>No modules yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="module-list">
      {modules.map((module, idx) => (
        <div
          key={module._id}
          className={`module-item ${newlyCreatedModuleId === module._id ? 'is-new' : ''}`}
        >
          {/* Module Header */}
          <div className="module-header" onClick={() => onSelectModule(module)}>
            <button
              className="expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleModuleExpand(module._id);
              }}
            >
              {expandedModules.has(module._id) ? '▼' : '▶'}
            </button>

            <div className="module-title-section">
              <h4 className={selectedModuleId === module._id ? 'active' : ''}>
                Module {idx + 1}: {module.title}
              </h4>
              <span className="lesson-count">
                {module.lessons?.length || 0} lessons
              </span>
            </div>

            <div className="module-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn-icon edit"
                onClick={() => onEditModule(module)}
                title="Edit Module"
              >
                ✎
              </button>
              <button
                className="btn-icon delete"
                onClick={() => {
                  if (window.confirm(`Delete "${module.title}" and all its lessons?`)) {
                    onDeleteModule(module._id);
                  }
                }}
                title="Delete Module"
              >
                🗑
              </button>
            </div>
          </div>

          {/* Module Content (Lessons) */}
          {expandedModules.has(module._id) && (
            <div className="module-content">
              {/* Lessons List */}
              {module.lessons && module.lessons.length > 0 && (
                <div className="lessons-list">
                  {module.lessons.map((lesson, lessonIdx) => (
                    <div
                      key={lesson._id}
                      className={`lesson-item ${newlyCreatedLessonId === lesson._id ? 'is-new' : ''}`}
                      onClick={() => onSelectLesson(module._id, lesson)}
                    >
                      <div className="lesson-info">
                        <span className="lesson-number">L{lessonIdx + 1}</span>
                        <span className="lesson-title">{lesson.title}</span>
                      </div>

                      <div className="lesson-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-icon"
                          onClick={() => onSelectLesson(module._id, lesson)}
                          title="Edit Lesson"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => {
                            if (window.confirm(`Delete "${lesson.title}"?`)) {
                              onDeleteLesson(module._id, lesson._id);
                            }
                          }}
                          title="Delete Lesson"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Lesson Button */}
              <button
                className="btn-add-lesson"
                onClick={() => onAddLesson(module)}
              >
                Add Lesson
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
