import { useEffect, useMemo, useState } from 'react'
import CourseCard from '../components/CourseCard'
import BootcampGrid from '../components/BootcampGrid'
import { listBackendCourses } from '../api/courses'
import styles from './Courses.module.css'

const PAGE_SIZE = 8

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      try {
        setLoading(true)
        const backendCourses = await listBackendCourses()
        if (cancelled) return
        const publishedOnly = Array.isArray(backendCourses)
          ? backendCourses.filter((course) => String(course?.status || '').toLowerCase() === 'published')
          : []
        setCourses(publishedOnly)
      } catch {
        if (cancelled) return
        setCourses([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCourses()
    return () => {
      cancelled = true
    }
  }, [])

  const deriveDuration = (course) => {
    const totalSeconds = Number(course?.totalVideoDuration || 0)
    if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
      const hrs = Math.max(1, Math.round(totalSeconds / 3600))
      return `${hrs} Hrs`
    }
    return 'Self paced'
  }

  const getTopicTag = (title = '') => {
    const t = String(title).toLowerCase()
    if (t.includes('react')) return 'React'
    if (t.includes('node')) return 'NodeJS'
    if (t.includes('data')) return 'Data Analytics'
    if (t.includes('python')) return 'Python'
    return 'Beginner'
  }

  const enrichedCourses = useMemo(
    () =>
      courses.map((course) => {
        const modules = Array.isArray(course.modules) ? course.modules : []
        const lessonCountFromModules = modules.reduce(
          (sum, m) => sum + (Array.isArray(m.lessons) ? m.lessons.length : 0),
          0
        )
        const lessonCount = Number(course.lessonCount ?? course.lesson_count)

        return {
          id: String(course._id || course.id),
          title: course.title || 'Untitled course',
          description: course.description || '',
          image: course.thumbnailUrl || course.bannerUrl || '',
          duration: deriveDuration(course),
          level: course.level || 'Beginner',
          domain: String(course.tags?.[0] || 'Software Engineering'),
          topic: getTopicTag(course.title),
          lessonCount:
            Number.isFinite(lessonCount) && lessonCount >= 0
              ? lessonCount
              : lessonCountFromModules,
          modules,
        }
      }),
    [courses],
  )

  const filterOptions = useMemo(() => {
    const getUniqueValues = (field) =>
      [...new Set(enrichedCourses.map((course) => course[field]))].sort((a, b) =>
        a.localeCompare(b),
      )

    return {
      domains: getUniqueValues('domain'),
      levels: getUniqueValues('level'),
    }
  }, [enrichedCourses])

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return enrichedCourses.filter((course) => {
      const matchesSearch =
        query.length === 0 ||
        [course.title, course.description, course.domain, course.topic, course.level]
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesDomain = selectedDomain === 'All' || selectedDomain === course.domain
      const matchesLevel = selectedLevel === 'All' || selectedLevel === course.level

      return matchesSearch && matchesDomain && matchesLevel
    })
  }, [enrichedCourses, searchTerm, selectedDomain, selectedLevel])

  const visibleCourses = filteredCourses.slice(0, visibleCount)
  const getOptionCount = (field, value) =>
    enrichedCourses.filter((course) => course[field] === value).length

  const updateSearch = (value) => {
    setSearchTerm(value)
    setVisibleCount(PAGE_SIZE)
  }

  const updateDomain = (value) => {
    setSelectedDomain(value)
    setVisibleCount(PAGE_SIZE)
  }

  const updateLevel = (value) => {
    setSelectedLevel(value)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <section className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.filterPanel}>
          <div className={styles.filterHeader}>
            <h2>Filters</h2>
          </div>

          <div className={styles.filterGroup}>
            <h3>Category</h3>
            <label className={styles.filterOption}>
              <input
                type="radio"
                name="domain"
                checked={selectedDomain === 'All'}
                onChange={() => updateDomain('All')}
              />
              <span>All</span>
            </label>
            {filterOptions.domains.map((domain) => (
              <label key={domain} className={styles.filterOption}>
                <input
                  type="radio"
                  name="domain"
                  checked={selectedDomain === domain}
                  onChange={() => updateDomain(domain)}
                />
                <span>{domain}</span>
                <small>{getOptionCount('domain', domain)}</small>
              </label>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <h3>Level</h3>
            <label className={styles.filterOption}>
              <input
                type="radio"
                name="level"
                checked={selectedLevel === 'All'}
                onChange={() => updateLevel('All')}
              />
              <span>All</span>
            </label>
            {filterOptions.levels.map((level) => (
              <label key={level} className={styles.filterOption}>
                <input
                  type="radio"
                  name="level"
                  checked={selectedLevel === level}
                  onChange={() => updateLevel(level)}
                />
                <span>{level}</span>
                <small>{getOptionCount('level', level)}</small>
              </label>
            ))}
          </div>

        </aside>

        <div className={styles.contentArea}>
          <div className={styles.topBar}>
            <label className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden="true">⌕</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search courses..."
                className={styles.searchInput}
              />
            </label>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <h3>Loading courses...</h3>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No courses match your search</h3>
              <p>Only admin-added courses are shown here.</p>
            </div>
          ) : (
            <div className={styles.gridShell}>
              <div className={styles.grid}>
                {visibleCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

                {visibleCount < filteredCourses.length && (
                <div className={styles.viewMoreWrap}>
                  <button
                    type="button"
                    className={styles.viewMoreBtn}
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    aria-label="View more courses"
                  >
                    <span className={styles.viewMoreLabel}>View More</span>
                    <span className={styles.viewMoreArrow} aria-hidden>→</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.bootcampSection}>
        <BootcampGrid courses={enrichedCourses} />
      </div>
    </section>
  )
}

export default Courses