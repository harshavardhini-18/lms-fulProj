# LMS Phase 1 - API Documentation & Schema Guide

## Overview
Phase 1 implements the core learning flow: Course → Modules → Lessons with video-per-lesson approach, basic progress tracking, and end-of-lesson quizzes.

---

## Database Schema Structure

### 1. Course Schema
```javascript
{
  _id: ObjectId,
  title: String (required, max 220 chars),
  slug: String (unique, auto-generated from title),
  subtitle: String (max 220 chars),
  description: String (max 20000 chars),
  summary: String (max 8000 chars),
  tags: [String],
  level: 'beginner|intermediate|advanced|expert',
  language: String (default 'en'),
  thumbnailUrl: String,
  bannerUrl: String,
  duration: Number (total course duration in seconds),
  status: 'draft|published|archived' (default: 'draft'),
  publishedAt: Date,
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Module Schema
```javascript
{
  _id: ObjectId,
  course: ObjectId (ref: Course, required),
  title: String (required, max 180 chars),
  slug: String (unique per course),
  description: String (max 2000 chars),
  order: Number (required, min: 0),
  lessons: [LessonSchema],
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Lesson Schema (embedded in Module)
```javascript
{
  _id: ObjectId,
  title: String (required, max 180 chars),
  order: Number (required, min: 0),
  videoUrl: String (required, max 1000 chars),
  videoDuration: Number (seconds, default 0),
  description: String (max 2000 chars),
  resources: [
    {
      label: String (max 120 chars),
      url: String (max 1000 chars)
    }
  ],
  quizId: ObjectId (ref: Quiz, optional)
}
```

### 4. CourseProgress Schema
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, unique with course),
  course: ObjectId (ref: Course, unique with user),
  enrollmentStatus: 'enrolled|completed|dropped',
  enrolledAt: Date,
  completedAt: Date,
  currentModule: ObjectId (ref: Module),
  currentLesson: ObjectId (ref: Lesson),
  lastWatchedTime: Number (seconds),
  lessonProgress: [
    {
      lesson: ObjectId,
      module: ObjectId,
      lastWatchedTime: Number,
      isCompleted: Boolean,
      completedAt: Date,
      quizAttempt: {
        quizId: ObjectId,
        isPassed: Boolean,
        scorePercent: Number (0-100),
        attemptsUsed: Number,
        lastAttemptAt: Date
      }
    }
  ],
  completedLessonIds: [ObjectId],
  completionPercent: Number (0-100),
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Course Endpoints

#### 1. List All Courses
**GET** `/api/courses`
- Auth: Required (requireUser)
- Query: `status` (optional), `createdBy` (optional)
- Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "title": "React Basics",
      "slug": "react-basics",
      "level": "beginner",
      "duration": 3600,
      "status": "published",
      ...
    }
  ]
}
```

#### 2. Get Course Summary
**GET** `/api/courses/:courseId`
- Auth: Required
- Response: Single course object

#### 3. Get Course with Modules & Lessons (Learning View)
**GET** `/api/courses/:courseId/detail`
- Auth: Required
- Response:
```json
{
  "success": true,
  "data": {
    "_id": "64f...",
    "title": "React Basics",
    "modules": [
      {
        "_id": "65a...",
        "title": "Module 1: Introduction",
        "order": 0,
        "lessons": [
          {
            "_id": "65b...",
            "title": "What is React?",
            "order": 0,
            "videoUrl": "https://...",
            "videoDuration": 600,
            "quizId": "65c..."
          }
        ]
      }
    ]
  }
}
```

#### 4. Get Module Details
**GET** `/api/courses/:courseId/modules/:moduleId`
- Auth: Required
- Response: Module with all lessons

#### 5. Get Lesson Details
**GET** `/api/courses/:courseId/modules/:moduleId/lessons/:lessonId`
- Auth: Required
- Response: Single lesson object with video URL and quiz reference

#### 6. Create Course (Admin)
**POST** `/api/courses`
- Auth: Required
- Body: `{ title: String, ... }`
- Response: Created course object

---

### Progress Endpoints

#### 1. Get User's Course Progress
**GET** `/api/progress/course/:courseId`
- Auth: Required
- Response:
```json
{
  "success": true,
  "data": {
    "user": "64f...",
    "course": "65a...",
    "enrollmentStatus": "enrolled",
    "currentModule": "65b...",
    "currentLesson": "65c...",
    "lastWatchedTime": 120,
    "completedLessonIds": ["65d...", "65e..."],
    "completionPercent": 40,
    "lessonProgress": [...]
  }
}
```

#### 2. Update Lesson Watch Time (called every 5-10 seconds)
**PATCH** `/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/watch`
- Auth: Required
- Body:
```json
{
  "lastWatchedTime": 120.5
}
```
- Response: Updated progress object

#### 3. Mark Lesson as Complete
**PATCH** `/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/complete`
- Auth: Required
- Body: `{ }` (empty)
- Response: Updated progress with completion percent recalculated

#### 4. Record Quiz Attempt for Lesson
**POST** `/api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/quiz`
- Auth: Required
- Body:
```json
{
  "quizId": "65f...",
  "isPassed": true,
  "scorePercent": 85
}
```
- Response: Updated progress with quiz attempt recorded

#### 5. Update Overall Course Watch Progress (for backward compatibility)
**PATCH** `/api/progress/course/:courseId/watch`
- Auth: Required
- Body:
```json
{
  "lastWatchedTime": 3000,
  "completionPercent": 50
}
```
- Response: Updated progress

---

## Frontend Integration Flow

### 1. User Clicks on Course
```
GET /api/courses/:courseId/detail → Fetch course structure with modules and lessons
GET /api/progress/course/:courseId → Fetch user's progress
```

### 2. Load Lesson & Resume
```
Extract currentLesson from progress
Load video from lesson.videoUrl
Seek to progress.lastWatchedTime
```

### 3. During Video Playback (every 5-10 seconds)
```
PATCH /api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/watch
Body: { lastWatchedTime: currentTime }
```

### 4. When Video Ends
```
PATCH /api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/complete
→ Mark lesson complete
→ Show quiz modal if lesson.quizId exists
```

### 5. After Quiz Submission
```
POST /api/progress/course/:courseId/modules/:moduleId/lessons/:lessonId/quiz
Body: { quizId, isPassed, scorePercent }
→ Record attempt
→ Allow user to proceed to next lesson
```

### 6. Navigate to Next Lesson
```
Get next lesson from modules array
GET /api/courses/:courseId/modules/:moduleId/lessons/:nextLessonId
Load new lesson video
```

---

## Sample Data Structure for Testing

### Create a Course
```bash
POST /api/courses
{
  "title": "React Fundamentals",
  "subtitle": "Learn React from scratch",
  "description": "Comprehensive React course...",
  "level": "beginner",
  "status": "published"
}
→ Response: { _id: "course_id", ... }
```

### Create Modules & Lessons (populate separately)
Use MongoDB directly or admin endpoints (to be built in Phase 2):
```javascript
// Module 1
{
  course: "course_id",
  title: "Module 1: Getting Started",
  order: 0,
  lessons: [
    {
      title: "What is React?",
      order: 0,
      videoUrl: "https://example.com/videos/react-intro.mp4",
      videoDuration: 600,
      quizId: "quiz_1"
    },
    {
      title: "JSX Basics",
      order: 1,
      videoUrl: "https://example.com/videos/jsx-basics.mp4",
      videoDuration: 900,
      quizId: "quiz_2"
    }
  ]
}
```

---

## Error Handling

All endpoints return standard error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found (course/lesson doesn't exist)
- `401`: Unauthorized (not authenticated)
- `500`: Server Error

---

## Next Steps for Phase 1 Completion

1. ✅ Create schema (Module, update Course, CourseProgress)
2. ✅ Create services and controllers
3. ✅ Create routes and endpoints
4. 🔲 Add admin endpoints to create/update modules and lessons
5. 🔲 Add quiz-related endpoints
6. 🔲 Build frontend components (video player, TOC sidebar, progress tracker)
7. 🔲 Test end-to-end flow
8. 🔲 Add validation middleware for edge cases

---

## Key Design Decisions for Phase 1

1. **Video-per-Lesson**: Each lesson has its own video URL
2. **Embedded Lessons**: Lessons are embedded in modules (reduces queries)
3. **Progress Granularity**: Track per-lesson progress with lastWatchedTime
4. **Quiz at Lesson End**: Quiz triggers after video playback (no enforcement yet)
5. **Auto-Save**: Frontend should save progress every 5-10 seconds
6. **Resume Support**: lastWatchedTime allows resuming from exact position

---

## Phase 2 Enhancements (Coming Later)

- Quiz enforcement: Cannot advance until quiz is passed
- Skip detection: Detect if user skips quiz and enforce completion
- Admin CRUD for modules/lessons
- Progress analytics
- Certificate generation
