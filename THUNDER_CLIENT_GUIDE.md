# 🚀 Thunder Client - Complete API Testing Guide

## Base URL
```
http://localhost:5000
```

---

## 1️⃣ AUTHENTICATION (Public - No Auth Required)

### Login
```
POST http://localhost:5000/login
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "student@lms.local",
  "password": "student12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "student@lms.local",
      "fullName": "Test Student",
      "role": "student"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

**💾 Save the `accessToken` - use in all other requests!**

---

## 2️⃣ COURSES API (Protected - Auth Required)

### List All Courses
```
GET http://localhost:5000/api/courses
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

---

### Get Course Summary
```
GET http://localhost:5000/api/courses/:courseId
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Example:**
```
GET http://localhost:5000/api/courses/69d9f425f5c9deba4a92cfa8
```

---

### ⭐ Get Course with Modules & Lessons (FOR LEARNING VIEW)
```
GET http://localhost:5000/api/courses/:courseId/detail
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Example:**
```
GET http://localhost:5000/api/courses/69d9f425f5c9deba4a92cfa8/detail
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "69d9f425f5c9deba4a92cfa8",
    "title": "React Fundamentals",
    "slug": "react-fundamentals",
    "level": "beginner",
    "modules": [
      {
        "_id": "69d9f...",
        "title": "Module 1: Getting Started with React",
        "order": 0,
        "lessons": [
          {
            "_id": "69da...",
            "title": "What is React?",
            "order": 0,
            "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "videoDuration": 600,
            "description": "Learn what React is...",
            "resources": []
          },
          {
            "_id": "69db...",
            "title": "JSX Basics",
            "order": 1,
            "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "videoDuration": 900
          }
        ]
      }
    ]
  }
}
```

---

### Get Module Details
```
GET http://localhost:5000/api/courses/:courseId/modules/:moduleId
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Example:**
```
GET http://localhost:5000/api/courses/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa
```

---

### Get Specific Lesson
```
GET http://localhost:5000/api/courses/:courseId/modules/:moduleId/lessons/:lessonId
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Example:**
```
GET http://localhost:5000/api/courses/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa/lessons/69d9f425f5c9deba4a92cfab
```

---

## 3️⃣ PROGRESS API (Protected - Auth Required)

### ⭐ Get User's Course Progress
```
GET http://localhost:5000/api/progress/course/:courseId
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Example:**
```
GET http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "course": "69d9f425f5c9deba4a92cfa8",
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

### ⭐ Save Lesson Watch Time (Call every 5-10 seconds)
```
PATCH http://localhost:5000/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/watch
```

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Example:**
```
PATCH http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa/lessons/69d9f425f5c9deba4a92cfab/watch
```

**Body:**
```json
{
  "lastWatchedTime": 150.5
}
```

---

### ⭐ Mark Lesson as Complete
```
PATCH http://localhost:5000/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/complete
```

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Example:**
```
PATCH http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa/lessons/69d9f425f5c9deba4a92cfab/complete
```

**Body:** (empty or {})
```json
{}
```

---

### ⭐ Record Quiz Attempt
```
POST http://localhost:5000/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/quiz
```

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Example:**
```
POST http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa/lessons/69d9f425f5c9deba4a92cfab/quiz
```

**Body:**
```json
{
  "quizId": "quiz_123",
  "isPassed": true,
  "scorePercent": 85
}
```

---

### Update Course Watch Progress (Legacy)
```
PATCH http://localhost:5000/api/progress/course/:courseId/watch
```

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Body:**
```json
{
  "lastWatchedTime": 3000,
  "completionPercent": 50
}
```

---

## 🧪 COMPLETE TEST FLOW

### Step 1: Login
```
POST http://localhost:5000/login
Body: { "email": "student@lms.local", "password": "student12345" }
```
✅ Save access token

---

### Step 2: Get Course ID
```
GET http://localhost:5000/api/courses
Headers: Authorization: Bearer <TOKEN>
```
✅ Save course `_id`

---

### Step 3: Get Course with Modules & Lessons
```
GET http://localhost:5000/api/courses/69d9f425f5c9deba4a92cfa8/detail
Headers: Authorization: Bearer <TOKEN>
```
✅ Save `moduleId` and `lessonId` from response

---

### Step 4: Get Initial Progress
```
GET http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8
Headers: Authorization: Bearer <TOKEN>
```
✅ View should be empty (first time)

---

### Step 5: Simulate Video Watch (Multiple Times)
```
PATCH http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa/lessons/69d9f425f5c9deba4a92cfab/watch
Body: { "lastWatchedTime": 100 }
```

Then update again:
```
PATCH ...watch
Body: { "lastWatchedTime": 300 }
```

Then update at lesson end:
```
PATCH ...watch
Body: { "lastWatchedTime": 600 }
```

---

### Step 6: Mark Lesson Complete
```
PATCH http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa/lessons/69d9f425f5c9deba4a92cfab/complete
Body: {}
```

---

### Step 7: Record Quiz (Optional)
```
POST http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8/modules/69d9f425f5c9deba4a92cfaa/lessons/69d9f425f5c9deba4a92cfab/quiz
Body: { "quizId": "quiz_123", "isPassed": true, "scorePercent": 85 }
```

---

### Step 8: Check Updated Progress
```
GET http://localhost:5000/api/progress/course/69d9f425f5c9deba4a92cfa8
```
✅ Should now show completed lesson, updated completion %

---

## 📋 Quick Reference Table

| Feature | Method | Endpoint |
|---------|--------|----------|
| Login | POST | `/login` |
| List courses | GET | `/api/courses` |
| Get course | GET | `/api/courses/:courseId` |
| **Get course detail** | GET | `/api/courses/:courseId/detail` ⭐ |
| Get module | GET | `/api/courses/:courseId/modules/:moduleId` |
| Get lesson | GET | `/api/courses/:courseId/modules/:moduleId/lessons/:lessonId` |
| **Get progress** | GET | `/api/progress/course/:courseId` ⭐ |
| **Save watch time** | PATCH | `/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/watch` ⭐ |
| **Complete lesson** | PATCH | `/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/complete` ⭐ |
| **Record quiz** | POST | `/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/quiz` ⭐ |

---

## 🎯 Environment Variables for Thunder Client

Create these in Thunder Client Environment:

```
baseUrl = http://localhost:5000
courseId = 69d9f425f5c9deba4a92cfa8
moduleId = 69d9f425f5c9deba4a92cfaa
lessonId = 69d9f425f5c9deba4a92cfab
accessToken = <token_from_login>
```

Then use in URLs like:
```
{{baseUrl}}/api/courses/{{courseId}}/detail
{{baseUrl}}/api/progress/course/{{courseId}}
```

---

## ✅ Correct URLs for Thunder Client

### Authentication
- `POST http://localhost:5000/login`

### Course Endpoints  
- `GET http://localhost:5000/api/courses`
- `GET http://localhost:5000/api/courses/<courseId>`
- `GET http://localhost:5000/api/courses/<courseId>/detail` ⭐
- `GET http://localhost:5000/api/courses/<courseId>/modules/<moduleId>`
- `GET http://localhost:5000/api/courses/<courseId>/modules/<moduleId>/lessons/<lessonId>`

### Progress Endpoints
- `GET http://localhost:5000/api/progress/course/<courseId>` ⭐
- `PATCH http://localhost:5000/api/progress/course/<courseId>/modules/<moduleId>/lessons/<lessonId>/watch` ⭐
- `PATCH http://localhost:5000/api/progress/course/<courseId>/modules/<moduleId>/lessons/<lessonId>/complete` ⭐
- `POST http://localhost:5000/api/progress/course/<courseId>/modules/<moduleId>/lessons/<lessonId>/quiz` ⭐

---

## 🔴 Common Issues

**Issue:** 401 Unauthorized
- Make sure you added the `Authorization: Bearer <token>` header

**Issue:** Route not found
- Make sure the URL matches exactly (check spelling, slashes, IDs)
- Use actual IDs from your database, not example IDs

**Issue:** Cannot find course/module/lesson
- Run seed script first: `SYNC_INDEXES=true node scripts/seedPhase1.js`
- Verify IDs are correct from API responses

---

## 🚀 Ready to Test!

Start with Step 1 above and follow the complete flow!
