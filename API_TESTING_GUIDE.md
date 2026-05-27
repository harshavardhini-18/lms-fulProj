# API Testing Guide - Complete Details

## Base URL
```
http://localhost:5000/api
```

## Authentication Header (Required for ALL endpoints)
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

Get JWT token from login:
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "student@example.com",
  "password": "password123"
}
```

---

# COURSE PROGRESS API TESTS

## 1️⃣ CREATE COURSE PROGRESS

### Test 1.1: Create Single Course Progress
```
HTTP Method: POST
URL: http://localhost:5000/api/course-progress

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "courseId": "607f1f77bcf86cd799439011",
  "progressData": {
    "enrollmentStatus": "enrolled",
    "completionPercent": 0
  }
}

Expected Response (201):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5e6f",
    "user": "user_id_here",
    "course": "607f1f77bcf86cd799439011",
    "enrollmentStatus": "enrolled",
    "completionPercent": 0,
    "lastWatchedTime": 0,
    "lessonProgress": [],
    "completedLessonIds": [],
    "enrolledAt": "2024-05-25T10:30:00.000Z",
    "createdAt": "2024-05-25T10:30:00.000Z",
    "updatedAt": "2024-05-25T10:30:00.000Z"
  }
}
```

### Test 1.2: Bulk Create Course Progress (Instructor)
```
HTTP Method: POST
URL: http://localhost:5000/api/course-progress/bulk

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)
- Content-Type: application/json

Body:
{
  "courseId": "607f1f77bcf86cd799439011",
  "userIds": [
    "607f1f77bcf86cd799439001",
    "607f1f77bcf86cd799439002",
    "607f1f77bcf86cd799439003"
  ]
}

Expected Response (201):
{
  "success": true,
  "data": {
    "createdCount": 3,
    "records": [
      { /* CourseProgress object 1 */ },
      { /* CourseProgress object 2 */ },
      { /* CourseProgress object 3 */ }
    ]
  }
}
```

---

## 2️⃣ READ COURSE PROGRESS

### Test 2.1: Get My Course Progress (Specific Course)
```
HTTP Method: GET
URL: http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body: (empty - GET request)

Expected Response (200):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5e6f",
    "user": {
      "_id": "user_id",
      "name": "John Student",
      "email": "john@example.com"
    },
    "course": {
      "_id": "607f1f77bcf86cd799439011",
      "title": "Web Development"
    },
    "enrollmentStatus": "enrolled",
    "completionPercent": 45,
    "currentLesson": "lesson_id",
    "lastWatchedTime": 3600,
    "enrolledAt": "2024-05-25T10:00:00Z",
    "completedAt": null
  }
}
```

### Test 2.2: Get All My Courses
```
HTTP Method: GET
URL: http://localhost:5000/api/course-progress?limit=10&skip=0

Query Parameters (Optional):
- limit: 10 (default)
- skip: 0 (default)
- enrollmentStatus: enrolled|completed|dropped

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "data": [
      { /* CourseProgress object 1 */ },
      { /* CourseProgress object 2 */ }
    ],
    "total": 5,
    "limit": 10,
    "skip": 0,
    "pages": 1
  }
}
```

### Test 2.3: Get Progress by ID
```
HTTP Method: GET
URL: http://localhost:5000/api/course-progress/id/665d4c3e8f9d1a2b3c4d5e6f

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": { /* Full CourseProgress object */ }
}
```

### Test 2.4: Get Course-Level Progress (Instructor)
```
HTTP Method: GET
URL: http://localhost:5000/api/course-progress/course/607f1f77bcf86cd799439011/all?limit=20&skip=0

Query Parameters (Optional):
- limit: 20
- skip: 0
- enrollmentStatus: enrolled|completed|dropped

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "progress1",
        "user": { "name": "Student 1", "email": "student1@example.com" },
        "completionPercent": 75,
        "enrollmentStatus": "enrolled"
      },
      {
        "_id": "progress2",
        "user": { "name": "Student 2", "email": "student2@example.com" },
        "completionPercent": 50,
        "enrollmentStatus": "enrolled"
      }
    ],
    "total": 50,
    "limit": 20,
    "skip": 0,
    "pages": 3
  }
}
```

### Test 2.5: Get Course Statistics (Instructor)
```
HTTP Method: GET
URL: http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/stats

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "totalEnrolled": 50,
    "totalCompleted": 35,
    "totalDropped": 5,
    "avgCompletion": 72.5,
    "maxCompletion": 100,
    "minCompletion": 10
  }
}
```

---

## 3️⃣ UPDATE COURSE PROGRESS

### Test 3.1: Update Progress by ID
```
HTTP Method: PATCH
URL: http://localhost:5000/api/course-progress/665d4c3e8f9d1a2b3c4d5e6f

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "currentLesson": "lesson123",
  "lastWatchedTime": 5400,
  "completionPercent": 60
}

Expected Response (200):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5e6f",
    "user": "user_id",
    "course": "607f1f77bcf86cd799439011",
    "completionPercent": 60,
    "lastWatchedTime": 5400,
    "currentLesson": "lesson123"
  }
}
```

### Test 3.2: Update My Course Progress
```
HTTP Method: PATCH
URL: http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/user

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "currentModule": "module456",
  "currentLesson": "lesson789",
  "lastWatchedTime": 3600,
  "completionPercent": 45
}

Expected Response (200):
{
  "success": true,
  "data": { /* Updated CourseProgress */ }
}
```

### Test 3.3: Mark Course as Completed
```
HTTP Method: PATCH
URL: http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/complete

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body: {}

Expected Response (200):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5e6f",
    "enrollmentStatus": "completed",
    "completionPercent": 100,
    "completedAt": "2024-05-25T11:30:00Z"
  }
}
```

### Test 3.4: Update Lesson Progress
```
HTTP Method: PATCH
URL: http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/lesson/lesson789

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "lesson": "lesson789",
  "module": "module456",
  "lastWatchedTime": 2000,
  "isCompleted": true,
  "completedAt": "2024-05-25T11:00:00Z"
}

Expected Response (200):
{
  "success": true,
  "data": {
    "lessonProgress": [
      {
        "lesson": "lesson789",
        "module": "module456",
        "lastWatchedTime": 2000,
        "isCompleted": true,
        "completedAt": "2024-05-25T11:00:00Z"
      }
    ]
  }
}
```

### Test 3.5: Bulk Update Completion (Instructor)
```
HTTP Method: PATCH
URL: http://localhost:5000/api/course-progress/bulk/completion

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)
- Content-Type: application/json

Body:
{
  "courseId": "607f1f77bcf86cd799439011",
  "updates": [
    { "userId": "user1", "completionPercent": 50 },
    { "userId": "user2", "completionPercent": 75 },
    { "userId": "user3", "completionPercent": 100 }
  ]
}

Expected Response (200):
{
  "success": true,
  "data": {
    "modifiedCount": 3,
    "matchedCount": 3
  }
}
```

### Test 3.6: Reset Course Progress
```
HTTP Method: PATCH
URL: http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/reset

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body: {}

Expected Response (200):
{
  "success": true,
  "message": "Course progress reset successfully",
  "data": {
    "enrollmentStatus": "enrolled",
    "completionPercent": 0,
    "currentModule": null,
    "currentLesson": null,
    "lastWatchedTime": 0,
    "lessonProgress": [],
    "completedLessonIds": []
  }
}
```

---

## 4️⃣ DELETE COURSE PROGRESS

### Test 4.1: Delete by Progress ID
```
HTTP Method: DELETE
URL: http://localhost:5000/api/course-progress/665d4c3e8f9d1a2b3c4d5e6f

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "message": "Course progress deleted successfully",
  "data": { /* Deleted CourseProgress object */ }
}
```

### Test 4.2: Delete My Course Progress
```
HTTP Method: DELETE
URL: http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/user

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "message": "Course progress deleted successfully",
  "data": { /* Deleted CourseProgress object */ }
}
```

---

---

# QUIZ PROGRESS API TESTS

## 1️⃣ CREATE QUIZ PROGRESS

### Test 1.1: Create Single Quiz Progress
```
HTTP Method: POST
URL: http://localhost:5000/api/quiz-progress

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "courseId": "607f1f77bcf86cd799439011",
  "quizId": "607f1f77bcf86cd799439020",
  "progressData": {
    "enrollmentStatus": "not_started"
  }
}

Expected Response (201):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5f7a",
    "user": "user_id",
    "course": "607f1f77bcf86cd799439011",
    "quiz": "607f1f77bcf86cd799439020",
    "enrollmentStatus": "not_started",
    "totalAttempts": 0,
    "attemptsPassed": 0,
    "attemptsFailed": 0,
    "bestScore": 0,
    "latestScore": 0,
    "isPassed": false,
    "passingScorePercent": 70,
    "isActive": true,
    "createdAt": "2024-05-25T10:30:00Z"
  }
}
```

### Test 1.2: Bulk Create Quiz Progress (Instructor)
```
HTTP Method: POST
URL: http://localhost:5000/api/quiz-progress/bulk

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)
- Content-Type: application/json

Body:
{
  "courseId": "607f1f77bcf86cd799439011",
  "quizId": "607f1f77bcf86cd799439020",
  "userIds": [
    "user1_id",
    "user2_id",
    "user3_id"
  ]
}

Expected Response (201):
{
  "success": true,
  "data": {
    "createdCount": 3,
    "records": [
      { /* QuizProgress object 1 */ },
      { /* QuizProgress object 2 */ },
      { /* QuizProgress object 3 */ }
    ]
  }
}
```

---

## 2️⃣ READ QUIZ PROGRESS

### Test 2.1: Get My Quiz Progress
```
HTTP Method: GET
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5f7a",
    "user": { "name": "John Student", "email": "john@example.com" },
    "quiz": { "title": "JavaScript Basics", "passingScorePercent": 70 },
    "course": { "title": "Web Development" },
    "enrollmentStatus": "not_started",
    "totalAttempts": 0,
    "bestScore": 0,
    "isPassed": false
  }
}
```

### Test 2.2: Get All My Quizzes
```
HTTP Method: GET
URL: http://localhost:5000/api/quiz-progress?limit=10&skip=0

Query Parameters (Optional):
- limit: 10
- skip: 0
- courseId: course_id
- enrollmentStatus: not_started|in_progress|passed|failed
- isPassed: true|false

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "data": [
      { /* QuizProgress object 1 */ },
      { /* QuizProgress object 2 */ }
    ],
    "total": 15,
    "limit": 10,
    "skip": 0,
    "pages": 2
  }
}
```

### Test 2.3: Get Quizzes Passed (Filtered)
```
HTTP Method: GET
URL: http://localhost:5000/api/quiz-progress?isPassed=true&limit=10

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "data": [ /* Only passed quizzes */ ],
    "total": 5,
    "limit": 10,
    "skip": 0,
    "pages": 1
  }
}
```

### Test 2.4: Get Quiz-Level Progress (Instructor)
```
HTTP Method: GET
URL: http://localhost:5000/api/quiz-progress/quiz/607f1f77bcf86cd799439020/all?limit=20

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "progress1",
        "user": { "name": "Student 1", "email": "student1@example.com" },
        "bestScore": 85,
        "isPassed": true
      },
      {
        "_id": "progress2",
        "user": { "name": "Student 2", "email": "student2@example.com" },
        "bestScore": 65,
        "isPassed": false
      }
    ],
    "total": 100,
    "limit": 20,
    "skip": 0,
    "pages": 5
  }
}
```

### Test 2.5: Get Quiz Performance Statistics (Instructor)
```
HTTP Method: GET
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/stats

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "totalAttempts": 250,
    "totalStudents": 100,
    "studentsPassed": 75,
    "studentsFailed": 25,
    "avgBestScore": 78.5,
    "avgLatestScore": 76.3,
    "maxScore": 100,
    "minScore": 20,
    "passPercentage": "75.00"
  }
}
```

### Test 2.6: Get All Course Quizzes (Instructor)
```
HTTP Method: GET
URL: http://localhost:5000/api/quiz-progress/course/607f1f77bcf86cd799439011/all?limit=20

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Instructor token)

Body: (empty)

Expected Response (200):
{
  "success": true,
  "data": {
    "data": [
      /* All quiz progress for the course */
    ],
    "total": 200,
    "limit": 20,
    "skip": 0,
    "pages": 10
  }
}
```

---

## 3️⃣ UPDATE QUIZ PROGRESS

### Test 3.1: Update Quiz Progress by ID
```
HTTP Method: PATCH
URL: http://localhost:5000/api/quiz-progress/665d4c3e8f9d1a2b3c4d5f7a

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "enrollmentStatus": "in_progress",
  "notes": "Working on this quiz"
}

Expected Response (200):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5f7a",
    "enrollmentStatus": "in_progress",
    "notes": "Working on this quiz"
  }
}
```

### Test 3.2: Update My Quiz Progress
```
HTTP Method: PATCH
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/user

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "enrollmentStatus": "in_progress",
  "totalAttempts": 1
}

Expected Response (200):
{
  "success": true,
  "data": { /* Updated QuizProgress */ }
}
```

### Test 3.3: Update Quiz Progress with Attempt ⭐ MOST IMPORTANT
```
HTTP Method: PATCH
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "score": 85,
  "totalPoints": 100,
  "duration": 1200,
  "attemptId": "attempt_id_123",
  "answers": [
    { "questionId": "q1", "answer": "A", "isCorrect": true },
    { "questionId": "q2", "answer": "B", "isCorrect": true },
    { "questionId": "q3", "answer": "C", "isCorrect": false }
  ]
}

Expected Response (200):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5f7a",
    "totalAttempts": 1,
    "attemptsPassed": 1,
    "attemptsFailed": 0,
    "bestScore": 85,
    "latestScore": 85,
    "isPassed": true,
    "enrollmentStatus": "passed",
    "lastAttemptAt": "2024-05-25T11:30:00Z",
    "lastAttemptDuration": 1200,
    "totalTimeSpent": 1200,
    "passedAt": "2024-05-25T11:30:00Z"
  }
}
```

### Test 3.4: Retry Quiz (Failed First Attempt)
```
HTTP Method: PATCH
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "score": 92,
  "totalPoints": 100,
  "duration": 900,
  "attemptId": "attempt_id_124",
  "answers": [...]
}

Expected Response (200):
{
  "success": true,
  "data": {
    "totalAttempts": 2,          // Incremented from 1
    "attemptsPassed": 2,         // Incremented
    "attemptsFailed": 0,         // Stays 0 (only failed attempts increment this)
    "bestScore": 92,             // Updated (92 > 85)
    "latestScore": 92,           // Latest is 92
    "isPassed": true,
    "enrollmentStatus": "passed",
    "lastAttemptAt": "2024-05-25T12:00:00Z"
  }
}
```

### Test 3.5: Failed Quiz Attempt
```
HTTP Method: PATCH
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body:
{
  "score": 55,
  "totalPoints": 100,
  "duration": 600,
  "attemptId": "attempt_id_125",
  "answers": [...]
}

Expected Response (200):
{
  "success": true,
  "data": {
    "totalAttempts": 3,
    "attemptsPassed": 2,
    "attemptsFailed": 1,         // Incremented (55 < 70 passing score)
    "bestScore": 92,             // Unchanged (best stays 92)
    "latestScore": 55,           // Updated to latest
    "isPassed": false,           // Changed to false
    "enrollmentStatus": "failed"  // Changed to failed
  }
}
```

### Test 3.6: Mark Quiz as Passed
```
HTTP Method: PATCH
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/pass

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body: {}

Expected Response (200):
{
  "success": true,
  "data": {
    "isPassed": true,
    "enrollmentStatus": "passed",
    "passedAt": "2024-05-25T11:45:00Z"
  }
}
```

### Test 3.7: Reset Quiz Progress
```
HTTP Method: PATCH
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/reset

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Body: {}

Expected Response (200):
{
  "success": true,
  "message": "Quiz progress reset successfully",
  "data": {
    "enrollmentStatus": "not_started",
    "totalAttempts": 0,
    "attemptsPassed": 0,
    "attemptsFailed": 0,
    "bestScore": 0,
    "latestScore": 0,
    "isPassed": false,
    "totalTimeSpent": 0,
    "firstAttemptAt": null,
    "lastAttemptAt": null,
    "passedAt": null
  }
}
```

---

## 4️⃣ DELETE QUIZ PROGRESS

### Test 4.1: Delete by Progress ID
```
HTTP Method: DELETE
URL: http://localhost:5000/api/quiz-progress/665d4c3e8f9d1a2b3c4d5f7a

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "message": "Quiz progress deleted successfully",
  "data": { /* Deleted QuizProgress object */ }
}
```

### Test 4.2: Delete My Quiz Progress
```
HTTP Method: DELETE
URL: http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/user

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body: (empty)

Expected Response (200):
{
  "success": true,
  "message": "Quiz progress deleted successfully",
  "data": { /* Deleted QuizProgress object */ }
}
```

---

# CURL COMMANDS - Copy & Paste Ready

## 1. Login to Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'

# Save the token from response: response.data.token
```

## 2. Create Course Progress
```bash
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "607f1f77bcf86cd799439011",
    "progressData": {
      "enrollmentStatus": "enrolled",
      "completionPercent": 0
    }
  }'
```

## 3. Get My Courses
```bash
curl -X GET http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 4. Update Progress
```bash
curl -X PATCH http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "completionPercent": 50,
    "lastWatchedTime": 3600
  }'
```

## 5. Create Quiz Progress
```bash
curl -X POST http://localhost:5000/api/quiz-progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "607f1f77bcf86cd799439011",
    "quizId": "607f1f77bcf86cd799439020"
  }'
```

## 6. Submit Quiz Attempt (MOST IMPORTANT)
```bash
curl -X PATCH http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "totalPoints": 100,
    "duration": 1200,
    "attemptId": "attempt_id_123",
    "answers": [
      { "questionId": "q1", "answer": "A", "isCorrect": true },
      { "questionId": "q2", "answer": "B", "isCorrect": false }
    ]
  }'
```

## 7. Get Quiz Stats (Instructor)
```bash
curl -X GET http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/stats \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN_HERE"
```

## 8. Get All Students in Course (Instructor)
```bash
curl -X GET "http://localhost:5000/api/course-progress/course/607f1f77bcf86cd799439011/all?limit=20&skip=0" \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN_HERE"
```

## 9. Mark Course as Completed
```bash
curl -X PATCH http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/complete \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 10. Reset Progress
```bash
curl -X PATCH http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/reset \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

# POSTMAN/THUNDER CLIENT - Collection Template

## Setup Environment Variables
```json
{
  "token": "your_jwt_token_here",
  "base_url": "http://localhost:5000/api",
  "course_id": "607f1f77bcf86cd799439011",
  "quiz_id": "607f1f77bcf86cd799439020",
  "user_id": "607f1f77bcf86cd799439001",
  "progress_id": "665d4c3e8f9d1a2b3c4d5e6f"
}
```

## Collection Folder Structure
```
Course Progress
├── Create
│   ├── Create Single
│   └── Create Bulk
├── Read
│   ├── Get My Progress
│   ├── Get All My Courses
│   ├── Get by ID
│   ├── Get Course-Level (Instructor)
│   └── Get Statistics (Instructor)
├── Update
│   ├── Update by ID
│   ├── Update My Progress
│   ├── Mark Complete
│   ├── Update Lesson
│   ├── Bulk Update
│   └── Reset
└── Delete
    ├── Delete by ID
    └── Delete My Progress

Quiz Progress
├── Create
│   ├── Create Single
│   └── Create Bulk
├── Read
│   ├── Get My Quiz
│   ├── Get All My Quizzes
│   ├── Filter by Passed
│   ├── Get Quiz-Level (Instructor)
│   ├── Get Statistics (Instructor)
│   └── Get Course Quizzes (Instructor)
├── Update
│   ├── Update by ID
│   ├── Update My Quiz
│   ├── Submit Attempt ⭐
│   ├── Retry Quiz ⭐
│   ├── Failed Attempt ⭐
│   ├── Mark Passed
│   └── Reset
└── Delete
    ├── Delete by ID
    └── Delete My Quiz
```

---

# ERROR RESPONSES - What to Expect

## 400 Bad Request
```json
{
  "success": false,
  "message": "Course ID is required"
}
```

## 401 Unauthorized
```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

## 404 Not Found
```json
{
  "success": false,
  "message": "Course progress not found"
}
```

## 409 Conflict
```json
{
  "success": false,
  "message": "Course progress already exists for this user"
}
```

## 500 Server Error
```json
{
  "success": false,
  "message": "Database connection error"
}
```

---

# COMPLETE WORKFLOW EXAMPLE

## Student Complete Learning Journey

### Step 1: Login
```bash
POST http://localhost:5000/api/auth/login
Body: { "email": "student@example.com", "password": "pass123" }
Response: { "data": { "token": "eyJhbGci..." } }
```

### Step 2: Enroll in Course
```bash
POST http://localhost:5000/api/course-progress
Authorization: Bearer eyJhbGci...
Body: { "courseId": "607f1f77bcf86cd799439011" }
Response: { "data": { "_id": "progress_id", "completionPercent": 0 } }
```

### Step 3: Start Watching Video 1
```bash
PATCH http://localhost:5000/api/course-progress/course_id/user
Body: { "currentLesson": "lesson1", "lastWatchedTime": 600, "completionPercent": 10 }
```

### Step 4: Continue with Video 2
```bash
PATCH http://localhost:5000/api/course-progress/course_id/user
Body: { "currentLesson": "lesson2", "lastWatchedTime": 1200, "completionPercent": 25 }
```

### Step 5: Take Quiz
```bash
POST http://localhost:5000/api/quiz-progress
Body: { "courseId": "607f1f77bcf86cd799439011", "quizId": "quiz_id" }
Response: { "data": { "_id": "quiz_progress_id", "totalAttempts": 0, "isPassed": false } }
```

### Step 6: Submit Quiz (First Attempt - 60%, Failed)
```bash
PATCH http://localhost:5000/api/quiz-progress/quiz_id/attempt
Body: { "score": 60, "totalPoints": 100, "duration": 1200, "attemptId": "attempt1" }
Response: {
  "totalAttempts": 1,
  "attemptsFailed": 1,
  "bestScore": 60,
  "latestScore": 60,
  "isPassed": false,
  "enrollmentStatus": "failed"
}
```

### Step 7: Study and Retry (Second Attempt - 85%, Passed)
```bash
PATCH http://localhost:5000/api/quiz-progress/quiz_id/attempt
Body: { "score": 85, "totalPoints": 100, "duration": 900, "attemptId": "attempt2" }
Response: {
  "totalAttempts": 2,
  "attemptsPassed": 1,
  "attemptsFailed": 1,
  "bestScore": 85,           // Updated (85 > 60)
  "latestScore": 85,
  "isPassed": true,
  "enrollmentStatus": "passed",
  "passedAt": "2024-05-25T12:30:00Z"
}
```

### Step 8: Complete Course
```bash
PATCH http://localhost:5000/api/course-progress/course_id/complete
Response: { "enrollmentStatus": "completed", "completionPercent": 100 }
```

### Step 9: Check Final Progress
```bash
GET http://localhost:5000/api/course-progress/course_id
Response: {
  "enrollmentStatus": "completed",
  "completionPercent": 100,
  "completedAt": "2024-05-25T12:45:00Z"
}

GET http://localhost:5000/api/quiz-progress/quiz_id
Response: {
  "totalAttempts": 2,
  "bestScore": 85,
  "isPassed": true
}
```

---

# TESTING CHECKLIST

## Course Progress Tests
- [ ] Create course progress
- [ ] Bulk create course progress
- [ ] Get my course progress
- [ ] Get all my courses
- [ ] Get progress by ID
- [ ] Get course-level (instructor)
- [ ] Get course stats (instructor)
- [ ] Update progress
- [ ] Update my course
- [ ] Mark as completed
- [ ] Update lesson
- [ ] Bulk update completion
- [ ] Reset progress
- [ ] Delete progress

## Quiz Progress Tests
- [ ] Create quiz progress
- [ ] Bulk create quiz progress
- [ ] Get my quiz progress
- [ ] Get all my quizzes
- [ ] Get quiz by ID
- [ ] Filter by passed/failed
- [ ] Get quiz-level (instructor)
- [ ] Get quiz stats (instructor)
- [ ] Get course quizzes
- [ ] Update quiz progress
- [ ] Submit attempt (passed)
- [ ] Submit attempt (failed)
- [ ] Retry quiz
- [ ] Mark passed
- [ ] Reset quiz
- [ ] Delete quiz

---

# IMPORTANT NOTES

1. **Always include Authorization header** with Bearer token
2. **Content-Type must be application/json** for all POST/PATCH
3. **Course/Quiz IDs must be valid MongoDB ObjectIds** or will get 404
4. **Token expires** - Re-login if you get 401 error
5. **Most important endpoint**: `/attempt` for quiz submission (auto-calculates everything)
6. **Query parameters** are optional - use for filtering
7. **Instructor endpoints** require instructor role - will get 403 if student tries
8. **Empty body `{}` for DELETE and reset endpoints**
