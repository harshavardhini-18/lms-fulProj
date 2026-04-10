import { useMemo, useState } from 'react'
import styles from './TableOfContents.module.css'

function formatTimestamp(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getCourseProgress(lessonsCount, activeIndex) {
  if (lessonsCount === 0) {
    return 0
  }

  const completedLessons = Math.max(0, Math.min(activeIndex, lessonsCount))
  return Math.round((completedLessons / lessonsCount) * 100)
}

function TableOfContents({ lessons, modules = [], activeLessonIndex, onLessonSelect }) {
  const preparedModules = useMemo(() => {
    if (!modules.length) {
      return [
        {
          id: 'all-lessons',
          title: 'Course Content',
          lessons: lessons.map((lesson, index) => ({ ...lesson, index })),
        },
      ]
    }

    return modules.map((module, moduleIndex) => ({
      id: module.id ?? `module-${moduleIndex}`,
      title: module.title,
      lessons: (module.lessons ?? []).map((lesson) => ({
        ...lesson,
        index: lesson.index ?? lessons.findIndex((item) => item.title === lesson.title),
      })),
    }))
  }, [lessons, modules])

  const [expandedModules, setExpandedModules] = useState(() =>
    preparedModules.length ? [preparedModules[0].id] : [],
  )

  const activeModuleId = useMemo(
    () =>
      preparedModules.find((module) =>
        module.lessons.some((lesson) => lesson.index === activeLessonIndex),
      )?.id,
    [activeLessonIndex, preparedModules],
  )

  const progressPercent = getCourseProgress(lessons.length, activeLessonIndex)

  const toggleModule = (moduleId) => {
    setExpandedModules((previous) =>
      previous.includes(moduleId)
        ? previous.filter((item) => item !== moduleId)
        : [...previous, moduleId],
    )
  }

  return (
    <aside className={styles.panel} aria-label="Course table of contents">
      <div className={styles.header}>
        <h3>Table of Contents</h3>
        <span>{progressPercent}%</span>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>

      <ul className={styles.moduleList}>
        {preparedModules.map((module) => {
          const isExpanded = expandedModules.includes(module.id) || module.id === activeModuleId

          return (
            <li key={module.id} className={styles.moduleItem}>
              <button
                type="button"
                className={styles.moduleButton}
                onClick={() => toggleModule(module.id)}
              >
                <span>{module.title}</span>
                <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`.trim()}>
                  ▾
                </span>
              </button>

              {isExpanded && (
                <ul className={styles.lessonList}>
                  {module.lessons.length === 0 ? (
                    <li className={styles.emptyState}>No chapters yet</li>
                  ) : (
                    module.lessons.map((lesson) => {
                      const isActive = lesson.index === activeLessonIndex

                      return (
                        <li key={`${lesson.title}-${lesson.startSeconds}`}>
                          <button
                            type="button"
                            className={`${styles.lessonButton} ${isActive ? styles.active : ''}`.trim()}
                            onClick={() => onLessonSelect(lesson.index, lesson.startSeconds)}
                          >
                            <span className={styles.statusDot}>✓</span>
                            <span className={styles.details}>
                              <strong>{lesson.title}</strong>
                              <small>{formatTimestamp(lesson.startSeconds)}</small>
                            </span>
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default TableOfContents
