import { useMemo, useState } from 'react'
import CourseCard from '../components/CourseCard'
import BootcampGrid from '../components/BootcampGrid'
import { courses } from '../data/coursesData'
import styles from './Courses.module.css'

const courseMetaById = {
  1: { domain: 'Data Science', topic: 'SST-NSET', courseType: 'Free', level: 'Intermediate' },
  2: { domain: 'Software Engineering', topic: 'NodeJS', courseType: 'Free', level: 'Advanced' },
  3: { domain: 'Software Engineering', topic: 'Beginner', courseType: 'Free', level: 'Beginner' },
  4: { domain: 'Data Science', topic: 'React', courseType: 'Paid', level: 'Intermediate' },
  5: { domain: 'Software Engineering', topic: 'React', courseType: 'Free', level: 'Beginner' },
  6: { domain: 'Software Engineering', topic: 'NodeJS', courseType: 'Paid', level: 'Intermediate' },
  7: { domain: 'Software Engineering', topic: 'SST-NSET', courseType: 'Paid', level: 'Advanced' },
  8: { domain: 'Data Science', topic: 'Data Analytics', courseType: 'Free', level: 'Advanced' },
}
const PAGE_SIZE = 8

function Courses() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const enrichedCourses = useMemo(
    () =>
      courses.map((course) => {
        const meta = courseMetaById[course.id] ?? {
          domain: 'Software Engineering',
          topic: 'Beginner',
          courseType: 'Free',
          level: 'Beginner',
        }

        return {
          ...course,
          ...meta,
          lessonCount: course.lessons?.length ?? 0,
        }
      }),
    [],
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

          {filteredCourses.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No courses match your search</h3>
              <p>Try removing some filters or searching with broader keywords.</p>
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