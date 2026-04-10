import { Link } from 'react-router-dom'
import styles from './CourseCard.module.css'

function CourseCard({ course }) {
  const fallbackImage = `https://picsum.photos/seed/${course.id}-fallback/640/360`
  const lessonCount = course.lessonCount ?? course.lessons?.length ?? 0
  const techBadges = [course.domain, course.topic].filter(Boolean)

  return (
    <Link to={`/courses/${course.id}`} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.thumb}>
          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className={styles.thumbImg}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = fallbackImage
              }}
            />
          ) : (
            <div className={styles.thumbFallback}>
              <p className={styles.thumbTitle}>{course.title}</p>
            </div>
          )}

          {course.level && (
            <span className={styles.levelBadge}>{course.level}</span>
          )}
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{course.title}</h3>
{/* 
          <p className={styles.author}>
            By <b>Better Tomorrow</b>
          </p> */}

          <div className={styles.ratingRow}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.ratingNum}>4.8</span>
          </div>

          {techBadges.length > 0 && (
            <div className={styles.techStack}>
              {techBadges.map((badge) => (
                <span key={badge} className={styles.techBadge}>
                  <span className={styles.techDot} />
                  {badge}
                </span>
              ))}
            </div>
          )}

          <div className={styles.divider} />

          <p className={styles.author}>
            {lessonCount} lessons 
            {' '}
            •
            {' '}
            {course.duration}
          </p>

          <div className={styles.startBtn}>
            Start Learning
          </div>
        </div>
      </article>
    </Link>
  )
}

export default CourseCard