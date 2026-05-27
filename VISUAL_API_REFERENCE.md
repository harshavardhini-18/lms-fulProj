# Visual API Testing Reference

## 📌 All 30 Endpoints at a Glance

### COURSE PROGRESS (15 Endpoints)

#### CREATE
| # | Method | URL | Headers | Body | Purpose |
|---|--------|-----|---------|------|---------|
| 1 | POST | `/api/course-progress` | `Authorization: Bearer TOKEN` | courseId, progressData | Create enrollment |
| 2 | POST | `/api/course-progress/bulk` | `Authorization: Bearer INST_TOKEN` | courseId, userIds[] | Bulk enroll |

#### READ
| # | Method | URL | Query | Purpose |
|---|--------|-----|-------|---------|
| 3 | GET | `/api/course-progress/:courseId` | - | Get my course progress |
| 4 | GET | `/api/course-progress` | limit, skip, enrollmentStatus | Get all my courses |
| 5 | GET | `/api/course-progress/id/:progressId` | - | Get by progress ID |
| 6 | GET | `/api/course-progress/course/:courseId/all` | limit, skip, enrollmentStatus | Get all students (instructor) |
| 7 | GET | `/api/course-progress/:courseId/stats` | - | Get statistics (instructor) |

#### UPDATE
| # | Method | URL | Body | Purpose |
|---|--------|-----|------|---------|
| 8 | PATCH | `/api/course-progress/:progressId` | currentLesson, completionPercent, lastWatchedTime | Update by ID |
| 9 | PATCH | `/api/course-progress/:courseId/user` | currentModule, currentLesson, completionPercent | Update my progress |
| 10 | PATCH | `/api/course-progress/:courseId/complete` | {} | Mark completed |
| 11 | PATCH | `/api/course-progress/:courseId/lesson/:lessonId` | lesson, module, isCompleted | Update lesson |
| 12 | PATCH | `/api/course-progress/bulk/completion` | courseId, updates[] | Bulk update (instructor) |
| 13 | PATCH | `/api/course-progress/:courseId/reset` | {} | Reset progress |

#### DELETE
| # | Method | URL | Purpose |
|---|--------|-----|---------|
| 14 | DELETE | `/api/course-progress/:progressId` | Delete by ID |
| 15 | DELETE | `/api/course-progress/:courseId/user` | Delete my progress |

---

### QUIZ PROGRESS (15 Endpoints)

#### CREATE
| # | Method | URL | Headers | Body | Purpose |
|---|--------|-----|---------|------|---------|
| 1 | POST | `/api/quiz-progress` | `Bearer TOKEN` | courseId, quizId | Create quiz progress |
| 2 | POST | `/api/quiz-progress/bulk` | `Bearer INST_TOKEN` | courseId, quizId, userIds[] | Bulk create |

#### READ
| # | Method | URL | Query | Purpose |
|---|--------|-----|-------|---------|
| 3 | GET | `/api/quiz-progress/:quizId` | - | Get my quiz progress |
| 4 | GET | `/api/quiz-progress` | limit, skip, isPassed, courseId | Get all my quizzes |
| 5 | GET | `/api/quiz-progress/id/:progressId` | - | Get by ID |
| 6 | GET | `/api/quiz-progress/quiz/:quizId/all` | limit, skip, isPassed | Get quiz-level (instructor) |
| 7 | GET | `/api/quiz-progress/:quizId/stats` | - | Get statistics (instructor) |
| 8 | GET | `/api/quiz-progress/course/:courseId/all` | limit, skip | Get all course quizzes (instructor) |

#### UPDATE
| # | Method | URL | Body | Purpose |
|---|--------|-----|------|---------|
| 9 | PATCH | `/api/quiz-progress/:progressId` | enrollmentStatus, notes | Update by ID |
| 10 | PATCH | `/api/quiz-progress/:quizId/user` | enrollmentStatus, totalAttempts | Update my quiz |
| 11 | PATCH | `/api/quiz-progress/:quizId/attempt` | ⭐ score, totalPoints, duration, attemptId, answers | ⭐ **AUTO-CALCULATES SCORES** |
| 12 | PATCH | `/api/quiz-progress/:quizId/pass` | {} | Mark passed |
| 13 | PATCH | `/api/quiz-progress/:quizId/reset` | {} | Reset progress |

#### DELETE
| # | Method | URL | Purpose |
|---|--------|-----|---------|
| 14 | DELETE | `/api/quiz-progress/:progressId` | Delete by ID |
| 15 | DELETE | `/api/quiz-progress/:quizId/user` | Delete my quiz |

---

## 🎯 Most Important Endpoints

### For Students Learning

```
1. Start Course
   POST /api/course-progress
   
2. Track Learning (call while watching)
   PATCH /api/course-progress/:courseId/user
   
3. Complete Course
   PATCH /api/course-progress/:courseId/complete
```

### For Students Taking Quizzes

```
1. Create Quiz Progress
   POST /api/quiz-progress
   
2. Submit Attempt ⭐ (AUTO-CALCULATES EVERYTHING)
   PATCH /api/quiz-progress/:quizId/attempt
   
   System automatically:
   ✅ Calculates percentage
   ✅ Determines if passed
   ✅ Updates attempt count
   ✅ Tracks best/latest scores
   ✅ Sets pass status
```

### For Instructors Monitoring

```
1. Enroll Students
   POST /api/course-progress/bulk
   
2. View Course Stats
   GET /api/course-progress/:courseId/stats
   
3. View Quiz Stats
   GET /api/quiz-progress/:quizId/stats
```

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 201 | Created | POST successful |
| 200 | Success | GET, PATCH, DELETE successful |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | No token or invalid token |
| 404 | Not Found | Record doesn't exist |
| 409 | Conflict | Duplicate creation attempt |
| 500 | Server Error | Database error |

---

## 🔐 Authentication Header

ALL requests need this header (except login):
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

Get token from login:
```
POST http://localhost:5000/api/auth/login
Body: { "email": "student@example.com", "password": "pass123" }
```

---

## 📋 Request/Response Examples

### Example 1: Create Course Progress
```
REQUEST:
POST http://localhost:5000/api/course-progress
Authorization: Bearer TOKEN
Content-Type: application/json
{
  "courseId": "607f1f77bcf86cd799439011"
}

RESPONSE (201):
{
  "success": true,
  "data": {
    "_id": "665d4c3e8f9d1a2b3c4d5e6f",
    "user": "current_user_id",
    "course": "607f1f77bcf86cd799439011",
    "enrollmentStatus": "enrolled",
    "completionPercent": 0,
    "createdAt": "2024-05-25T10:30:00Z"
  }
}
```

### Example 2: Update Progress While Learning
```
REQUEST:
PATCH http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/user
Authorization: Bearer TOKEN
Content-Type: application/json
{
  "currentLesson": "lesson123",
  "lastWatchedTime": 3600,
  "completionPercent": 45
}

RESPONSE (200):
{
  "success": true,
  "data": {
    "currentLesson": "lesson123",
    "lastWatchedTime": 3600,
    "completionPercent": 45,
    "updatedAt": "2024-05-25T11:00:00Z"
  }
}
```

### Example 3: Submit Quiz (MOST IMPORTANT)
```
REQUEST:
PATCH http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt
Authorization: Bearer TOKEN
Content-Type: application/json
{
  "score": 85,
  "totalPoints": 100,
  "duration": 1200,
  "attemptId": "attempt_001",
  "answers": [
    { "questionId": "q1", "answer": "A", "isCorrect": true },
    { "questionId": "q2", "answer": "B", "isCorrect": true }
  ]
}

RESPONSE (200):
{
  "success": true,
  "data": {
    "totalAttempts": 1,           ← Incremented
    "bestScore": 85,               ← Calculated
    "latestScore": 85,             ← Calculated
    "isPassed": true,              ← Auto-determined (85 >= 70)
    "enrollmentStatus": "passed",  ← Updated
    "attemptsPassed": 1,           ← Incremented
    "totalTimeSpent": 1200,        ← Tracked
    "lastAttemptAt": "2024-05-25T11:30:00Z"
  }
}
```

---

## 🔄 Quiz Attempt Workflow

### First Attempt (Failed)
```
Score: 60/100 (60%)

Request:
{
  "score": 60,
  "totalPoints": 100,
  "duration": 900,
  "attemptId": "attempt_1"
}

Response:
{
  "totalAttempts": 1,
  "bestScore": 60,
  "isPassed": false,           ← Not passed (60 < 70)
  "enrollmentStatus": "failed",
  "attemptsFailed": 1
}
```

### Second Attempt (Passed)
```
Score: 85/100 (85%)

Request:
{
  "score": 85,
  "totalPoints": 100,
  "duration": 800,
  "attemptId": "attempt_2"
}

Response:
{
  "totalAttempts": 2,          ← Incremented to 2
  "bestScore": 85,             ← Updated (85 > 60)
  "latestScore": 85,
  "isPassed": true,            ← Passed (85 >= 70)
  "enrollmentStatus": "passed",
  "attemptsPassed": 1,
  "attemptsFailed": 1,
  "passedAt": "2024-05-25T12:00:00Z"  ← First pass time
}
```

---

## 📈 Progress Statuses

### Course Progress
```
enrollmentStatus:
├── enrolled     → Currently taking
├── completed    → Finished (100%)
└── dropped      → Withdrew

completionPercent: 0-100
```

### Quiz Progress
```
enrollmentStatus:
├── not_started  → Haven't started
├── in_progress  → Currently taking
├── passed       → Passed (>= passingScore)
└── failed       → Failed (< passingScore)

isPassed: true/false
```

---

## 🎓 Complete Student Journey

```
Day 1:
├─ POST /api/course-progress             → Enroll in course
├─ PATCH /api/course-progress/.../user   → Update progress (10%)
└─ PATCH /api/course-progress/.../user   → Update progress (20%)

Day 2:
├─ PATCH /api/course-progress/.../user   → Update progress (40%)
├─ PATCH /api/course-progress/.../user   → Update progress (60%)
├─ POST /api/quiz-progress               → Start quiz
└─ PATCH /api/quiz-progress/.../attempt  → Submit (score 60, failed)

Day 3:
├─ PATCH /api/course-progress/.../user   → Update progress (70%)
├─ PATCH /api/quiz-progress/.../attempt  → Retry (score 85, passed)
├─ PATCH /api/course-progress/.../user   → Update progress (85%)
├─ PATCH /api/course-progress/.../user   → Update progress (100%)
└─ PATCH /api/course-progress/.../complete → Mark completed

Result:
✅ Course: 100% completed
✅ Quiz: 2 attempts, 1 passed, best score 85
```

---

## 🏫 Instructor Monitoring

```
Monday:
├─ POST /api/course-progress/bulk                → Enroll 50 students
└─ GET /api/course-progress/course/.../all       → See all students

Wednesday:
├─ GET /api/course-progress/.../stats            → Check progress
│  → Enrolled: 50, Completed: 5, Avg: 35%
└─ GET /api/quiz-progress/quiz/.../stats         → Check quiz performance
   → Students: 50, Passed: 30, Avg: 72%

Friday:
├─ GET /api/quiz-progress/quiz/.../all           → See each student
└─ PATCH /api/course-progress/bulk/completion    → Update struggling students
```

---

## 🛠️ Testing Tools

### Option 1: cURL (Command Line)
```bash
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"course_id"}'
```

### Option 2: Postman (Recommended)
1. Import `postman-collection.json`
2. Set variables (token, courseId, quizId)
3. Click "Send" on each request

### Option 3: Thunder Client (VS Code)
1. Create requests in editor
2. Use same URL, method, headers
3. Test directly in VS Code

### Option 4: JavaScript/Frontend
```javascript
const response = await fetch('http://localhost:5000/api/course-progress', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    courseId: courseId,
    progressData: { enrollmentStatus: 'enrolled' }
  })
});
```

---

## ✅ Testing Checklist

### Course Progress
- [ ] Create progress
- [ ] Get my progress
- [ ] Update progress multiple times
- [ ] Mark as completed
- [ ] Get all my courses
- [ ] Get stats (instructor)
- [ ] Reset progress
- [ ] Delete progress

### Quiz Progress
- [ ] Create quiz progress
- [ ] Submit attempt (passed)
- [ ] Submit attempt (failed)
- [ ] Retry quiz
- [ ] Get my quizzes
- [ ] Get quiz stats (instructor)
- [ ] See attempt tracking
- [ ] Reset quiz

### Edge Cases
- [ ] Create duplicate (should fail)
- [ ] Update non-existent (should fail)
- [ ] Invalid courseId (should fail 404)
- [ ] No token (should fail 401)
- [ ] Score > 100 or < 0
- [ ] Passing score variations

---

## 🎯 Key Takeaways

1. **Always include Bearer token in Authorization header**
2. **Most important endpoint**: `/quiz-progress/:quizId/attempt` (auto-calculates)
3. **Student endpoints** - only access own data
4. **Instructor endpoints** - view all student data
5. **Query params** - use for filtering and pagination
6. **Empty body** - use `{}` for delete and reset
7. **All IDs** - must be valid MongoDB ObjectIds
8. **Status codes** - 201 for create, 200 for success, 4xx for errors

---

## 📞 Getting Help

If endpoint doesn't work:
1. Check Authorization header (copy token correctly)
2. Check Content-Type: application/json
3. Check IDs are valid (from database)
4. Check HTTP method (POST, GET, PATCH, DELETE)
5. Check URL path (typos?)
6. Check error response message

Common errors:
- **"Course ID is required"** → Add courseId to body
- **"Course progress not found"** → Wrong courseId
- **"Course progress already exists"** → Already enrolled
- **"No authentication token"** → Missing Bearer token
- **"Unauthorized"** → Invalid/expired token
