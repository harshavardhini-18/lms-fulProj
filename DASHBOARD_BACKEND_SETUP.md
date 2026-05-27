# Dashboard Backend Integration - Setup Guide

## Quick Start

This guide explains how to integrate the new Student Dashboard with your PostgreSQL backend.

## Step 1: Add Dashboard Route to App.jsx

```jsx
import StudentDashboardPage from './pages/StudentDashboardPage'

// Add this inside your Routes:
<Route 
  path="/student/dashboard" 
  element={
    <ProtectedRoute isLoading={isAuthLoading} user={authUser}>
      <StudentDashboardPage />
    </ProtectedRoute>
  } 
/>
```

## Step 2: Backend API Endpoints Needed

Your backend needs to provide the following endpoints for the dashboard to work:

### 1. **Get Student Course Progress Summary**

**Endpoint:** `GET /api/student-course-progress/:userId`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "enrolled_courses_count": 22,
  "active_courses": 5,
  "lessons_total": 45,
  "lessons_completed": 28,
  "quizzes_total": 12,
  "quizzes_passed": 9,
  "completion_percent": 62,
  "total_study_hours": 24.5
}
```

**Implementation Example (Node.js/Express):**
```javascript
app.get('/api/student-course-progress/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    
    // Get enrolled courses count
    const courseCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM course_progress WHERE user_id = $1',
      [userId]
    )
    
    // Get lessons and quiz totals
    const progressResult = await pool.query(`
      SELECT 
        SUM(lessons_total) as lessons_total,
        SUM(lessons_completed) as lessons_completed,
        SUM(quizzes_total) as quizzes_total,
        SUM(quizzes_passed) as quizzes_passed,
        ROUND(AVG(completion_percent), 2) as completion_percent
      FROM course_progress
      WHERE user_id = $1
    `, [userId])
    
    const data = progressResult.rows[0]
    
    res.json({
      id: userId,
      user_id: userId,
      enrolled_courses_count: courseCountResult.rows[0].count,
      lessons_total: data.lessons_total || 0,
      lessons_completed: data.lessons_completed || 0,
      quizzes_total: data.quizzes_total || 0,
      quizzes_passed: data.quizzes_passed || 0,
      completion_percent: Math.round(data.completion_percent || 0)
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### 2. **Get All Student Courses**

**Endpoint:** `GET /api/student/:userId/courses`

**Response:**
```json
[
  {
    "id": 1,
    "title": "Strings and String Handling",
    "instructor": "Kunal Kushwaha",
    "progress": 65,
    "thumbnail": "https://...",
    "lessons": {
      "completed": 8,
      "total": 12
    },
    "quizzes": {
      "passed": 2,
      "total": 3
    },
    "status": "in_progress",
    "enrolled_at": "2026-01-15T10:42:16.074189+05:30",
    "completed_at": null
  }
]
```

**SQL Query:**
```sql
SELECT 
  c.id,
  c.title,
  c.instructor,
  cp.completion_percent as progress,
  c.thumbnail_url as thumbnail,
  cp.lessons_completed,
  cp.lessons_total,
  cp.quizzes_passed,
  cp.quizzes_total,
  cp.status,
  cp.enrolled_at,
  cp.completed_at
FROM course_progress cp
JOIN courses c ON cp.course_id = c.id
WHERE cp.user_id = $1
ORDER BY cp.last_watched_at DESC;
```

### 3. **Get Quiz Progress for Course**

**Endpoint:** `GET /api/quiz-progress/:userId/course/:courseId`

**Response:**
```json
[
  {
    "id": 1,
    "quiz_id": 5,
    "quiz_title": "Checkpoint Quiz",
    "total_attempts": 2,
    "best_score": 85,
    "latest_score": 80,
    "is_passed": true,
    "first_attempt_at": "2026-05-10T10:00:00Z",
    "last_attempt_at": "2026-05-15T14:30:00Z",
    "passed_at": "2026-05-15T14:30:00Z"
  }
]
```

**SQL Query:**
```sql
SELECT 
  qp.id,
  qp.quiz_id,
  q.title as quiz_title,
  qp.total_attempts,
  qp.best_score,
  qp.latest_score,
  qp.is_passed,
  qp.first_attempt_at,
  qp.last_attempt_at,
  qp.passed_at
FROM quiz_progress qp
JOIN quizzes q ON qp.quiz_id = q.id
WHERE qp.user_id = $1 AND q.course_id = $2
ORDER BY qp.last_attempt_at DESC;
```

### 4. **Get Student Activities**

**Endpoint:** `GET /api/student/:userId/activities?limit=10`

**Response:**
```json
[
  {
    "id": 1,
    "type": "completed",
    "title": "Completed Physics Lesson 4",
    "timestamp": "2026-05-26T14:30:00Z",
    "course_id": 3,
    "lesson_id": 45
  },
  {
    "id": 2,
    "type": "quiz",
    "title": "Passed Chemistry Quiz",
    "timestamp": "2026-05-26T11:15:00Z",
    "course_id": 2,
    "quiz_id": 12
  }
]
```

**SQL Query:**
```sql
-- Combine different activity types
(
  SELECT 
    'lesson_completed' as type,
    'Completed ' || l.title as title,
    cpl.completed_at as timestamp,
    c.id as course_id,
    l.id as lesson_id
  FROM course_progress cp
  JOIN courses c ON cp.course_id = c.id
  WHERE cp.user_id = $1
  ORDER BY cpl.completed_at DESC
)
UNION ALL
(
  SELECT 
    'quiz_passed' as type,
    'Passed ' || q.title || ' Quiz' as title,
    qp.passed_at as timestamp,
    q.course_id,
    q.id
  FROM quiz_progress qp
  JOIN quizzes q ON qp.quiz_id = q.id
  WHERE qp.user_id = $1 AND qp.is_passed = true
  ORDER BY qp.passed_at DESC
)
ORDER BY timestamp DESC
LIMIT $2;
```

### 5. **Get Dashboard Analytics**

**Endpoint:** `GET /api/student/:userId/analytics`

**Response:**
```json
{
  "weekly_activity": [
    { "day": "Mon", "hours": 2.5 },
    { "day": "Tue", "hours": 3.2 },
    { "day": "Wed", "hours": 1.8 },
    { "day": "Thu", "hours": 4.1 },
    { "day": "Fri", "hours": 3.7 },
    { "day": "Sat", "hours": 2.3 },
    { "day": "Sun", "hours": 1.9 }
  ],
  "lessons_status": {
    "completed": 35,
    "in_progress": 12,
    "not_started": 8
  },
  "quiz_performance": {
    "passed": 6,
    "failed": 2,
    "pass_rate": 75
  },
  "strongest_subject": {
    "name": "Physics",
    "score": 88
  },
  "weakest_subject": {
    "name": "Biology",
    "score": 65
  }
}
```

## Step 3: Environment Variables

Add to your `.env` file in the frontend:

```
VITE_API_BASE_URL=http://localhost:5000
```

## Step 4: Update Dashboard Data Fetching

The dashboard automatically fetches data from the API using the `dashboardService.js`. You just need to ensure:

1. **User is logged in** - Token and userId are in localStorage
2. **Backend endpoints are available** at the specified URLs
3. **CORS is configured** on the backend to allow requests from your frontend

## Step 5: Test the Integration

### Test 1: Check API Connectivity
```javascript
// In browser console:
const token = localStorage.getItem('token')
const userId = localStorage.getItem('userId')

fetch(`http://localhost:5000/api/student-course-progress/${userId}`, {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log)
```

### Test 2: Navigate to Dashboard
```
http://localhost:5173/student/dashboard
```

## Complete Backend Example (Express.js)

```javascript
// routes/studentDashboard.js
import express from 'express'
import { pool } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Get course progress summary
router.get('/student-course-progress/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as enrolled_count,
        SUM(lessons_total) as total_lessons,
        SUM(lessons_completed) as completed_lessons,
        SUM(quizzes_total) as total_quizzes,
        SUM(quizzes_passed) as passed_quizzes,
        ROUND(AVG(completion_percent), 2) as avg_completion
      FROM course_progress
      WHERE user_id = $1
    `, [userId])
    
    const data = result.rows[0]
    
    res.json({
      id: userId,
      user_id: userId,
      enrolled_courses_count: parseInt(data.enrolled_count),
      lessons_total: data.total_lessons || 0,
      lessons_completed: data.completed_lessons || 0,
      quizzes_total: data.total_quizzes || 0,
      quizzes_passed: data.passed_quizzes || 0,
      completion_percent: parseInt(data.avg_completion) || 0
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to fetch progress' })
  }
})

// Get all courses for student
router.get('/student/:userId/courses', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    const limit = req.query.limit || 10
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.instructor,
        cp.completion_percent as progress,
        cp.lessons_completed,
        cp.lessons_total,
        cp.quizzes_passed,
        cp.quizzes_total,
        cp.status,
        cp.enrolled_at,
        cp.completed_at
      FROM course_progress cp
      JOIN courses c ON cp.course_id = c.id
      WHERE cp.user_id = $1
      ORDER BY cp.last_watched_at DESC
      LIMIT $2
    `, [userId, limit])
    
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
})

export default router
```

## Troubleshooting

### Dashboard shows "User not authenticated"
- Check localStorage has `token` and `userId`
- Verify token is valid
- Check browser console for errors

### Data not loading
- Check API endpoints in browser Network tab
- Verify CORS headers on backend
- Ensure backend is running on port 5000

### Styling issues
- Verify Tailwind CSS is configured
- Check if `tailwind.config.js` exists in project root
- Clear browser cache and rebuild

## Next Steps

1. ✅ Implement all required API endpoints
2. ✅ Test dashboard connectivity
3. ✅ Style and customize dashboard
4. ✅ Add real data integration
5. ✅ Deploy to production

For questions or issues, refer to the main STUDENT_DASHBOARD_GUIDE.md
