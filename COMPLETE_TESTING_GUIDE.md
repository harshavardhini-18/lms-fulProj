# 🎯 COMPLETE API TESTING GUIDE - FROM ZERO TO HERO

## ⚠️ IMPORTANT: START FRESH

Before testing, **DO THIS ONCE**:

```bash
cd lms-project-backend
SYNC_INDEXES=true node scripts/seedPhase1.js
npm start
```

Wait for: `Server running on port 5000` ✅

---

## 📋 TEST CHECKLIST - Complete Workflow

Follow these steps **EXACTLY** in Thunder Client:

---

### ✅ STEP 1: LOGIN (Get Auth Token)

**METHOD:** `POST`  
**URL:** 
```
http://localhost:5000/login
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

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "YOUR_USER_ID",
      "fullName": "Test Student",
      "email": "student@lms.local",
      "role": "student",
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**❗ IMPORTANT:** Copy the `accessToken` value completely - you'll use it in ALL next requests!

**Store in Thunder Client Environment:**
```
accessToken = <paste_the_full_token>
```

---

### ✅ STEP 2: GET COURSES LIST

**METHOD:** `GET`  
**URL:**
```
http://localhost:5000/api/courses
```

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

In Thunder Client, use:
```
Authorization: Bearer {{accessToken}}
```

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "YOUR_COURSE_ID",
      "title": "React Fundamentals",
      "slug": "react-fundamentals",
      "level": "beginner",
      "status": "published",
      "description": "Comprehensive React course...",
      "duration": 0,
      "createdAt": "2026-04-11T...",
      "updatedAt": "2026-04-11T..."
    }
  ]
}
```

**Store in Thunder Client Environment:**
```
courseId = <paste_the__id_value>
```

---

### ✅ STEP 3: GET COURSE WITH MODULES & LESSONS (LEARNING VIEW)

**METHOD:** `GET`  
**URL:**
```
http://localhost:5000/api/courses/YOUR_COURSE_ID/detail
```

In Thunder Client:
```
http://localhost:5000/api/courses/{{courseId}}/detail
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "_id": "YOUR_COURSE_ID",
    "title": "React Fundamentals",
    "modules": [
      {
        "_id": "MODULE_1_ID",
        "title": "Module 1: Getting Started with React",
        "order": 0,
        "lessons": [
          {
            "_id": "LESSON_1_ID",
            "title": "What is React?",
            "order": 0,
            "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "videoDuration": 600,
            "description": "Learn what React is..."
          },
          {
            "_id": "LESSON_2_ID",
            "title": "JSX Basics",
            "order": 1,
            "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "videoDuration": 900
          },
          {
            "_id": "LESSON_3_ID",
            "title": "Components and Props",
            "order": 2,
            "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "videoDuration": 1200
          }
        ]
      },
      {
        "_id": "MODULE_2_ID",
        "title": "Module 2: State and Hooks",
        "order": 1,
        "lessons": [ ... ]
      }
    ]
  }
}
```

**Store in Thunder Client Environment:**
```
moduleId = <paste_first_module_._id>
lessonId = <paste_first_lesson_._id>
```

---

### ✅ STEP 4: GET USER'S INITIAL PROGRESS

**METHOD:** `GET`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "_id": "PROGRESS_ID",
    "user": "YOUR_USER_ID",
    "course": "{{courseId}}",
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

✅ Notice everything is empty/zero (first time watching)

---

### ✅ STEP 5A: SAVE WATCH TIME (Simulate Playing Video - Time: 100 seconds)

**METHOD:** `PATCH`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}/modules/{{moduleId}}/lessons/{{lessonId}}/watch
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "lastWatchedTime": 100
}
```

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "_id": "PROGRESS_ID",
    "currentModule": "{{moduleId}}",
    "currentLesson": "{{lessonId}}",
    "lastWatchedTime": 100,
    "lessonProgress": [
      {
        "_id": "...",
        "lesson": "{{lessonId}}",
        "module": "{{moduleId}}",
        "lastWatchedTime": 100,
        "isCompleted": false
      }
    ]
  }
}
```

✅ Notice `lastWatchedTime` updated to 100

---

### ✅ STEP 5B: UPDATE WATCH TIME (Time: 300 seconds)

**METHOD:** `PATCH`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}/modules/{{moduleId}}/lessons/{{lessonId}}/watch
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "lastWatchedTime": 300
}
```

**Expected Response:** lastWatchedTime = 300

---

### ✅ STEP 5C: UPDATE WATCH TIME (Time: 600 = End of Video)

**METHOD:** `PATCH`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}/modules/{{moduleId}}/lessons/{{lessonId}}/watch
```

**Body:**
```json
{
  "lastWatchedTime": 600
}
```

**Expected Response:** lastWatchedTime = 600

---

### ✅ STEP 6: MARK LESSON AS COMPLETE

**METHOD:** `PATCH`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}/modules/{{moduleId}}/lessons/{{lessonId}}/complete
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{}
```

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "_id": "PROGRESS_ID",
    "completedLessonIds": ["{{lessonId}}"],
    "completionPercent": 12,
    "lessonProgress": [
      {
        ...
        "isCompleted": true,
        "completedAt": "2026-04-11T12:30:45.123Z"
      }
    ]
  }
}
```

✅ Notice:
- `isCompleted` = true
- `completionPercent` = 12 (1 of 8 lessons)
- `completedLessonIds` has the lesson ID

---

### ✅ STEP 7: RECORD QUIZ ATTEMPT (Optional)

**METHOD:** `POST`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}/modules/{{moduleId}}/lessons/{{lessonId}}/quiz
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "quizId": "any_quiz_id_123",
  "isPassed": true,
  "scorePercent": 85
}
```

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    ...
    "lessonProgress": [
      {
        ...
        "quizAttempt": {
          "quizId": "any_quiz_id_123",
          "isPassed": true,
          "scorePercent": 85,
          "attemptsUsed": 1,
          "lastAttemptAt": "2026-04-11T12:31:00.000Z"
        }
      }
    ]
  }
}
```

---

### ✅ STEP 8: VERIFY UPDATED PROGRESS

**METHOD:** `GET`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response:** Should show:
- ✅ `completedLessonIds`: [one_lesson_id]
- ✅ `completionPercent`: 12
- ✅ `lessonProgress[0].isCompleted`: true
- ✅ `lessonProgress[0].quizAttempt`: (from step 7)

---

### ✅ STEP 9: TEST SECOND LESSON

Repeat **STEPS 5-8** for the second lesson:

First, get **second ladder ID** from Step 3 response (lessons[1]._id)

```
lessonId = <second_lesson_id>
```

Then do the same watch→complete→quiz process.

**Expected:** After completing 2nd lesson:
- `completedLessonIds`: [lesson1_id, lesson2_id]
- `completionPercent`: 25 (2 of 8 lessons)

---

### ✅ STEP 10: TEST RESUME (Simulate Page Refresh)

**METHOD:** `GET`  
**URL:**
```
http://localhost:5000/api/progress/course/{{courseId}}
```

**Expected:** Should return same data as Step 8 (your progress is saved!)

---

### ✅ STEP 11: GET MODULE DETAILS

**METHOD:** `GET`  
**URL:**
```
http://localhost:5000/api/courses/{{courseId}}/modules/{{moduleId}}
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response:** Full module with all lessons

---

### ✅ STEP 12: GET SPECIFIC LESSON

**METHOD:** `GET`  
**URL:**
```
http://localhost:5000/api/courses/{{courseId}}/modules/{{moduleId}}/lessons/{{lessonId}}
```

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response:** Single lesson with video URL, duration, etc.

---

## 🛠️ Thunder Client Environment Setup

Create **ONE Environment** with these variables:

```yaml
baseUrl: http://localhost:5000
courseId: <from step 2 response>
moduleId: <from step 3 response>
lessonId: <from step 3 response>
accessToken: <from step 1 response>
```

Then use in URLs like:
```
{{baseUrl}}/api/courses/{{courseId}}/detail
{{baseUrl}}/api/progress/course/{{courseId}}
```

---

## ✅ FULL URL REFERENCE (No Variables)

```
# Login
POST http://localhost:5000/login

# Courses
GET http://localhost:5000/api/courses
GET http://localhost:5000/api/courses/COURSE_ID
GET http://localhost:5000/api/courses/COURSE_ID/detail
GET http://localhost:5000/api/courses/COURSE_ID/modules/MODULE_ID
GET http://localhost:5000/api/courses/COURSE_ID/modules/MODULE_ID/lessons/LESSON_ID

# Progress
GET http://localhost:5000/api/progress/course/COURSE_ID
PATCH http://localhost:5000/api/progress/course/COURSE_ID/modules/MODULE_ID/lessons/LESSON_ID/watch
PATCH http://localhost:5000/api/progress/course/COURSE_ID/modules/MODULE_ID/lessons/LESSON_ID/complete
POST http://localhost:5000/api/progress/course/COURSE_ID/modules/MODULE_ID/lessons/LESSON_ID/quiz
```

---

## 🔴 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Missing/wrong token | Copy full token from login response |
| 404 Not Found | Wrong IDs | Use actual IDs from API responses, not examples |
| Backend won't start | Port 5000 in use | Kill process: `lsof -ti:5000 \| xargs kill` |
| Wrong password | Credentials mismatch | Use: `student@lms.local` / `student12345` |
| Empty/null responses | Database issue | Re-run: `SYNC_INDEXES=true node scripts/seedPhase1.js` |

---

## 📝 Expected Test Results

After completing full workflow:

✅ 8/9 lessons could be completed  
✅ Completion percent reaches ~100%  
✅ Progress persists on page refresh  
✅ Quiz data recorded per lesson  
✅ All CRUD operations work  

---

## 🎊 SUCCESS INDICATORS

When you see these, **ALL APIs ARE WORKING**:

1. ✅ Login returns accessToken
2. ✅ Course list returns "React Fundamentals"
3. ✅ Course detail shows 3 modules with 8 lessons total
4. ✅ Progress starts at 0%, updates with watch time
5. ✅ Lesson marked complete updates completion %
6. ✅ Quiz attempt recorded successfully
7. ✅ Resume returns saved progress
8. ✅ Get lesson/module returns individual items

---

## 🚀 You're ALL SET!

Follow steps 1-12 in Thunder Client and your API is fully tested and working! 🎉
