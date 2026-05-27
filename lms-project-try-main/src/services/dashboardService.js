const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

/**
 * Fetch student's course progress data
 * @param {string} userId - Student user ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Course progress data
 */
export const fetchStudentCourseProgress = async (userId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/student-course-progress/${userId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching student course progress:', error)
    throw error
  }
}

/**
 * Fetch all courses for a student
 * @param {string} userId - Student user ID
 * @param {string} token - Auth token
 * @returns {Promise<Array>} List of courses
 */
export const fetchStudentCourses = async (userId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/student/${userId}/courses`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching student courses:', error)
    throw error
  }
}

/**
 * Fetch quiz progress for a student
 * @param {string} userId - Student user ID
 * @param {string} courseId - Course ID
 * @param {string} token - Auth token
 * @returns {Promise<Array>} Quiz progress data
 */
export const fetchQuizProgress = async (userId, courseId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/quiz-progress/${userId}/course/${courseId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching quiz progress:', error)
    throw error
  }
}

/**
 * Fetch course progress for specific course
 * @param {string} userId - Student user ID
 * @param {string} courseId - Course ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Course progress data
 */
export const fetchCourseProgress = async (userId, courseId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/course-progress/${userId}/${courseId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching course progress:', error)
    throw error
  }
}

/**
 * Fetch recent activity for dashboard
 * @param {string} userId - Student user ID
 * @param {string} token - Auth token
 * @param {number} limit - Number of recent activities to fetch
 * @returns {Promise<Array>} Recent activities
 */
export const fetchRecentActivity = async (userId, token, limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/student/${userId}/activities?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    throw error
  }
}

/**
 * Fetch dashboard analytics summary
 * @param {string} userId - Student user ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Analytics data
 */
export const fetchDashboardAnalytics = async (userId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/student/${userId}/analytics`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    throw error
  }
}
