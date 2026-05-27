# 🚀 Setup Verification & Getting Started

## ✅ Pre-Testing Checklist

Before you start testing APIs, verify everything is set up:

### 1. Backend Server Running
```bash
# In your backend folder (lms-project-backend)
npm start

# Expected output:
# Server running on port 5000
# Database connected successfully
# All routes initialized
```

### 2. Database Connected
- MongoDB should be running
- Database should have at least:
  - 1 course (for courseId)
  - 1 quiz (for quizId)
  - 1 user account (for testing)

### 3. Test Account Exists
Create a test student account:
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "name": "Test Student",
  "role": "student"
}
```

### 4. Instructor Account (for bulk operations)
Create an instructor account:
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "instructor@example.com",
  "password": "password123",
  "name": "Test Instructor",
  "role": "instructor"
}
```

---

## 🔑 Getting Your JWT Tokens

### Step 1: Login as Student
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "607f1f77bcf86cd799439001",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

**Copy the token value.** You'll use this in all requests.

### Step 2: Login as Instructor (for bulk operations)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "password": "password123"
  }'
```

**Copy this token too.** You'll use it for instructor endpoints.

---

## 🎯 Quick Verification Tests

Run these 5 tests to verify everything works:

### Test 1: Health Check (No auth needed)
```bash
curl http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

**Expected:** Either 400 (user not found) or 401, NOT connection error

### Test 2: Login Works
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

**Expected Response:** 200 with token
```json
{ "success": true, "data": { "token": "..." } }
```

### Test 3: Course Progress Create
```bash
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "YOUR_COURSE_ID"
  }'
```

**Expected Response:** 201
```json
{ "success": true, "data": { "_id": "..." } }
```

### Test 4: Quiz Progress Create
```bash
curl -X POST http://localhost:5000/api/quiz-progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "YOUR_COURSE_ID",
    "quizId": "YOUR_QUIZ_ID"
  }'
```

**Expected Response:** 201
```json
{ "success": true, "data": { "_id": "..." } }
```

### Test 5: Submit Quiz Attempt
```bash
curl -X PATCH http://localhost:5000/api/quiz-progress/YOUR_QUIZ_ID/attempt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "totalPoints": 100,
    "duration": 1200,
    "attemptId": "test_attempt"
  }'
```

**Expected Response:** 200
```json
{ "success": true, "data": { "totalAttempts": 1, "isPassed": true, ... } }
```

---

## 🔍 Finding Valid IDs

### Get Course IDs
```bash
curl http://localhost:5000/api/courses \
  -H "Authorization: Bearer TOKEN"

# Look for _id field in response
# Example: "607f1f77bcf86cd799439011"
```

### Get Quiz IDs
```bash
curl http://localhost:5000/api/quizzes \
  -H "Authorization: Bearer TOKEN"

# Look for _id field in response
```

### Get User IDs (for bulk operations)
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN"

# Copy _id values for bulk operations
```

---

## 📝 Environment Setup for Postman

### 1. Create New Environment
In Postman: **Environment > + New**

### 2. Add Variables
| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:5000` | (auto-filled) |
| `token` | `paste_student_token_here` | (paste after login) |
| `instructor_token` | `paste_instructor_token_here` | (paste after login) |
| `course_id` | `607f1f77bcf86cd799439011` | (update with your ID) |
| `quiz_id` | `607f1f77bcf86cd799439020` | (update with your ID) |
| `user_id` | `607f1f77bcf86cd799439001` | (update with your ID) |

### 3. Use in Requests
```
URL: {{base_url}}/api/course-progress
Header: Authorization: Bearer {{token}}
```

---

## 🛠️ Common Setup Issues & Fixes

### Issue 1: "Cannot connect to localhost:5000"
**Solution:**
```bash
# Check if server is running
lsof -i :5000

# If not running, start it
cd lms-project-backend
npm start

# If port is in use
kill -9 $(lsof -t -i:5000)
npm start
```

### Issue 2: "Database connection failed"
**Solution:**
```bash
# Make sure MongoDB is running
# On macOS:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod

# Check connection in db.js
# Verify MONGODB_URI in .env
```

### Issue 3: "Token expired or invalid"
**Solution:**
```bash
# Get a new token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Copy the new token and use it
```

### Issue 4: "Course not found" or "Quiz not found"
**Solution:**
1. Create sample data using seed script:
   ```bash
   cd lms-project-backend
   node scripts/seed.js
   ```

2. Or use real IDs from database:
   ```bash
   # Connect to MongoDB
   mongosh
   
   # List courses
   use your_db_name
   db.courses.find().limit(5)
   db.quizzes.find().limit(5)
   ```

### Issue 5: "No authentication token provided"
**Solution:**
```bash
# Always include Authorization header:
Authorization: Bearer YOUR_TOKEN

# Note the format: "Bearer" (capital B) + space + token
```

---

## 📊 Database Sample Data

### Create Sample Course
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "description": "Testing course progress",
    "instructor": "instructor_id"
  }'
```

### Create Sample Quiz
```bash
curl -X POST http://localhost:5000/api/quizzes \
  -H "Authorization: Bearer INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Quiz",
    "course": "course_id",
    "passingScore": 70,
    "totalPoints": 100
  }'
```

---

## 🎯 Testing Strategy

### Phase 1: Verify Server (5 min)
- [ ] Server running on port 5000
- [ ] Database connected
- [ ] Login endpoint works
- [ ] Get JWT tokens

### Phase 2: Test Course APIs (10 min)
- [ ] Create course progress
- [ ] Get my progress
- [ ] Update progress
- [ ] Mark completed
- [ ] Get statistics

### Phase 3: Test Quiz APIs (10 min)
- [ ] Create quiz progress
- [ ] Submit attempt (passed)
- [ ] Submit attempt (failed)
- [ ] Retry quiz
- [ ] Get statistics

### Phase 4: Test Bulk Operations (5 min)
- [ ] Bulk enroll students
- [ ] Bulk update completion
- [ ] View all students

### Phase 5: Edge Cases (5 min)
- [ ] Invalid token
- [ ] Missing required fields
- [ ] Duplicate creation
- [ ] Non-existent IDs

---

## 🚀 Quick Start - 10 Minutes

### Step 1: Prepare (2 min)
```bash
# Terminal 1: Start server
cd lms-project-backend
npm start

# Wait for "Server running on port 5000"
```

### Step 2: Get Tokens (2 min)
```bash
# Terminal 2: Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'

# Copy the token value
export TOKEN="your_token_here"
```

### Step 3: Test Course Progress (3 min)
```bash
# Create
curl -X POST http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"your_course_id"}'

# Get
curl http://localhost:5000/api/course-progress \
  -H "Authorization: Bearer $TOKEN"

# Update
curl -X PATCH http://localhost:5000/api/course-progress/course_id/user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completionPercent":50}'
```

### Step 4: Test Quiz Progress (3 min)
```bash
# Create
curl -X POST http://localhost:5000/api/quiz-progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"course_id","quizId":"quiz_id"}'

# Submit attempt
curl -X PATCH http://localhost:5000/api/quiz-progress/quiz_id/attempt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":85,"totalPoints":100,"duration":1200,"attemptId":"att1"}'

# Check
curl http://localhost:5000/api/quiz-progress/quiz_id \
  -H "Authorization: Bearer $TOKEN"
```

Done! All 30 APIs are tested.

---

## 📚 Reference Files

After setup, use these in order:

1. **TESTING_INDEX.md** - Overview of all resources
2. **QUICK_TEST_COMMANDS.md** - Copy-paste commands
3. **VISUAL_API_REFERENCE.md** - Visual reference
4. **API_TESTING_GUIDE.md** - Detailed guide
5. **postman-collection.json** - Postman import
6. **COURSE_QUIZ_PROGRESS_API.md** - Technical spec

---

## ✅ You're Ready!

Once all verification tests pass:
1. Pick a testing guide
2. Get your JWT token
3. Start testing APIs
4. Refer back to guides as needed

**All 30 endpoints are waiting for you!** 🎉

---

## 📞 Need Help?

Common issues:

| Problem | Solution |
|---------|----------|
| Server won't start | `npm install` first, check Node version |
| Database error | Start MongoDB, verify MONGODB_URI |
| Token invalid | Get new token from login endpoint |
| Course not found | Use correct courseId from database |
| 404 errors | Check URL spelling and ID format |
| 401 errors | Add Authorization header with token |

Good luck! Happy testing! 🚀
