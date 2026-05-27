# Integration Guide: In-Video Quiz Overlay

## Overview

This guide shows how to integrate the In-Video Quiz Overlay system into your existing course video player component.

## Step 1: Add Route

Update `src/App.jsx`:

```jsx
import InVideoQuizPage from './pages/InVideoQuizPage'

// Add this route to your Routes
<Route
  path="/student/quizzes/demo"
  element={
    <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['student']}>
      <InVideoQuizPage />
    </RoleOnlyRoute>
  }
/>
```

## Step 2: Integrate with CourseDetail Component

Update `src/pages/CourseDetail.jsx`:

```jsx
import { useState, useRef, useEffect } from 'react'
import { InVideoQuizOverlay } from '@/components/InVideoQuiz'

export default function CourseDetail() {
  const videoRef = useRef(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [completedQuestions, setCompletedQuestions] = useState([])
  const [quizzes, setQuizzes] = useState([])

  // Fetch video and quiz data
  useEffect(() => {
    const fetchCourseData = async () => {
      // Fetch from your API
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      
      // Set quizzes data
      setQuizzes(data.quizzes || [])
    }

    fetchCourseData()
  }, [courseId])

  // Auto-trigger quiz at timestamps
  useEffect(() => {
    if (!videoRef.current || quizzes.length === 0) return

    const handleTimeUpdate = () => {
      const currentTime = videoRef.current.currentTime

      // Find quiz at current timestamp
      const currentQuiz = quizzes.find(
        (q) =>
          currentTime >= q.timestamp &&
          currentTime < q.timestamp + 2 &&
          !completedQuestions.includes(q.id)
      )

      if (currentQuiz && !isQuizOpen) {
        setIsQuizOpen(true)
        const questionIndex = quizzes.findIndex((q) => q.id === currentQuiz.id)
        setCurrentQuestion(questionIndex + 1)
      }
    }

    const videoElement = videoRef.current
    videoElement.addEventListener('timeupdate', handleTimeUpdate)

    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate)
  }, [isQuizOpen, completedQuestions, quizzes])

  const handleQuizSubmit = async (result) => {
    // Save quiz response to backend
    try {
      await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: result.questionId,
          courseId: courseId,
          selectedOption: result.selectedOption,
          isCorrect: result.isCorrect,
          videoTimestamp: videoRef.current.currentTime,
          userId: currentUser.id,
        }),
      })
    } catch (error) {
      console.error('Failed to save quiz response:', error)
    }

    // Update UI
    setCompletedQuestions([...completedQuestions, result.questionId])
    setIsQuizOpen(false)
  }

  const handleQuizSkip = () => {
    setIsQuizOpen(false)
  }

  const currentQuiz = quizzes[currentQuestion - 1]

  return (
    <div className="space-y-6">
      {/* Video Player Container */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-auto"
          controls
          controlsList="nodownload"
        >
          <source src={courseData.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* In-Video Quiz Overlay */}
        {currentQuiz && (
          <InVideoQuizOverlay
            isOpen={isQuizOpen}
            quiz={currentQuiz}
            onSubmit={handleQuizSubmit}
            onSkip={handleQuizSkip}
            videoRef={videoRef}
            currentQuestion={currentQuestion}
            totalQuestions={quizzes.length}
          />
        )}
      </div>

      {/* Course Content Below */}
      {/* ... rest of your course detail content ... */}
    </div>
  )
}
```

## Step 3: Backend API Endpoints

Add these endpoints to your backend:

### Get Video Quizzes

```
GET /api/courses/{courseId}/video-quizzes
GET /api/modules/{moduleId}/video-quizzes
```

Response:

```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": "quiz-1",
        "timestamp": 30,
        "type": "multiple-choice",
        "difficulty": "medium",
        "question": "What is...?",
        "options": [
          {
            "text": "Option A",
            "isCorrect": true,
            "explanation": "Because..."
          }
        ]
      }
    ]
  }
}
```

### Submit Quiz Answer

```
POST /api/quiz-attempts
```

Request:

```json
{
  "quizId": "quiz-1",
  "courseId": "course-1",
  "moduleId": "module-1",
  "selectedOption": 0,
  "isCorrect": true,
  "videoTimestamp": 30,
  "userId": "user-1",
  "timeSpent": 15000
}
```

### Get User Quiz Progress

```
GET /api/users/{userId}/quiz-progress?courseId={courseId}
```

Response:

```json
{
  "success": true,
  "data": {
    "completed": ["quiz-1", "quiz-2"],
    "stats": {
      "correctAnswers": 8,
      "totalAnswers": 10,
      "accuracy": 80
    }
  }
}
```

## Step 4: Database Schema

### quiz_templates table

```sql
CREATE TABLE quiz_templates (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  course_id UUID REFERENCES courses(id),
  video_timestamp INTEGER,
  type VARCHAR(50),
  difficulty VARCHAR(20),
  question TEXT,
  explanation TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### quiz_options table

```sql
CREATE TABLE quiz_options (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quiz_templates(id),
  text TEXT,
  is_correct BOOLEAN,
  explanation TEXT,
  sort_order INTEGER
);
```

### quiz_attempts table

```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quiz_templates(id),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  selected_option_id UUID REFERENCES quiz_options(id),
  is_correct BOOLEAN,
  video_timestamp DECIMAL,
  time_spent_ms INTEGER,
  attempted_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## Step 5: Example Backend Implementation (Node.js/Express)

```javascript
// Get quizzes for a module
router.get('/modules/:moduleId/video-quizzes', async (req, res) => {
  try {
    const { moduleId } = req.params

    const quizzes = await db.query(
      `SELECT q.* FROM quiz_templates q
       WHERE q.module_id = $1
       ORDER BY q.video_timestamp ASC`,
      [moduleId]
    )

    // Get options for each quiz
    const quizzesWithOptions = await Promise.all(
      quizzes.rows.map(async (quiz) => {
        const options = await db.query(
          `SELECT * FROM quiz_options WHERE quiz_id = $1 ORDER BY sort_order ASC`,
          [quiz.id]
        )
        return { ...quiz, options: options.rows }
      })
    )

    res.json({ success: true, data: { quizzes: quizzesWithOptions } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Submit quiz attempt
router.post('/quiz-attempts', async (req, res) => {
  try {
    const { quizId, userId, selectedOption, isCorrect, videoTimestamp, timeSpent } = req.body

    const result = await db.query(
      `INSERT INTO quiz_attempts 
       (quiz_id, user_id, selected_option_id, is_correct, video_timestamp, time_spent_ms, attempted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [quizId, userId, selectedOption, isCorrect, videoTimestamp, timeSpent]
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user quiz progress
router.get('/users/:userId/quiz-progress', async (req, res) => {
  try {
    const { userId } = req.params
    const { courseId } = req.query

    const attempts = await db.query(
      `SELECT * FROM quiz_attempts
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    )

    const completed = [...new Set(attempts.rows.map(a => a.quiz_id))]
    const correctAnswers = attempts.rows.filter(a => a.is_correct).length
    const accuracy = (correctAnswers / attempts.rows.length) * 100

    res.json({
      success: true,
      data: {
        completed,
        stats: {
          correctAnswers,
          totalAnswers: attempts.rows.length,
          accuracy,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

## Step 6: Update StudentDashboard to Show Quiz Stats

Edit `src/components/StudentDashboard/ProgressTable.jsx`:

```jsx
import { useEffect, useState } from 'react'

export default function ProgressTable() {
  const [quizStats, setQuizStats] = useState({})

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/users/me/quiz-progress')
      const data = await response.json()
      setQuizStats(data.data.stats)
    }

    fetchStats()
  }, [])

  return (
    // ... your existing content ...
    <div className="text-right">
      <div className="text-sm text-slate-600">
        Quizzes: {quizStats.correctAnswers}/{quizStats.totalAnswers} ({Math.round(quizStats.accuracy)}%)
      </div>
    </div>
  )
}
```

## Step 7: Testing

Test the integration:

1. **Basic Flow**: Play video, trigger quiz at timestamp
2. **Submit Answer**: Answer question, check for correct feedback
3. **Skip Quiz**: Skip quiz without answering
4. **Auto Resume**: Video resumes after quiz completion
5. **Progress Tracking**: Check quiz progress is saved

## Step 8: Optional - Analytics

Track user interactions:

```javascript
// Track quiz impression
analytics.track('quiz_impressed', {
  quizId: quiz.id,
  courseId: courseId,
  timestamp: videoRef.current.currentTime,
})

// Track quiz submission
analytics.track('quiz_submitted', {
  quizId: quiz.id,
  isCorrect: result.isCorrect,
  timeToComplete: Date.now() - quizStartTime,
})

// Track quiz skipped
analytics.track('quiz_skipped', {
  quizId: quiz.id,
  videoTimestamp: videoRef.current.currentTime,
})
```

## Troubleshooting

### Quiz data not loading
- Check API endpoint is returning correct format
- Verify courseId/moduleId is being passed correctly
- Check browser network tab for API errors

### Video doesn't pause
- Ensure videoRef is connected to video element
- Check videoRef.current is not null when quiz triggers
- Verify CORS allows video control

### Quiz not appearing
- Check quiz timestamp matches video progress
- Verify quiz is not already in completedQuestions
- Open console and log time values

---

## Next Steps

1. Integrate with your course player
2. Create admin panel to add/edit quizzes
3. Add video analytics dashboard
4. Implement leaderboard for quiz performance
5. Add certificates for course completion

---

For more details, see:
- [IN_VIDEO_QUIZ_GUIDE.md](../IN_VIDEO_QUIZ_GUIDE.md)
- [IN_VIDEO_QUIZ_API.md](../IN_VIDEO_QUIZ_API.md)
