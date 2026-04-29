# Phase 1 Testing Guide

## Quick Start

### 1. Seed Sample Data
```bash
cd lms-project-backend
SYNC_INDEXES=true node scripts/seedPhase1.js
```

This creates:
- Admin user: `admin@lms.local` / `admin12345`
- Student user: `student@lms.local` / student12345`
- Course: "React Fundamentals"
- 3 Modules with 8 total lessons

---

## Authentication

First, get a JWT token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@lms.local",
    "password": "student12345"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

Save the `accessToken` and use it for all subsequent requests in the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

---

## Testing Endpoints

### 1. List Courses
```bash
curl -X GET http://localhost:5000/api/courses \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "React Fundamentals",
      "slug": "react-fundamentals",
      "level": "beginner",
      "status": "published"
    }
  ]
}
```

---

### 2. Get Course with Modules and Lessons
Save the course `_id` from the list response and use it in this request:

```bash
curl -X GET http://localhost:5000/api/courses/<COURSE_ID>/detail \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "React Fundamentals",
    "modules": [
      {
        "_id": "...",
        "title": "Module 1: Getting Started with React",
        "order": 0,
        "lessons": [
          {
            "_id": "...",
            "title": "What is React?",
            "videoUrl": "https://...",
            "videoDuration": 600,
            "quizId": null
          },
          {
            "_id": "...",
            "title": "JSX Basics",
            "videoUrl": "https://...",
            "videoDuration": 900
          }
        ]
      }
    ]
  }
}
```

**Save these IDs for next steps:**
- `MODULE_ID` from modules[0]._id
- `LESSON_ID` from modules[0].lessons[0]._id

---

### 3. Get User's Course Progress (Initial)
```bash
curl -X GET http://localhost:5000/api/progress/course/<COURSE_ID> \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response (on first access):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "course": "<COURSE_ID>",
    "enrollmentStatus": "enrolled",
    "currentModule": null,
    "currentLesson": null,
    "lastWatchedTime": 0,
    "completedLessonIds": [],
    "completionPercent": 0,
    "lessonProgress": []
  }
}
```

---

### 4. Update Lesson Watch Time (Simulate Video Playback)
This endpoint simulates user watching the video. Call this every 5-10 seconds in a real application.

```bash
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID>/watch \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "lastWatchedTime": 150.5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "course": "<COURSE_ID>",
    "currentModule": "<MODULE_ID>",
    "currentLesson": "<LESSON_ID>",
    "lastWatchedTime": 150.5,
    "completedLessonIds": [],
    "completionPercent": 0,
    "lessonProgress": [
      {
        "_id": "...",
        "lesson": "<LESSON_ID>",
        "module": "<MODULE_ID>",
        "lastWatchedTime": 150.5,
        "isCompleted": false
      }
    ]
  }
}
```

**Simulate multiple watch updates:**
```bash
# Update at different times
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID>/watch \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "lastWatchedTime": 300 }'

# Update again
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID>/watch \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "lastWatchedTime": 450 }'

# Update at lesson end (600 seconds)
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID>/watch \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "lastWatchedTime": 600 }'
```

---

### 5. Mark Lesson as Complete (After Video Ends)
```bash
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID>/complete \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "course": "<COURSE_ID>",
    "currentModule": "<MODULE_ID>",
    "currentLesson": "<LESSON_ID>",
    "lastWatchedTime": 600,
    "completedLessonIds": ["<LESSON_ID>"],
    "completionPercent": 5,  // 1 of 8 lessons = 12.5%, but depends on total
    "lessonProgress": [
      {
        ...
        "isCompleted": true,
        "completedAt": "2024-04-11T10:30:00Z"
      }
    ]
  }
}
```

---

### 6. Record Quiz Attempt (Optional)
If the lesson has a quiz, record the attempt:

```bash
curl -X POST http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID>/quiz \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "quiz_id_from_lesson",
    "isPassed": true,
    "scorePercent": 85
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    ...
    "lessonProgress": [
      {
        ...
        "quizAttempt": {
          "quizId": "quiz_id_from_lesson",
          "isPassed": true,
          "scorePercent": 85,
          "attemptsUsed": 1,
          "lastAttemptAt": "2024-04-11T10:32:00Z"
        }
      }
    ]
  }
}
```

---

### 7. Complete Multiple Lessons and Track Progress
Repeat steps 4-6 with different lesson IDs to complete multiple lessons:

```bash
# Get second lesson ID from your saved data
# LESSON_2_ID = modules[0].lessons[1]._id

# Watch second lesson
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_2_ID>/watch \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "lastWatchedTime": 900 }'

# Complete second lesson
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_2_ID>/complete \
  -H "Authorization: Bearer <accessToken>"

# Check progress again
curl -X GET http://localhost:5000/api/progress/course/<COURSE_ID> \
  -H "Authorization: Bearer <accessToken>"
```

**Expected:** `completedLessonIds` now has 2 items, `completionPercent` increases to ~25%

---

### 8. Resume from Last Position (Page Refresh Scenario)
Simulate user closing browser and returning later:

```bash
# Get progress (will show last watched position)
curl -X GET http://localhost:5000/api/progress/course/<COURSE_ID> \
  -H "Authorization: Bearer <accessToken>"
```

Response shows:
- `currentModule`: The module they were in
- `currentLesson`: The lesson they were watching
- `lastWatchedTime`: Exact position to resume from
- `completedLessonIds`: All completed lessons

**Frontend should:**
1. Load the current lesson from the progress data
2. Seek video to `lastWatchedTime`
3. Resume playback

---

### 9. Get Module Details
```bash
curl -X GET http://localhost:5000/api/courses/<COURSE_ID>/modules/<MODULE_ID> \
  -H "Authorization: Bearer <accessToken>"
```

---

### 10. Get Specific Lesson Details
```bash
curl -X GET http://localhost:5000/api/courses/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID> \
  -H "Authorization: Bearer <accessToken>"
```

---

## Testing Checklist

- [ ] Run seed script
- [ ] Login and get access token
- [ ] List courses
- [ ] Get course with modules/lessons detail
- [ ] Get initial progress (should be zero)
- [ ] Update watch time multiple times
- [ ] Mark lesson complete
- [ ] Verify completion percent updates
- [ ] Complete another lesson
- [ ] Check completedLessonIds increases
- [ ] Simulate resume (get progress again)
- [ ] Verify all CRUD operations work

---

## Error Test Cases

### Invalid Course ID
```bash
curl -X GET http://localhost:5000/api/courses/invalid_id \
  -H "Authorization: Bearer <accessToken>"
```

**Expected:** 404 error

### Missing Authorization
```bash
curl -X GET http://localhost:5000/api/courses/<COURSE_ID>/detail
```

**Expected:** 401 Unauthorized

### Invalid Watch Time
```bash
curl -X PATCH http://localhost:5000/api/progress/course/<COURSE_ID>/modules/<MODULE_ID>/lessons/<LESSON_ID>/watch \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "lastWatchedTime": -100 }'
```

**Expected:** 400 Bad Request

---

## Using Postman or Insomnia

1. Import the curl commands above into Postman/Insomnia
2. Set environment variables:
   - `BASE_URL`: http://localhost:5000
   - `COURSE_ID`: (from list endpoint)
   - `MODULE_ID`: (from detail endpoint)
   - `LESSON_ID`: (from detail endpoint)
   - `ACCESS_TOKEN`: (from login endpoint)
3. Replace `<VARIABLE>` with `{{VARIABLE}}`

Example Postman URL:
```
{{BASE_URL}}/api/progress/course/{{COURSE_ID}}/modules/{{MODULE_ID}}/lessons/{{LESSON_ID}}/watch
```

---

## Troubleshooting

**Issue:** 404 on any endpoint
- Check that server is running: `npm start`
- Verify IDs are correct
- Check database is connected

**Issue:** 401 Unauthorized
- Verify access token is valid and included in headers
- Try getting a new token

**Issue:** Invalid ObjectId error
- Ensure you're copying exact MongoDB IDs from responses
- Don't use sample IDs - use actual IDs from your database

**Issue:** Module or lesson not found
- Verify course exists: run seed script again
- Check that MODULE_ID and LESSON_ID match the course

---

## Next Steps

After Phase 1 testing is complete:

1. **Frontend Integration**: Build React components using these endpoints
2. **Admin Panel**: Create endpoints to add/edit modules and lessons
3. **Quiz Integration**: Link quizzes to lessons and enforce completion (Phase 2)
4. **Performance Optimization**: Add caching and pagination for large courses
