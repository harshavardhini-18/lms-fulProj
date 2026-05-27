# Dashboard Integration with Existing Backend

## 🎯 Overview

This guide explains how to integrate the new Student Dashboard with your existing backend API endpoints.

## ✅ Existing Backend Endpoints

Your backend already has these endpoints that the dashboard can use:

### Course Progress Endpoints
```
POST   /api/course-progress                    # Create progress
GET    /api/course-progress                    # Get user's all course progress
GET    /api/course-progress/:courseId          # Get specific course progress
PATCH  /api/course-progress/:progressId        # Update progress
```

### Quiz Progress Endpoints
```
GET    /api/quiz-progress                      # Get user's all quiz progress
GET    /api/quiz-progress/:quizId              # Get specific quiz progress
PATCH  /api/quiz-progress/:quizId/attempt      # Update with attempt
```

## 🔄 Mapping Dashboard to Existing Endpoints

### Dashboard Data Requirement: Course Progress Summary

**What the dashboard needs:**
```javascript
{
  enrolled_courses_count: 22,
  lessons_total: 45,
  lessons_completed: 28,
  quizzes_total: 12,
  quizzes_passed: 9,
  completion_percent: 62
}
```

**How to get it from existing endpoints:**

```javascript
// Fetch all user's course progress
GET /api/course-progress
// Response includes array of all courses with:
// - lessons_total, lessons_completed
// - quizzes_total, quizzes_passed  
// - completion_percent

// Then aggregate in dashboard service:
const aggregateProgress = (courses) => {
  const totals = courses.reduce((acc, course) => ({
    enrolled_count: acc.enrolled_count + 1,
    lessons_total: acc.lessons_total + course.lessons_total,
    lessons_completed: acc.lessons_completed + course.lessons_completed,
    quizzes_total: acc.quizzes_total + course.quizzes_total,
    quizzes_passed: acc.quizzes_passed + course.quizzes_passed,
  }), {
    enrolled_count: 0,
    lessons_total: 0,
    lessons_completed: 0,
    quizzes_total: 0,
    quizzes_passed: 0,
  })
  
  return {
    enrolled_courses_count: totals.enrolled_count,
    lessons_total: totals.lessons_total,
    lessons_completed: totals.lessons_completed,
    quizzes_total: totals.quizzes_total,
    quizzes_passed: totals.quizzes_passed,
    completion_percent: Math.round((totals.lessons_completed / totals.lessons_total) * 100)
  }
}
```

### Dashboard Data Requirement: All Courses with Progress

**Existing endpoint provides exactly this:**
```
GET /api/course-progress
```

Returns array of courses with all necessary data for ContinueLearning component.

### Dashboard Data Requirement: Quiz Progress

**Existing endpoint provides this:**
```
GET /api/quiz-progress
```

Returns array of quizzes with progress data for QuizPerformanceWidget.

## 📝 Updated Dashboard Service

Update your `dashboardService.js` to use existing endpoints:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'

/**
 * Fetch student's aggregated course progress
 */
export const fetchStudentCourseProgress = async (token) => {
  try {
    // Get all courses
    const response = await fetch(`${API_BASE_URL}/course-progress`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const courses = await response.json()

    // Aggregate data
    const summary = courses.reduce((acc, course) => ({
      enrolled_count: acc.enrolled_count + 1,
      lessons_total: acc.lessons_total + (course.lessons_total || 0),
      lessons_completed: acc.lessons_completed + (course.lessons_completed || 0),
      quizzes_total: acc.quizzes_total + (course.quizzes_total || 0),
      quizzes_passed: acc.quizzes_passed + (course.quizzes_passed || 0),
    }), {
      enrolled_count: 0,
      lessons_total: 0,
      lessons_completed: 0,
      quizzes_total: 0,
      quizzes_passed: 0,
    })

    return {
      id: 1,
      enrolled_courses_count: summary.enrolled_count,
      lessons_total: summary.lessons_total,
      lessons_completed: summary.lessons_completed,
      quizzes_total: summary.quizzes_total,
      quizzes_passed: summary.quizzes_passed,
      completion_percent: summary.lessons_total > 0 
        ? Math.round((summary.lessons_completed / summary.lessons_total) * 100)
        : 0,
      courses: courses
    }
  } catch (error) {
    console.error('Error fetching student course progress:', error)
    throw error
  }
}

/**
 * Fetch all courses for a student
 */
export const fetchStudentCourses = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course-progress`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

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
 */
export const fetchQuizProgress = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz-progress`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

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
 * Fetch specific course progress
 */
export const fetchCourseProgress = async (courseId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course-progress/${courseId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching course progress:', error)
    throw error
  }
}
```

## 🔧 Updated StudentDashboard Component

Update the main dashboard to use the existing endpoints:

```jsx
useEffect(() => {
  fetchDashboardData()
}, [])

const fetchDashboardData = async () => {
  try {
    const token = localStorage.getItem('token')

    if (!token) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    // Use the aggregated endpoint
    const data = await fetchStudentCourseProgress(token)
    setDashboardData(data)
  } catch (err) {
    setError(err.message)
    console.error('Dashboard error:', err)
  } finally {
    setLoading(false)
  }
}
```

## 📊 Data Transformation Examples

### Transform Course Progress to Dashboard Format

```javascript
const transformCourseForDashboard = (courseProgress) => ({
  id: courseProgress.course_id,
  title: courseProgress.course_name || 'Course',
  instructor: courseProgress.instructor || 'Instructor',
  progress: courseProgress.completion_percent || 0,
  thumbnail: courseProgress.thumbnail_url || '',
  lessons: {
    completed: courseProgress.lessons_completed || 0,
    total: courseProgress.lessons_total || 0,
  },
  quizzes: {
    passed: courseProgress.quizzes_passed || 0,
    total: courseProgress.quizzes_total || 0,
  },
  status: courseProgress.status || 'in_progress',
  enrolled_at: courseProgress.enrolled_at,
  completed_at: courseProgress.completed_at,
})
```

### Transform Quiz Progress

```javascript
const transformQuizProgressForDashboard = (quizzes) => {
  const passed = quizzes.filter(q => q.is_passed).length
  const total = quizzes.length
  
  return {
    total_quizzes: total,
    passed_quizzes: passed,
    failed_quizzes: total - passed,
    pass_rate_percent: total > 0 ? Math.round((passed / total) * 100) : 0,
  }
}
```

## 🚀 Integration Steps

### Step 1: Update Dashboard Service
Replace `dashboardService.js` with the code above

### Step 2: Update StudentDashboard Component
Modify the `useEffect` hook to use the aggregated endpoint

### Step 3: Test Endpoints
```bash
# Test course progress endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/course-progress

# Test quiz progress endpoint  
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/quiz-progress
```

### Step 4: Verify Dashboard Works
Navigate to `/student/dashboard` and verify data loads

## 🔗 Endpoint Reference

### Get User Course Progress
```
GET /api/course-progress
Authorization: Bearer {token}

Response:
[
  {
    id: 1,
    course_id: 1,
    course_name: "Course Title",
    instructor: "Instructor Name",
    lessons_completed: 8,
    lessons_total: 12,
    quizzes_passed: 2,
    quizzes_total: 3,
    completion_percent: 65,
    status: "in_progress",
    enrolled_at: "2026-01-15T...",
    completed_at: null
  },
  ...
]
```

### Get User Quiz Progress
```
GET /api/quiz-progress
Authorization: Bearer {token}

Response:
[
  {
    id: 1,
    quiz_id: 5,
    quiz_name: "Quiz Title",
    total_attempts: 2,
    best_score: 85,
    latest_score: 80,
    is_passed: true,
    first_attempt_at: "2026-05-10T...",
    last_attempt_at: "2026-05-15T...",
    passed_at: "2026-05-15T..."
  },
  ...
]
```

## ✅ Checklist

- [ ] Copy updated `dashboardService.js`
- [ ] Update `StudentDashboard.jsx` useEffect
- [ ] Test `/api/course-progress` endpoint
- [ ] Test `/api/quiz-progress` endpoint
- [ ] Navigate to dashboard and verify data loads
- [ ] Check console for any errors
- [ ] Verify charts and progress bars display correctly

## 🐛 Troubleshooting

### Dashboard shows empty data
1. Check if endpoints return data: `GET /api/course-progress`
2. Verify token is valid
3. Check browser Network tab for failed requests

### Wrong data shown
1. Verify endpoint response format
2. Check data transformation logic
3. Compare with existing response structure

### Styling not applied
1. Ensure Tailwind CSS is configured
2. Check if components are importing CSS correctly
3. Clear browser cache

## 📚 Related Documentation

- `STUDENT_DASHBOARD_GUIDE.md` - Component documentation
- `DASHBOARD_IMPLEMENTATION_NOTES.md` - Implementation details
- `DATABASE_QUERIES_REFERENCE.md` - Detailed SQL queries

---

**Status:** Ready for Integration
**Last Updated:** 26 May 2026
