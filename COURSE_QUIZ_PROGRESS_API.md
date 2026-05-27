# Course and Quiz Progress API Documentation

## Overview
Complete API for managing course and quiz progress for students and instructors. Two separate models track course-level and quiz-level progress independently.

---

## Schemas

### CourseProgressSchema
Tracks user progress within a course

**Fields:**
```
{
  user: ObjectId (ref: User),              // Student ID
  course: ObjectId (ref: Course),          // Course ID
  enrollmentStatus: String,                // 'enrolled', 'completed', 'dropped'
  enrolledAt: Date,                        // When enrolled
  completedAt: Date,                       // When completed
  currentModule: ObjectId,                 // Current module being studied
  currentLesson: ObjectId,                 // Current lesson being studied
  lastWatchedTime: Number,                 // Last watched time in seconds
  lessonProgress: Array,                   // Array of lesson progress objects
  completedLessonIds: Array,               // IDs of completed lessons
  completionPercent: Number,               // 0-100
  quizGates: Array,                        // Quiz gate states at timestamps
  createdAt: Date,                         // Record creation time
  updatedAt: Date                          // Record update time
}

Indexes:
- { user: 1, course: 1 } - UNIQUE
- { course: 1, completionPercent: -1 }
```

### QuizProgressSchema
Tracks user progress for individual quizzes

**Fields:**
```
{
  user: ObjectId (ref: User),              // Student ID
  course: ObjectId (ref: Course),          // Course ID
  quiz: ObjectId (ref: Quiz),              // Quiz ID
  enrollmentStatus: String,                // 'not_started', 'in_progress', 'passed', 'failed'
  totalAttempts: Number,                   // Total quiz attempts
  attemptsPassed: Number,                  // Successful attempts
  attemptsFailed: Number,                  // Failed attempts
  bestScore: Number,                       // 0-100, highest score
  latestScore: Number,                     // 0-100, latest attempt score
  isPassed: Boolean,                       // Whether quiz is passed
  passingScorePercent: Number,             // Passing threshold (default 70)
  firstAttemptAt: Date,                    // First attempt timestamp
  lastAttemptAt: Date,                     // Last attempt timestamp
  passedAt: Date,                          // When passed
  totalTimeSpent: Number,                  // Total time in seconds
  lastAttemptDuration: Number,             // Duration of last attempt in seconds
  lastAttemptId: ObjectId (ref: QuizAttempt),  // Reference to last attempt
  latestAttemptAnswers: Array,             // Answers from latest attempt
  notes: String,                           // Optional notes (max 2000 chars)
  isActive: Boolean,                       // Whether tracking is active
  createdAt: Date,                         // Record creation time
  updatedAt: Date                          // Record update time
}

Indexes:
- { user: 1, quiz: 1 } - UNIQUE
- { user: 1, course: 1, isPassed: 1 }
- { course: 1, isPassed: 1 }
- { lastAttemptAt: -1 }
```

---

## Course Progress APIs

### CREATE Endpoints

#### 1. Create Course Progress
```
POST /api/course-progress
Authorization: Student

Body:
{
  "courseId": "string (required)",
  "progressData": {
    "enrollmentStatus": "string",
    "currentModule": "string",
    "currentLesson": "string",
    "lastWatchedTime": 0,
    "completionPercent": 0
  }
}

Response: 201
{
  "success": true,
  "data": { CourseProgress object }
}
```

#### 2. Bulk Create Course Progress
```
POST /api/course-progress/bulk
Authorization: Instructor

Body:
{
  "courseId": "string (required)",
  "userIds": ["userId1", "userId2", ...]
}

Response: 201
{
  "success": true,
  "data": {
    "createdCount": 5,
    "records": [CourseProgress objects]
  }
}
```

---

### READ Endpoints

#### 3. Get My Course Progress (User-Course)
```
GET /api/course-progress/:courseId
Authorization: Student

Response: 200
{
  "success": true,
  "data": { CourseProgress object }
}
```

#### 4. Get All My Course Progress
```
GET /api/course-progress
Authorization: Student

Query Parameters:
- enrollmentStatus: "enrolled|completed|dropped"
- limit: number (default 10)
- skip: number (default 0)

Response: 200
{
  "success": true,
  "data": {
    "data": [CourseProgress objects],
    "total": 25,
    "limit": 10,
    "skip": 0,
    "pages": 3
  }
}
```

#### 5. Get Course Progress by ID
```
GET /api/course-progress/id/:progressId
Authorization: Student

Response: 200
{
  "success": true,
  "data": { CourseProgress object }
}
```

#### 6. Get All Course Progress (Instructor View)
```
GET /api/course-progress/course/:courseId/all
Authorization: Instructor

Query Parameters:
- enrollmentStatus: "enrolled|completed|dropped"
- limit: number (default 10)
- skip: number (default 0)

Response: 200
{
  "success": true,
  "data": {
    "data": [CourseProgress objects],
    "total": 50,
    "limit": 10,
    "skip": 0,
    "pages": 5
  }
}
```

#### 7. Get Course Completion Statistics
```
GET /api/course-progress/:courseId/stats
Authorization: Instructor

Response: 200
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

### UPDATE Endpoints

#### 8. Update Course Progress (by Progress ID)
```
PATCH /api/course-progress/:progressId
Authorization: Student

Body:
{
  "currentModule": "moduleId",
  "currentLesson": "lessonId",
  "lastWatchedTime": 3600,
  "completionPercent": 45,
  "enrollmentStatus": "enrolled"
}

Response: 200
{
  "success": true,
  "data": { Updated CourseProgress object }
}
```

#### 9. Update User-Course Progress
```
PATCH /api/course-progress/:courseId/user
Authorization: Student

Body: (same as above)

Response: 200
{
  "success": true,
  "data": { Updated CourseProgress object }
}
```

#### 10. Mark Course as Completed
```
PATCH /api/course-progress/:courseId/complete
Authorization: Student

Body: {} (empty)

Response: 200
{
  "success": true,
  "data": {
    "enrollmentStatus": "completed",
    "completionPercent": 100,
    "completedAt": "2024-05-25T10:30:00Z"
  }
}
```

#### 11. Update Lesson Progress
```
PATCH /api/course-progress/:courseId/lesson/:lessonId
Authorization: Student

Body:
{
  "lesson": "lessonId",
  "module": "moduleId",
  "lastWatchedTime": 2000,
  "isCompleted": true,
  "completedAt": "2024-05-25T10:30:00Z"
}

Response: 200
{
  "success": true,
  "data": { Updated CourseProgress object }
}
```

#### 12. Bulk Update Completion Percent
```
PATCH /api/course-progress/bulk/completion
Authorization: Instructor

Body:
{
  "courseId": "courseId",
  "updates": [
    { "userId": "userId1", "completionPercent": 50 },
    { "userId": "userId2", "completionPercent": 75 }
  ]
}

Response: 200
{
  "success": true,
  "data": {
    "modifiedCount": 2,
    "matchedCount": 2
  }
}
```

#### 13. Reset Course Progress
```
PATCH /api/course-progress/:courseId/reset
Authorization: Student

Body: {} (empty)

Response: 200
{
  "success": true,
  "message": "Course progress reset successfully",
  "data": { Reset CourseProgress object }
}
```

---

### DELETE Endpoints

#### 14. Delete Course Progress (by ID)
```
DELETE /api/course-progress/:progressId
Authorization: Student

Response: 200
{
  "success": true,
  "message": "Course progress deleted successfully",
  "data": { Deleted CourseProgress object }
}
```

#### 15. Delete User-Course Progress
```
DELETE /api/course-progress/:courseId/user
Authorization: Student

Response: 200
{
  "success": true,
  "message": "Course progress deleted successfully",
  "data": { Deleted CourseProgress object }
}
```

---

## Quiz Progress APIs

### CREATE Endpoints

#### 1. Create Quiz Progress
```
POST /api/quiz-progress
Authorization: Student

Body:
{
  "courseId": "string (required)",
  "quizId": "string (required)",
  "progressData": {
    "enrollmentStatus": "not_started",
    "totalAttempts": 0,
    "bestScore": 0
  }
}

Response: 201
{
  "success": true,
  "data": { QuizProgress object }
}
```

#### 2. Bulk Create Quiz Progress
```
POST /api/quiz-progress/bulk
Authorization: Instructor

Body:
{
  "courseId": "string (required)",
  "quizId": "string (required)",
  "userIds": ["userId1", "userId2", ...]
}

Response: 201
{
  "success": true,
  "data": {
    "createdCount": 5,
    "records": [QuizProgress objects]
  }
}
```

---

### READ Endpoints

#### 3. Get My Quiz Progress
```
GET /api/quiz-progress/:quizId
Authorization: Student

Response: 200
{
  "success": true,
  "data": { QuizProgress object }
}
```

#### 4. Get All My Quiz Progress
```
GET /api/quiz-progress
Authorization: Student

Query Parameters:
- courseId: string (filter by course)
- enrollmentStatus: "not_started|in_progress|passed|failed"
- isPassed: "true|false"
- limit: number (default 10)
- skip: number (default 0)

Response: 200
{
  "success": true,
  "data": {
    "data": [QuizProgress objects],
    "total": 15,
    "limit": 10,
    "skip": 0,
    "pages": 2
  }
}
```

#### 5. Get Quiz Progress by ID
```
GET /api/quiz-progress/id/:progressId
Authorization: Student

Response: 200
{
  "success": true,
  "data": { QuizProgress object }
}
```

#### 6. Get Quiz-level Progress (Instructor View)
```
GET /api/quiz-progress/quiz/:quizId/all
Authorization: Instructor

Query Parameters:
- isPassed: "true|false"
- limit: number (default 10)
- skip: number (default 0)

Response: 200
{
  "success": true,
  "data": {
    "data": [QuizProgress objects],
    "total": 100,
    "limit": 10,
    "skip": 0,
    "pages": 10
  }
}
```

#### 7. Get Quiz Performance Statistics
```
GET /api/quiz-progress/:quizId/stats
Authorization: Instructor

Response: 200
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

#### 8. Get All Quiz Progress for a Course
```
GET /api/quiz-progress/course/:courseId/all
Authorization: Instructor

Query Parameters:
- limit: number (default 10)
- skip: number (default 0)

Response: 200
{
  "success": true,
  "data": {
    "data": [QuizProgress objects],
    "total": 200,
    "limit": 10,
    "skip": 0,
    "pages": 20
  }
}
```

---

### UPDATE Endpoints

#### 9. Update Quiz Progress (by Progress ID)
```
PATCH /api/quiz-progress/:progressId
Authorization: Student

Body:
{
  "enrollmentStatus": "in_progress",
  "totalAttempts": 1,
  "bestScore": 85,
  "latestScore": 85,
  "isPassed": true
}

Response: 200
{
  "success": true,
  "data": { Updated QuizProgress object }
}
```

#### 10. Update User-Quiz Progress
```
PATCH /api/quiz-progress/:quizId/user
Authorization: Student

Body: (same as above)

Response: 200
{
  "success": true,
  "data": { Updated QuizProgress object }
}
```

#### 11. Update Quiz Progress with Attempt Data
```
PATCH /api/quiz-progress/:quizId/attempt
Authorization: Student

Body:
{
  "score": 85,
  "totalPoints": 100,
  "duration": 1200,
  "attemptId": "attemptId",
  "answers": [
    { "questionId": "q1", "answer": "A", "isCorrect": true }
  ]
}

Response: 200
{
  "success": true,
  "data": {
    "totalAttempts": 2,
    "latestScore": 85,
    "bestScore": 90,
    "isPassed": true,
    "enrollmentStatus": "passed"
  }
}
```

#### 12. Mark Quiz as Passed
```
PATCH /api/quiz-progress/:quizId/pass
Authorization: Student

Body: {} (empty)

Response: 200
{
  "success": true,
  "data": {
    "isPassed": true,
    "enrollmentStatus": "passed",
    "passedAt": "2024-05-25T10:30:00Z"
  }
}
```

#### 13. Reset Quiz Progress
```
PATCH /api/quiz-progress/:quizId/reset
Authorization: Student

Body: {} (empty)

Response: 200
{
  "success": true,
  "message": "Quiz progress reset successfully",
  "data": { Reset QuizProgress object }
}
```

---

### DELETE Endpoints

#### 14. Delete Quiz Progress (by ID)
```
DELETE /api/quiz-progress/:progressId
Authorization: Student

Response: 200
{
  "success": true,
  "message": "Quiz progress deleted successfully",
  "data": { Deleted QuizProgress object }
}
```

#### 15. Delete User-Quiz Progress
```
DELETE /api/quiz-progress/:quizId/user
Authorization: Student

Response: 200
{
  "success": true,
  "message": "Quiz progress deleted successfully",
  "data": { Deleted QuizProgress object }
}
```

---

## Usage Examples

### Scenario 1: Student Starting a Course
```javascript
// 1. Create course progress when enrolling
POST /api/course-progress
{
  "courseId": "course123",
  "progressData": {
    "enrollmentStatus": "enrolled"
  }
}

// 2. Update as student progresses
PATCH /api/course-progress/course123/user
{
  "currentModule": "module1",
  "currentLesson": "lesson1",
  "completionPercent": 10
}
```

### Scenario 2: Student Taking a Quiz
```javascript
// 1. Create quiz progress when starting quiz
POST /api/quiz-progress
{
  "courseId": "course123",
  "quizId": "quiz1"
}

// 2. After attempting quiz, update with attempt data
PATCH /api/quiz-progress/quiz1/attempt
{
  "score": 85,
  "totalPoints": 100,
  "duration": 1200,
  "attemptId": "attempt123",
  "answers": [...]
}

// Result will include:
// - Total attempts incremented
// - Best/latest scores updated
// - Passed status determined
// - Time tracking updated
```

### Scenario 3: Instructor Viewing Course Analytics
```javascript
// Get overall course statistics
GET /api/course-progress/course123/stats
// Returns: total enrolled, completed, dropped, average completion %

// Get all student progress in course
GET /api/course-progress/course123/all?limit=20&skip=0
// Returns paginated list of all students' progress

// Get quiz performance statistics
GET /api/quiz-progress/quiz1/stats
// Returns: students passed, failed, avg scores, etc.
```

---

## Error Responses

### Common Errors

**400 Bad Request**
```json
{
  "success": false,
  "message": "Course ID is required"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Course progress not found"
}
```

**409 Conflict**
```json
{
  "success": false,
  "message": "Course progress already exists for this user"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Database error message"
}
```

---

## Key Features

### Course Progress
- Track enrollment status (enrolled, completed, dropped)
- Monitor lesson-by-lesson progress
- Calculate overall completion percentage
- Track watched time for each lesson
- Support quiz gates at video timestamps
- Bulk operations for instructors

### Quiz Progress
- Track quiz attempts (passed/failed)
- Record best and latest scores
- Calculate pass percentage and statistics
- Track time spent on quizzes
- Store attempt answers for review
- Support multiple attempts with attempt tracking

### Analytics
- Course-level completion statistics
- Quiz-level performance metrics
- Student progress comparison
- Pass rate calculations
- Time tracking and analysis

---

## Authorization

- **Student**: Can only access their own progress
- **Instructor**: Can view all student progress for their courses, perform bulk operations
- **Admin**: Full access to all progress records

---

## Best Practices

1. **Create progress on enrollment**: Create both course and quiz progress when user enrolls
2. **Update frequently**: Update progress as students interact with content
3. **Track attempts**: Always log quiz attempts with full data
4. **Use bulk operations**: For enrolling multiple students in courses
5. **Monitor analytics**: Regularly check statistics to identify struggling students
6. **Reset carefully**: Only reset progress when explicitly requested (can lose data)
