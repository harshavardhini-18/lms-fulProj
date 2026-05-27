# 🎯 API Testing - Complete Index

## 📚 Testing Resources Available

You have **5 comprehensive testing guides** to choose from:

### 1. **API_TESTING_GUIDE.md** ⭐ START HERE
**Best for:** Complete detailed testing reference  
**Contains:**
- All 30 endpoints with full details
- HTTP method, URL, headers, body, response for each
- Complete curl commands (copy-paste ready)
- Error responses
- Complete workflow examples

**Quick Link Format:**
```
Test Name
├─ HTTP Method: POST/GET/PATCH/DELETE
├─ URL: http://localhost:5000/api/...
├─ Headers: Authorization, Content-Type
├─ Body: JSON structure
└─ Response: Expected result
```

---

### 2. **QUICK_TEST_COMMANDS.md** ⚡ FASTEST
**Best for:** Quick copy-paste commands  
**Contains:**
- 10 most important commands ready to copy
- Setup instructions (get JWT token)
- Instructor commands
- Key ID values to replace
- Testing workflow examples

**Usage:** Copy entire command block and paste in terminal

---

### 3. **VISUAL_API_REFERENCE.md** 📊 BEST OVERVIEW
**Best for:** Visual understanding  
**Contains:**
- All 30 endpoints in table format
- Most important endpoints highlighted
- Complete student journey visualization
- Instructor monitoring workflow
- Quiz attempt workflow
- Progress status diagrams

**Usage:** Reference tables to understand all endpoints at once

---

### 4. **COURSE_QUIZ_PROGRESS_API.md** 📖 MOST DETAILED
**Best for:** Deep technical documentation  
**Contains:**
- Complete schema documentation
- All fields explained
- 30 endpoint documentation
- Usage scenarios
- Best practices
- Error handling

**Usage:** Complete reference for understanding everything

---

### 5. **postman-collection.json** 🔧 FOR POSTMAN
**Best for:** Using Postman application  
**Contains:**
- Ready-to-import Postman collection
- All 30 endpoints pre-configured
- Pre-set environment variables
- Organized in folders

**How to use:**
1. Download `postman-collection.json`
2. Open Postman
3. Click "Import"
4. Select the JSON file
5. Set variables (token, courseId, quizId)
6. Start testing

---

## 🚀 Quick Start - 5 Minutes

### Step 1: Get Authentication Token
Use this command in terminal:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

Copy the token from response.

### Step 2: Test Creating Course Progress
```bash
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "607f1f77bcf86cd799439011"
  }'
```

### Step 3: Test Getting Your Progress
```bash
curl -X GET http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 4: Test Submitting Quiz (Most Important)
```bash
curl -X PATCH http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "totalPoints": 100,
    "duration": 1200,
    "attemptId": "attempt_001"
  }'
```

That's it! You've tested the 4 most important operations.

---

## 📋 All 30 Endpoints Quick Reference

### COURSE PROGRESS (15)
```
CREATE (2):
  POST   /api/course-progress
  POST   /api/course-progress/bulk

READ (5):
  GET    /api/course-progress/:courseId
  GET    /api/course-progress
  GET    /api/course-progress/id/:progressId
  GET    /api/course-progress/course/:courseId/all (instructor)
  GET    /api/course-progress/:courseId/stats (instructor)

UPDATE (6):
  PATCH  /api/course-progress/:progressId
  PATCH  /api/course-progress/:courseId/user
  PATCH  /api/course-progress/:courseId/complete
  PATCH  /api/course-progress/:courseId/lesson/:lessonId
  PATCH  /api/course-progress/bulk/completion (instructor)
  PATCH  /api/course-progress/:courseId/reset

DELETE (2):
  DELETE /api/course-progress/:progressId
  DELETE /api/course-progress/:courseId/user
```

### QUIZ PROGRESS (15)
```
CREATE (2):
  POST   /api/quiz-progress
  POST   /api/quiz-progress/bulk

READ (6):
  GET    /api/quiz-progress/:quizId
  GET    /api/quiz-progress
  GET    /api/quiz-progress/id/:progressId
  GET    /api/quiz-progress/quiz/:quizId/all (instructor)
  GET    /api/quiz-progress/:quizId/stats (instructor)
  GET    /api/quiz-progress/course/:courseId/all (instructor)

UPDATE (5):
  PATCH  /api/quiz-progress/:progressId
  PATCH  /api/quiz-progress/:quizId/user
  PATCH  /api/quiz-progress/:quizId/attempt (⭐ AUTO-CALCULATES)
  PATCH  /api/quiz-progress/:quizId/pass
  PATCH  /api/quiz-progress/:quizId/reset

DELETE (2):
  DELETE /api/quiz-progress/:progressId
  DELETE /api/quiz-progress/:quizId/user
```

---

## 🎓 Usage by Role

### Student
**Most Important:**
1. `POST /api/course-progress` - Enroll
2. `PATCH /api/course-progress/:courseId/user` - Track learning
3. `POST /api/quiz-progress` - Start quiz
4. `PATCH /api/quiz-progress/:quizId/attempt` - Submit quiz
5. `GET /api/course-progress` - Check progress

**Typical Flow:**
```
Enroll → Update (many times) → Take Quiz → Complete
```

### Instructor
**Most Important:**
1. `POST /api/course-progress/bulk` - Enroll students
2. `GET /api/course-progress/:courseId/stats` - Course stats
3. `GET /api/quiz-progress/:quizId/stats` - Quiz stats
4. `GET /api/course-progress/course/:courseId/all` - See students
5. `GET /api/quiz-progress/quiz/:quizId/all` - See quiz results

**Typical Flow:**
```
Bulk Enroll → Monitor Stats → Review Results
```

---

## 🔑 Key Points to Remember

### Headers (Required for ALL requests except login)
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### Most Important Endpoint
```
PATCH /api/quiz-progress/:quizId/attempt

This endpoint automatically:
✅ Calculates percentage score
✅ Determines if passed (>= passingScore)
✅ Updates attempt count
✅ Updates best/latest scores
✅ Sets enrollment status (passed/failed)
✅ Records timestamps
✅ Tracks time spent
```

### Status Codes
```
201 = Created (POST successful)
200 = Success (GET, PATCH, DELETE successful)
400 = Bad Request (missing fields)
401 = Unauthorized (no token)
404 = Not Found (doesn't exist)
409 = Conflict (duplicate)
500 = Server Error
```

---

## 🎯 Testing Scenarios

### Scenario 1: Student Learning Path
```
1. Enroll in course
   POST /api/course-progress

2. Watch video 1
   PATCH /api/course-progress/:courseId/user
   { lastWatchedTime: 600, completionPercent: 10 }

3. Watch video 2
   PATCH /api/course-progress/:courseId/user
   { lastWatchedTime: 1200, completionPercent: 25 }

4. Take quiz (fail)
   POST /api/quiz-progress
   PATCH /api/quiz-progress/:quizId/attempt
   { score: 60, totalPoints: 100 }

5. Retry quiz (pass)
   PATCH /api/quiz-progress/:quizId/attempt
   { score: 85, totalPoints: 100 }

6. Complete course
   PATCH /api/course-progress/:courseId/complete
```

### Scenario 2: Instructor Monitoring
```
1. Enroll 50 students
   POST /api/course-progress/bulk
   { courseId, userIds: [...] }

2. Check course stats
   GET /api/course-progress/:courseId/stats
   → See: enrolled, completed, avg%

3. Check quiz stats
   GET /api/quiz-progress/:quizId/stats
   → See: pass rate, avg scores

4. View all students
   GET /api/course-progress/course/:courseId/all
   → See each student's progress

5. Update struggling students
   PATCH /api/course-progress/bulk/completion
   { updates: [{userId, completionPercent}, ...] }
```

---

## 🛠️ Testing with Different Tools

### Tool 1: cURL (Terminal)
**Best for:** Quick testing, automation
```bash
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"id"}'
```

### Tool 2: Postman
**Best for:** Visual testing, team collaboration
- Import `postman-collection.json`
- Set variables
- Click "Send"
- See response

### Tool 3: Thunder Client (VS Code)
**Best for:** Built into editor
- Use same format as Postman
- Click "Send"
- See response

### Tool 4: JavaScript/Fetch
**Best for:** Frontend integration
```javascript
const res = await fetch('/api/course-progress', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ courseId })
});
```

---

## 📞 Troubleshooting

### Error: "No authentication token provided"
- Add `Authorization: Bearer TOKEN` header

### Error: "Course progress not found"
- Check courseId is correct
- Verify course exists in database

### Error: "Course progress already exists"
- You're already enrolled
- Delete it first if retesting

### Error: "Invalid MongoDB ObjectId"
- Course/Quiz ID must be valid ObjectId
- Copy from database

### Server not responding
- Check server is running: `npm start`
- Check port 5000 is available

---

## 📊 Expected Responses

### Create Success (201)
```json
{
  "success": true,
  "data": { /* Created object */ }
}
```

### Get Success (200)
```json
{
  "success": true,
  "data": { /* Object or array */ }
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## ✅ Complete Testing Checklist

### Course Progress
- [ ] Create single progress
- [ ] Create bulk progress
- [ ] Get my progress
- [ ] Get all my courses
- [ ] Get by ID
- [ ] Get course-level (instructor)
- [ ] Get statistics (instructor)
- [ ] Update by ID
- [ ] Update my progress
- [ ] Mark completed
- [ ] Update lesson
- [ ] Bulk update (instructor)
- [ ] Reset progress
- [ ] Delete by ID
- [ ] Delete my progress

### Quiz Progress
- [ ] Create single progress
- [ ] Create bulk progress
- [ ] Get my progress
- [ ] Get all my quizzes
- [ ] Get by ID
- [ ] Get quiz-level (instructor)
- [ ] Get statistics (instructor)
- [ ] Get course quizzes (instructor)
- [ ] Update by ID
- [ ] Update my progress
- [ ] Submit attempt (passed)
- [ ] Submit attempt (failed)
- [ ] Mark passed
- [ ] Reset progress
- [ ] Delete by ID
- [ ] Delete my progress

---

## 🎁 Bonus: Ready-to-Use Requests

### Request 1: Authentication
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

### Request 2: Create Course
```
POST http://localhost:5000/api/course-progress
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "courseId": "607f1f77bcf86cd799439011"
}
```

### Request 3: Submit Quiz
```
PATCH http://localhost:5000/api/quiz-progress/607f1f77bcf86cd799439020/attempt
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "score": 85,
  "totalPoints": 100,
  "duration": 1200,
  "attemptId": "attempt_001"
}
```

### Request 4: Get My Progress
```
GET http://localhost:5000/api/course-progress
Authorization: Bearer TOKEN
```

### Request 5: Get Course Stats
```
GET http://localhost:5000/api/course-progress/607f1f77bcf86cd799439011/stats
Authorization: Bearer TOKEN
```

---

## 🎯 Next Steps

1. **Start with:** `QUICK_TEST_COMMANDS.md`
2. **Reference:** `VISUAL_API_REFERENCE.md`
3. **Deep dive:** `COURSE_QUIZ_PROGRESS_API.md`
4. **Use Postman:** Import `postman-collection.json`
5. **Test scenarios:** Use examples from `API_TESTING_GUIDE.md`

---

## 📞 Summary

You have everything needed to test all 30 APIs:
- ✅ Detailed endpoint documentation
- ✅ Copy-paste ready curl commands
- ✅ Postman collection for visual testing
- ✅ Complete workflow examples
- ✅ Troubleshooting guide
- ✅ Error handling guide

**Get started now!** Pick any testing guide above and begin testing.

---

## 🎉 Happy Testing!

Choose your preferred testing guide and start:
1. Get JWT token (login)
2. Copy first test command
3. Paste in terminal/Postman
4. See response
5. Continue with next test

All 30 endpoints are working and ready to test!
