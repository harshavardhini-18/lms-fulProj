import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './BootcampGrid.module.css'

function buildBootcampHeading(course) {
  const topic = `${course.topic || ''}`.toLowerCase()
  const domain = `${course.domain || ''}`.toLowerCase()

  if (topic.includes('node') || topic.includes('react') || domain.includes('software')) {
    return 'THE COMPLETE MERN STACK BOOTCAMP'
  }

  return `THE COMPLETE ${course.title} COURSE`
}

function buildSubtitle(course) {
  if (course.domain === 'Data Science') {
    return 'Project-based AI and analytics learning path'
  }
  return 'Hands-on bootcamp with guided real-world projects'
}

function BootcampCard({ course, onStart }) {
  const heading = buildBootcampHeading(course)
  const subtitle = buildSubtitle(course)

  return (
    <article className={styles.card}>
      <div className={styles.thumb}>
        {course.image ? (
          <img src={course.image} alt={course.title} className={styles.thumbImg} />
        ) : (
          <div
            className={styles.thumbFallback}
            style={{ background: course.accentColor ?? '#1a1a2e' }}
          >
            <span className={styles.thumbTitle}>{course.title}</span>
          </div>
        )}
        <span className={styles.levelBadge}>{course.level ?? 'Beginner'}</span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{heading}</h3>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.divider} />

        <button
          className={styles.startBtn}
          onClick={() => onStart?.(course)}
          type="button"
        >
          Start Learning
        </button>
      </div>
    </article>
  )
}

export function BootcampGrid({ courses, onStart, title = 'Bootcamp Program' }) {
  const navigate = useNavigate()
  const topCourses = useMemo(() => courses.slice(0, 4), [courses])

  const handleStart = (course) => {
    if (onStart) {
      onStart(course)
    } else {
      navigate(`/courses/${course.id}`)
    }
  }

  if (!topCourses.length) return null

  return (
    <section className={styles.section}>
      {title && <h2 className={styles.sectionTitle}>{title}</h2>}
      <div className={styles.grid}>
        {topCourses.map((course) => (
          <BootcampCard key={course.id} course={course} onStart={handleStart} />
        ))}
      </div>
    </section>
  )
}

export default BootcampGrid
