# Dashboard Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         StudentDashboardPage (Route Entry)           │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │           StudentDashboard (Container)               │  │
│  │     ┌──────────────────────────────────────────┐    │  │
│  │     │  useEffect: Fetch Data on Mount         │    │  │
│  │     │  - Get token from localStorage           │    │  │
│  │     │  - Call dashboardService.fetch()         │    │  │
│  │     └──────────────────────────────────────────┘    │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│        ┌──────────────┼──────────────┐                     │
│        │              │              │                     │
│  ┌─────▼──┐  ┌────────▼─────┐  ┌────▼────────────┐        │
│  │ Sidebar│  │  Navbar      │  │ Main Content    │        │
│  │        │  │              │  │                 │        │
│  │- Nav   │  │- Search      │  │ ┌─────────────┐ │        │
│  │- Menu  │  │- Filter      │  │ │Analytics    │ │        │
│  │- User  │  │- Semester    │  │ │Cards (4x)   │ │        │
│  │- Auth  │  │- Notif       │  │ └─────────────┘ │        │
│  └────────┘  └──────────────┘  │ ┌─────────────┐ │        │
│                                 │ │Continue     │ │        │
│                                 │ │Learning     │ │        │
│                                 │ └─────────────┘ │        │
│                                 │ ┌─────────────┐ │        │
│                                 │ │Analytics    │ │        │
│                                 │ │Section      │ │        │
│                                 │ └─────────────┘ │        │
│                                 │ ┌─────────────┐ │        │
│                                 │ │Quiz Widget  │ │        │
│                                 │ │Activity     │ │        │
│                                 │ │Timeline     │ │        │
│                                 │ └─────────────┘ │        │
│                                 │ ┌─────────────┐ │        │
│                                 │ │Progress     │ │        │
│                                 │ │Table        │ │        │
│                                 │ └─────────────┘ │        │
│                                 └─────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │
         ┌───────────────┼───────────────┐
         │               │               │
   ┌─────▼──────┐  ┌─────▼──────┐  ┌────▼─────────┐
   │dashboardS  │  │localStorage│  │localStorage  │
   │ervice.js   │  │- token     │  │- userId      │
   │            │  │- userId    │  │- email       │
   │- fetch()   │  │            │  │- role        │
   │- APIs      │  └────────────┘  └──────────────┘
   └─────┬──────┘
         │
         │ HTTP/Bearer Token
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              REST API Endpoints                      │  │
│  │                                                      │  │
│  │  GET /api/course-progress                           │  │
│  │  ├─ Returns: All user's course progress            │  │
│  │  └─ Used by: AnalyticsCards, ContinueLearning      │  │
│  │                                                      │  │
│  │  GET /api/course-progress/:courseId                │  │
│  │  ├─ Returns: Specific course progress              │  │
│  │  └─ Used by: ProgressTable                         │  │
│  │                                                      │  │
│  │  GET /api/quiz-progress                            │  │
│  │  ├─ Returns: All user's quiz progress              │  │
│  │  └─ Used by: QuizPerformanceWidget                 │  │
│  │                                                      │  │
│  │  GET /api/quiz-progress/:quizId                    │  │
│  │  ├─ Returns: Specific quiz progress                │  │
│  │  └─ Used by: AnalyticsSection                      │  │
│  │                                                      │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │ (authMiddleware)                    │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │           Controllers                                │  │
│  │  - courseProgressController.js                       │  │
│  │  - quizProgressController.js                         │  │
│  │  - studentQuizController.js                          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │           Database Service/Models                    │  │
│  │  - courseProgressService.js                          │  │
│  │  - progressSchemaService.js                          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   PostgreSQL Database         │
        │                               │
        │  Tables:                      │
        │  - course_progress            │
        │  - courses                    │
        │  - quiz_progress              │
        │  - quizzes                    │
        │  - quiz_attempts              │
        │  - quiz_attempt_answers       │
        │  - questions                  │
        │  - users                      │
        │                               │
        └───────────────────────────────┘
```

## 🔄 Data Flow

### 1. Dashboard Load Flow

```
User visits /student/dashboard
         │
         ▼
   StudentDashboard mounts
         │
         ▼
   useEffect fires
         │
         ▼
   Get token & userId from localStorage
         │
         ▼
   Call dashboardService.fetchStudentCourseProgress()
         │
         ▼
   HTTP GET /api/course-progress (with Bearer token)
         │
         ▼
   Backend fetches from PostgreSQL
         │
         ▼
   Response returned with aggregated data
         │
         ▼
   setDashboardData(data)
         │
         ▼
   Components re-render with data
         │
         ▼
   Dashboard displays:
   - AnalyticsCards
   - ContinueLearning
   - AnalyticsSection
   - QuizPerformanceWidget
   - ActivityTimeline
   - ProgressTable
```

### 2. Component Data Distribution

```
setDashboardData({
  enrolled_courses_count: 22,
  lessons_total: 45,
  lessons_completed: 28,
  quizzes_total: 12,
  quizzes_passed: 9,
  completion_percent: 62,
  courses: [...]
})
   │
   ├──► AnalyticsCards
   │    ├─ Shows: 22 enrolled (from enrolled_courses_count)
   │    ├─ Shows: 28/45 lessons (from lessons_completed/total)
   │    ├─ Shows: 9/12 quizzes (from quizzes_passed/total)
   │    └─ Shows: 62% completion (from completion_percent)
   │
   ├──► ContinueLearning
   │    ├─ Maps: courses array
   │    ├─ Shows: Progress, instructor, lessons/quizzes count
   │    └─ Fetches additional course data
   │
   ├──► AnalyticsSection
   │    ├─ Calculates: Weekly activity from last_watched_at
   │    ├─ Shows: Quiz performance charts
   │    └─ Displays: Lessons status breakdown
   │
   ├──► QuizPerformanceWidget
   │    ├─ Shows: 9/12 pass rate
   │    ├─ Shows: Subject performance ranking
   │    └─ Calculates: Strongest/weakest subject
   │
   ├──► ActivityTimeline
   │    ├─ Fetches: Recent activities
   │    └─ Displays: Timeline feed
   │
   └──► ProgressTable
        ├─ Maps: courses array
        ├─ Shows: Each course's progress
        └─ Displays: Completion bars
```

## 📊 Data Aggregation Logic

### Before: Database Tables (Raw)

```
course_progress table:
┌────┬────────┬────┬────┬────┬─────────────────┐
│id  │user_id │c_id│lc  │lt  │completion_pct   │
├────┼────────┼────┼────┼────┼─────────────────┤
│1   │1       │1   │8   │12  │65               │
│2   │1       │2   │6   │15  │45               │
│3   │1       │3   │20  │20  │100              │
└────┴────────┴────┴────┴────┴─────────────────┘

quiz_progress table:
┌────┬────────┬───────┬──────┬──────┐
│id  │user_id │quiz_id│passed│total │
├────┼────────┼───────┼──────┼──────┤
│1   │1       │1      │true  │      │
│2   │1       │2      │true  │      │
│3   │1       │3      │false │      │
│...
└────┴────────┴───────┴──────┴──────┘
```

### After: Dashboard Aggregation

```
Aggregate logic:
- Count distinct courses = 3 courses enrolled
- Sum all lessons_total = 47 lessons total
- Sum all lessons_completed = 34 lessons done
- Sum all quizzes = 12 quizzes total
- Count passed quizzes = 9 passed
- Avg completion_percent = 70%

Result:
{
  enrolled_courses_count: 3,
  lessons_total: 47,
  lessons_completed: 34,
  quizzes_total: 12,
  quizzes_passed: 9,
  completion_percent: 70
}
```

## 🔐 Authentication Flow

```
1. User logs in
   ├─ Token stored in localStorage
   └─ userId stored in localStorage

2. Dashboard loads
   ├─ Retrieves token from localStorage
   ├─ Retrieves userId from localStorage
   └─ Includes in Authorization header

3. Each API request
   Header: Authorization: Bearer {token}
   └─ Backend validates token
      ├─ If valid: Return data
      └─ If invalid: Return 401 Unauthorized

4. Dashboard handles response
   ├─ If error: Show error message
   └─ If success: Display data
```

## 📱 Responsive Layout Flow

```
Desktop (> 1024px)
┌───────────────────────────────────────────┐
│  Sidebar │ Navbar                          │
│          ├──────────────────────────────────┤
│   Nav    │  Analytics Cards (4 columns)    │
│          │  ┌─────────────────────┐        │
│   Menu   │  │ Continue Learning   │ Widget │
│          │  │ (2 cols)            │ (1 col)│
│          │  │                     │        │
│          │  │ Analytics Sec       │ Quiz   │
│          │  │ (2 cols)            │ (1 col)│
│          │  │                     │        │
│          │  │ Table (full width)  │        │
│          │  └─────────────────────┘        │
└───────────────────────────────────────────┘

Tablet (640px - 1024px)
┌──────────────────────────────┐
│ Menu│ Navbar                  │
├─────┼─────────────────────────┤
│     │ Analytics Cards (2x2)   │
│     │ Continue Learning       │
│     │ Quiz Widget             │
│     │ Analytics Section       │
│     │ Activity Timeline       │
│     │ Table (scrollable)      │
└─────┴─────────────────────────┘

Mobile (< 640px)
┌────────────────┐
│ Menu │ Navbar  │
├─────┴──────────┤
│ Analytics Cards│
│ (stacked)      │
│                │
│ Continue       │
│ Learning       │
│ (stacked)      │
│                │
│ Quiz Widget    │
│ Timeline       │
│ Analytics      │
│ Table          │
│ (scrollable)   │
└────────────────┘
```

## 🎯 Component Hierarchy

```
StudentDashboard (Root)
│
├── Layout Container
│   ├── Sidebar
│   │   ├── Logo
│   │   ├── User Profile
│   │   ├── Menu Items (8)
│   │   └── Bottom Actions
│   │
│   ├── Main Content
│   │   ├── Navbar
│   │   │   ├── Search
│   │   │   ├── Semester Selector
│   │   │   ├── Filter Button
│   │   │   ├── Notifications
│   │   │   └── User Quick Access
│   │   │
│   │   └── Dashboard Content Grid
│   │       ├── AnalyticsCards (4x)
│   │       │   ├── EnrolledCourses Card
│   │       │   ├── LessonProgress Card
│   │       │   ├── QuizPerformance Card
│   │       │   └── OverallCompletion Card
│   │       │
│   │       ├── Left Column (2/3 width)
│   │       │   ├── ContinueLearning
│   │       │   │   ├── Course Cards (3+)
│   │       │   │   └── View All Button
│   │       │   │
│   │       │   └── AnalyticsSection
│   │       │       ├── Weekly Activity Chart
│   │       │       ├── Quiz Performance Donut
│   │       │       └── Lessons Status
│   │       │
│   │       ├── Right Column (1/3 width)
│   │       │   ├── QuizPerformanceWidget
│   │       │   │   ├── Pass Rate Donut
│   │       │   │   ├── Subject Performance
│   │       │   │   └── Strongest/Weakest
│   │       │   │
│   │       │   └── ActivityTimeline
│   │       │       ├── Activity Items (5)
│   │       │       └── View All Button
│   │       │
│   │       └── ProgressTable
│   │           ├── Table Header
│   │           ├── Table Rows (5+)
│   │           │   ├── Course Name
│   │           │   ├── Status Badge
│   │           │   ├── Lessons Progress
│   │           │   ├── Quizzes Progress
│   │           │   ├── Completion Bar
│   │           │   ├── Last Activity
│   │           │   └── Actions
│   │           └── Table Footer
│   │
│   └── Loading/Error States
│       ├── Spinner (on load)
│       └── Error Message (on fail)
```

## 🔗 Service Layer

```
dashboardService.js
│
├── fetchStudentCourseProgress(token)
│   └─ GET /api/course-progress
│      Aggregates data for AnalyticsCards
│
├── fetchStudentCourses(token)
│   └─ GET /api/course-progress
│      Returns data for ContinueLearning
│
├── fetchQuizProgress(token)
│   └─ GET /api/quiz-progress
│      Returns data for QuizPerformanceWidget
│
├── fetchCourseProgress(courseId, token)
│   └─ GET /api/course-progress/:courseId
│      Returns specific course data
│
├── fetchRecentActivity(token, limit)
│   └─ GET /api/student/:userId/activities
│      Returns timeline data
│
└── fetchDashboardAnalytics(token)
    └─ GET /api/student/:userId/analytics
       Returns analytics data
```

## 💾 State Management

```
StudentDashboard State:
{
  dashboardData: {
    id: 1,
    user_id: 1,
    enrolled_courses_count: 22,
    lessons_total: 45,
    lessons_completed: 28,
    quizzes_total: 12,
    quizzes_passed: 9,
    completion_percent: 62,
    courses: [...]
  },
  loading: false,
  error: null,
  sidebarOpen: true
}
```

## 🎨 Styling Architecture

```
tailwind.config.js
│
├── Colors
│   ├── Indigo (Primary) → Buttons, highlights
│   ├── Emerald (Success) → Progress, passed
│   ├── Amber (Warning) → Pending, alerts
│   └── Slate (Neutral) → Text, backgrounds
│
├── Spacing
│   ├── xs: 8px
│   ├── sm: 12px
│   ├── md: 16px
│   ├── lg: 24px
│   └── xl: 32px
│
├── Shadows
│   ├── xs: Subtle
│   ├── sm: Light hover
│   ├── md: Card default
│   └── lg: Modal elevation
│
├── Animations
│   ├── fade-in: Component entrance
│   ├── slide-up: Content reveal
│   └── pulse-slow: Attention
│
└── Responsive
    ├── sm: 640px
    ├── md: 768px
    ├── lg: 1024px
    └── xl: 1280px
```

---

## Summary

The dashboard uses a **Client-Server Architecture** with:
- **Frontend:** React components with Tailwind CSS
- **Backend:** Express.js with PostgreSQL
- **Communication:** REST API with JWT authentication
- **Data Flow:** Unidirectional (Component → Service → API → DB)
- **State:** React hooks (useState, useEffect)
- **Styling:** Utility-first CSS (Tailwind)

This architecture ensures **scalability, maintainability, and performance** for a modern LMS platform.
