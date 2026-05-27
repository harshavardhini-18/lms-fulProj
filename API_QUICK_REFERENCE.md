# API Quick Reference Guide

## Course Progress APIs - Quick Reference

### Student Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/course-progress` | Create progress for a course |
| GET | `/api/course-progress` | Get all my courses' progress (with filters) |
| GET | `/api/course-progress/:courseId` | Get my progress in a specific course |
| PATCH | `/api/course-progress/:courseId/user` | Update my progress in a course |
| PATCH | `/api/course-progress/:courseId/complete` | Mark a course as completed |
| PATCH | `/api/course-progress/:courseId/lesson/:lessonId` | Update lesson progress |
| PATCH | `/api/course-progress/:courseId/reset` | Reset course progress |
| DELETE | `/api/course-progress/:courseId/user` | Delete my course progress |

### Instructor Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/course-progress/bulk` | Create progress for multiple students |
| GET | `/api/course-progress/course/:courseId/all` | Get all students' progress in a course |
| GET | `/api/course-progress/:courseId/stats` | Get course completion statistics |
| PATCH | `/api/course-progress/bulk/completion` | Bulk update completion percentages |

---

## Quiz Progress APIs - Quick Reference

### Student Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/quiz-progress` | Create quiz progress |
| GET | `/api/quiz-progress` | Get all my quizzes' progress (with filters) |
| GET | `/api/quiz-progress/:quizId` | Get my progress in a specific quiz |
| PATCH | `/api/quiz-progress/:quizId/user` | Update my quiz progress |
| PATCH | `/api/quiz-progress/:quizId/attempt` | Update after attempting quiz (auto-calculates) |
| PATCH | `/api/quiz-progress/:quizId/pass` | Mark quiz as passed |
| PATCH | `/api/quiz-progress/:quizId/reset` | Reset quiz progress |
| DELETE | `/api/quiz-progress/:quizId/user` | Delete my quiz progress |

### Instructor Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/quiz-progress/bulk` | Create quiz progress for multiple students |
| GET | `/api/quiz-progress/quiz/:quizId/all` | Get all students' progress for a quiz |
| GET | `/api/quiz-progress/:quizId/stats` | Get quiz performance statistics |
| GET | `/api/quiz-progress/course/:courseId/all` | Get all quizzes progress in a course |

---

## Most Used Endpoints

### For Students

```bash
# 1. Start a course
POST /api/course-progress
{ "courseId": "xyz" }

# 2. Update as you learn (call periodically)
PATCH /api/course-progress/course_id/user
{ "currentLesson": "lesson_id", "completionPercent": 45 }

# 3. Submit quiz attempt
PATCH /api/quiz-progress/quiz_id/attempt
{ "score": 85, "totalPoints": 100, "duration": 1200 }

# 4. Check your progress
GET /api/course-progress
GET /api/quiz-progress

# 5. Complete course
PATCH /api/course-progress/course_id/complete
```

### For Instructors

```bash
# 1. Bulk enroll students
POST /api/course-progress/bulk
{ "courseId": "xyz", "userIds": ["u1", "u2", "u3"] }

# 2. Get course analytics
GET /api/course-progress/course_id/stats
GET /api/course-progress/course_id/all

# 3. Get quiz performance
GET /api/quiz-progress/quiz_id/stats

# 4. View all students' progress
GET /api/quiz-progress/quiz_id/all
```

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 201 | Created successfully |
| 200 | Success (GET, PATCH, DELETE) |
| 400 | Bad request (invalid data) |
| 404 | Not found |
| 409 | Conflict (already exists) |
| 500 | Server error |

---

## Query Parameters

### Pagination
```
?limit=10&skip=0
?limit=20&skip=20
```

### Filtering - Course Progress
```
?enrollmentStatus=enrolled
?enrollmentStatus=completed
?enrollmentStatus=dropped
```

### Filtering - Quiz Progress
```
?isPassed=true
?isPassed=false
?enrollmentStatus=passed
?courseId=course_id
```

---

## Request Body Examples

### Create Course Progress
```json
{
  "courseId": "course123",
  "progressData": {
    "enrollmentStatus": "enrolled",
    "completionPercent": 0
  }
}
```

### Update Course Progress
```json
{
  "currentLesson": "lesson456",
  "lastWatchedTime": 3600,
  "completionPercent": 50
}
```

### Track Quiz Attempt
```json
{
  "score": 85,
  "totalPoints": 100,
  "duration": 1200,
  "attemptId": "attempt789",
  "answers": [
    { "questionId": "q1", "answer": "A", "isCorrect": true }
  ]
}
```

### Bulk Update Completion
```json
{
  "courseId": "course123",
  "updates": [
    { "userId": "user1", "completionPercent": 50 },
    { "userId": "user2", "completionPercent": 75 }
  ]
}
```

---

## Course Progress Statuses

| Status | Meaning |
|--------|---------|
| `enrolled` | Currently taking the course |
| `completed` | Finished the course |
| `dropped` | Student dropped the course |

---

## Quiz Progress Statuses

| Status | Meaning |
|--------|---------|
| `not_started` | Haven't started quiz |
| `in_progress` | Currently taking quiz |
| `passed` | Passed the quiz |
| `failed` | Failed the quiz (but may retry) |

---

## Key Fields in Responses

### Course Progress
```json
{
  "_id": "progress_id",
  "user": "user_id",
  "course": "course_id",
  "enrollmentStatus": "enrolled",
  "currentLesson": "lesson_id",
  "completionPercent": 45,
  "enrolledAt": "2024-05-25T10:00:00Z",
  "completedAt": null,
  "createdAt": "2024-05-25T10:00:00Z",
  "updatedAt": "2024-05-25T10:30:00Z"
}
```

### Quiz Progress
```json
{
  "_id": "progress_id",
  "user": "user_id",
  "quiz": "quiz_id",
  "course": "course_id",
  "isPassed": true,
  "bestScore": 90,
  "latestScore": 85,
  "totalAttempts": 2,
  "attemptsPassed": 1,
  "passedAt": "2024-05-25T10:30:00Z",
  "lastAttemptAt": "2024-05-25T10:28:00Z",
  "totalTimeSpent": 2400
}
```

---

## Statistics Response Example

### Course Statistics
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

### Quiz Statistics
```json
{
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
```

---

## Common Workflows

### Workflow 1: Complete Course
1. `POST /api/course-progress` - Create progress
2. Multiple `PATCH /api/course-progress/:courseId/user` - Update as you progress
3. `PATCH /api/course-progress/:courseId/complete` - Mark complete

### Workflow 2: Take Quiz Multiple Times
1. `POST /api/quiz-progress` - Create quiz progress
2. `PATCH /api/quiz-progress/:quizId/attempt` - First attempt
3. `PATCH /api/quiz-progress/:quizId/attempt` - Second attempt (if failed)
4. System auto-tracks: attempts, best score, pass status

### Workflow 3: Bulk Enroll & Monitor
1. `POST /api/course-progress/bulk` - Enroll 100 students
2. `GET /api/course-progress/course/:courseId/stats` - Check progress
3. `GET /api/course-progress/course/:courseId/all` - See all students
4. `PATCH /api/course-progress/bulk/completion` - Update progress

---

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Common errors:
- `Course ID is required` - Missing required field
- `Course progress not found` - Trying to update non-existent record
- `Course progress already exists` - Duplicate creation attempt
- User not authenticated - No auth token provided

---

## Authentication Required

All endpoints require:
```
Authorization: Bearer {jwt_token}
```

obtained from login/register endpoints.

---

## Rate Limiting (if implemented)

Typical limits:
- Student endpoints: 1000 requests/hour
- Instructor endpoints: 5000 requests/hour
- Admin endpoints: Unlimited

---

## Testing Commands

### With cURL
```bash
# Create course progress
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"course123"}'

# Get my progress
curl -X GET http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update progress
curl -X PATCH http://localhost:5000/api/course-progress/course123/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completionPercent":50}'
```

### With Postman
1. Import collection with all endpoints
2. Set Bearer token in Authorization tab
3. Use environment variables for courseId, quizId, etc.
4. Test each endpoint

---

## Database Collections

The implementation creates/uses:

1. **courseprogress** - Course progress records
2. **quizprogresses** - Quiz progress records
3. **courses** - Existing course data
4. **quizzes** - Existing quiz data
5. **users** - Existing user data

Relationships are maintained through ObjectId references.

---

## Performance Tips

1. Use pagination for large lists
2. Filter results to reduce data transfer
3. Bulk operations are faster than individual operations
4. Indexes ensure quick lookups
5. Consider caching statistics that don't change frequently
