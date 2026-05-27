# Quick Copy-Paste Testing Reference

## Setup First

### Step 1: Get Your JWT Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

**Copy the token from response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

Replace `YOUR_TOKEN` in commands below with this token.

---

## Quick Test Commands - Copy & Paste

### 1️⃣ CREATE COURSE PROGRESS
```bash
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "607f1f77bcf86cd799439011",
    "progressData": {
      "enrollmentStatus": "enrolled"
    }
  }'
```

---

### 2️⃣ GET MY COURSE PROGRESS
```bash
curl -X GET http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3️⃣ UPDATE MY COURSE PROGRESS (Track Learning)
```bash
curl -X PATCH http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentLesson": "lesson123",
    "lastWatchedTime": 3600,
    "completionPercent": 50
  }'
```

---

### 4️⃣ MARK COURSE COMPLETED
```bash
curl -X PATCH http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 5️⃣ CREATE QUIZ PROGRESS
```bash
curl -X POST http://localhost:5000/api/quiz-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "607f1f77bcf86cd799439011",
    "quizId": "607f1f77bcf86cd799439020"
  }'
```

---

### 6️⃣ SUBMIT QUIZ ATTEMPT (MOST IMPORTANT - Auto Calculates Everything)
```bash
curl -X PATCH http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "totalPoints": 100,
    "duration": 1200,
    "attemptId": "attempt_123",
    "answers": [
      { "questionId": "q1", "answer": "A", "isCorrect": true },
      { "questionId": "q2", "answer": "B", "isCorrect": false }
    ]
  }'
```

**System automatically:**
- Calculates 85% score
- Determines if passed (85 >= 70% = YES)
- Updates totalAttempts to 1
- Sets bestScore to 85
- Updates isPassed to true
- Sets enrollmentStatus to "passed"

---

### 7️⃣ GET ALL MY QUIZZES
```bash
curl -X GET http://localhost:5000/api/quiz-progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8️⃣ GET QUIZZES I PASSED
```bash
curl -X GET "http://localhost:5000/api/quiz-progress?isPassed=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 9️⃣ GET SPECIFIC QUIZ PROGRESS
```bash
curl -X GET http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 🔟 RETRY QUIZ (Failed First, Passed Second)
```bash
# First attempt - 60% (Failed)
curl -X PATCH http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 60,
    "totalPoints": 100,
    "duration": 900,
    "attemptId": "attempt_124"
  }'

# Response shows: totalAttempts: 1, isPassed: false

# Second attempt - 92% (Passed)
curl -X PATCH http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 92,
    "totalPoints": 100,
    "duration": 800,
    "attemptId": "attempt_125"
  }'

# Response shows: 
# totalAttempts: 2
# bestScore: 92 (updated from 60)
# isPassed: true
# attemptsPassed: 1
```

---

## INSTRUCTOR COMMANDS

### 1️⃣ BULK ENROLL STUDENTS
```bash
curl -X POST http://localhost:5000/api/course-progress/bulk \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "607f1f77bcf86cd799439011",
    "userIds": [
      "user1_id",
      "user2_id",
      "user3_id"
    ]
  }'
```

---

### 2️⃣ VIEW ALL STUDENTS IN COURSE
```bash
curl -X GET "http://localhost:5000/api/course-progress/course/607f1f77bcf86cd799439011/all?limit=20" \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN"
```

---

### 3️⃣ GET COURSE STATISTICS
```bash
curl -X GET http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/stats \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN"
```

**Returns:**
```json
{
  "totalEnrolled": 50,
  "totalCompleted": 35,
  "totalDropped": 5,
  "avgCompletion": 72.5,
  "maxCompletion": 100,
  "minCompletion": 10
}
```

---

### 4️⃣ GET QUIZ STATISTICS
```bash
curl -X GET http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/stats \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN"
```

**Returns:**
```json
{
  "totalAttempts": 250,
  "totalStudents": 100,
  "studentsPassed": 75,
  "studentsFailed": 25,
  "avgBestScore": 78.5,
  "passPercentage": "75.00"
}
```

---

### 5️⃣ VIEW ALL STUDENTS' QUIZ PERFORMANCE
```bash
curl -X GET "http://localhost:5000/api/quiz-progress/quiz/607f1f77bcf86cd799439020/all?limit=20" \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN"
```

---

### 6️⃣ BULK UPDATE COMPLETION
```bash
curl -X PATCH http://localhost:5000/api/course-progress/bulk/completion \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "607f1f77bcf86cd799439011",
    "updates": [
      { "userId": "user1", "completionPercent": 50 },
      { "userId": "user2", "completionPercent": 75 },
      { "userId": "user3", "completionPercent": 100 }
    ]
  }'
```

---

## Key ID Values (Replace These)

| Name | Description | Example |
|------|-------------|---------|
| `YOUR_TOKEN` | JWT token from login | `eyJhbGc...` |
| `INSTRUCTOR_TOKEN` | JWT token for instructor | `eyJhbGc...` |
| `607f1f77bcf86cd799439011` | Course ID | Get from database |
| `607f1f77bcf86cd799439020` | Quiz ID | Get from database |
| `user1_id`, `user2_id` | User IDs | Get from database |
| `attempt_123` | Attempt ID | Can be any unique ID |
| `q1`, `q2` | Question IDs | From quiz questions |

---

## Expected Successful Responses

### Create Course Progress (201)
```json
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5e6f",
    "enrollmentStatus": "enrolled",
    "completionPercent": 0
  }
}
```

### Update Quiz Progress with Attempt (200)
```json
{
  "success": true,
  "data": {
    "totalAttempts": 1,
    "bestScore": 85,
    "latestScore": 85,
    "isPassed": true,
    "enrollmentStatus": "passed"
  }
}
```

### Get Statistics (200)
```json
{
  "success": true,
  "data": {
    "totalEnrolled": 50,
    "totalCompleted": 35,
    "avgCompletion": 72.5
  }
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Course ID is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course progress not found"
}
```

### 409 Already Exists
```json
{
  "success": false,
  "message": "Course progress already exists for this user"
}
```

---

## Testing Workflow Example

### 1. Start Fresh (Student)
```bash
# 1. Login
POST http://localhost:5000/api/auth/login
→ Get token

# 2. Enroll in course
POST http://localhost:5000/api/course-progress
→ Create enrollment

# 3. Check progress
GET http://localhost:5000/api/course-progress
→ See enrolled course

# 4. Watch videos and update
PATCH http://localhost:5000/api/course-progress/:courseId/user
→ Update multiple times

# 5. Complete course
PATCH http://localhost:5000/api/course-progress/:courseId/complete
→ Mark as done
```

### 2. Quiz Testing (Student)
```bash
# 1. Create quiz progress
POST http://localhost:5000/api/quiz-progress
→ Initialize quiz

# 2. Take quiz (fail)
PATCH http://localhost:5000/api/quiz-progress/:quizId/attempt
body: score: 60
→ totalAttempts: 1, isPassed: false

# 3. Retry quiz (pass)
PATCH http://localhost:5000/api/quiz-progress/:quizId/attempt
body: score: 85
→ totalAttempts: 2, isPassed: true, bestScore: 85

# 4. Check progress
GET http://localhost:5000/api/quiz-progress/:quizId
→ See all attempts
```

### 3. Analytics (Instructor)
```bash
# 1. Enroll students
POST http://localhost:5000/api/course-progress/bulk
→ 50 students enrolled

# 2. Check course stats
GET http://localhost:5000/api/course-progress/:courseId/stats
→ avgCompletion, totalCompleted, etc.

# 3. Check quiz stats
GET http://localhost:5000/api/quiz-progress/:quizId/stats
→ passPercentage, avgScore, etc.

# 4. View all students
GET http://localhost:5000/api/course-progress/course/:courseId/all
→ See each student's progress
```

---

## Notes

✅ Always include `Authorization` header with Bearer token
✅ Always use `Content-Type: application/json` for POST/PATCH
✅ Empty body for DELETE: `{}`
✅ Empty body for reset: `{}`
✅ All IDs must be valid MongoDB ObjectIds
✅ Instructor endpoints require instructor role token
✅ Student endpoints auto-filter to current user
✅ Most important endpoint: `/attempt` (auto-calculates everything)
