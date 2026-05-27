# Student Dashboard - Integration Guide

## Overview

A world-class, modern Student Learning Dashboard built for LMS platforms with enterprise-grade UI/UX. Built with React, Tailwind CSS, and Lucide icons.

## Features

### 1. **Analytics Cards**
- Enrolled Courses counter
- Lesson Progress tracker
- Quiz Performance metrics
- Overall Completion indicator

### 2. **Continue Learning Section**
- Course cards with progress visualization
- Instructor information
- Lesson and quiz counts
- Estimated time remaining
- Continue/Review button based on status

### 3. **Analytics Section**
- Weekly learning activity chart
- Quiz performance donut chart
- Lessons status breakdown

### 4. **Quiz Performance Widget**
- Pass rate donut chart
- Subject performance ranking
- Strongest/weakest subject highlights

### 5. **Activity Timeline**
- Recent learning activities
- Timestamp tracking
- Visual activity indicators

### 6. **Progress Table**
- Comprehensive course overview
- Status indicators
- Progress bars
- Last activity tracking
- Quick action buttons

## Installation

### Prerequisites
```bash
npm install react react-dom react-router-dom
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react
```

### Setup

1. **Install Tailwind CSS (if not already installed)**
```bash
cd /your-project
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Copy dashboard files to your project**
```
src/components/StudentDashboard/
  - StudentDashboard.jsx
  - Sidebar.jsx
  - Navbar.jsx
  - AnalyticsCards.jsx
  - ContinueLearning.jsx
  - AnalyticsSection.jsx
  - QuizPerformanceWidget.jsx
  - ActivityTimeline.jsx
  - ProgressTable.jsx
  - index.js
```

3. **Copy API service**
```
src/services/
  - dashboardService.js
```

## Usage

### Basic Implementation

```jsx
import { StudentDashboard } from './components/StudentDashboard'

function App() {
  return <StudentDashboard />
}

export default App
```

### In Routes

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { StudentDashboard } from './components/StudentDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  )
}
```

## Data Structure

### Expected Backend Response Format

The dashboard expects the following data structure from your backend API:

```javascript
{
  id: 1,
  user_id: 1,
  course_id: 3,
  status: 'enrolled', // 'enrolled', 'in_progress', 'completed'
  lessons_total: 12,
  lessons_completed: 8,
  quizzes_total: 3,
  quizzes_passed: 2,
  completion_percent: 65,
  last_subtopic_id: 45,
  last_watched_seconds: 3600,
  enrolled_at: '2026-01-15T10:42:16.074189+05:30',
  completed_at: null,
  
  // Extended fields (optional)
  enrolled_courses_count: 22,
  recent_activities: [
    {
      type: 'completed',
      title: 'Completed Physics Lesson 4',
      timestamp: '2 hours ago'
    }
  ]
}
```

## API Endpoints Required

The dashboard requires the following API endpoints:

### 1. Get Student Course Progress
```
GET /api/student-course-progress/{userId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "enrolled_courses_count": 22,
  "lessons_total": 45,
  "lessons_completed": 28,
  "quizzes_total": 12,
  "quizzes_passed": 8,
  "completion_percent": 62
}
```

### 2. Get All Student Courses
```
GET /api/student/{userId}/courses
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Course Title",
    "instructor": "Instructor Name",
    "progress": 65,
    "thumbnail": "url",
    "lessons": {"completed": 8, "total": 12},
    "quizzes": {"passed": 2, "total": 3},
    "status": "in_progress"
  }
]
```

### 3. Get Quiz Progress
```
GET /api/quiz-progress/{userId}/course/{courseId}
Authorization: Bearer {token}
```

### 4. Get Course Progress
```
GET /api/course-progress/{userId}/{courseId}
Authorization: Bearer {token}
```

### 5. Get Student Activities
```
GET /api/student/{userId}/activities?limit=10
Authorization: Bearer {token}
```

### 6. Get Dashboard Analytics
```
GET /api/student/{userId}/analytics
Authorization: Bearer {token}
```

## Component Customization

### Changing Colors

Update the color classes in Tailwind Config:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      indigo: { /* Your brand color */ },
      emerald: { /* Success color */ },
      amber: { /* Warning color */ },
    }
  }
}
```

### Modifying Card Data

Each component can be customized by passing different props:

```jsx
<AnalyticsCards 
  data={{
    enrolled_courses_count: 25,
    lessons_completed: 30,
    lessons_total: 50,
    quizzes_passed: 5,
    quizzes_total: 8,
    completion_percent: 75
  }} 
/>
```

### Custom Styling

All components use Tailwind CSS classes and can be customized:

```jsx
// Modify button styles
<button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl">
  Custom Button
</button>
```

## Integration with Backend

### Example: Connect to PostgreSQL API

```jsx
// In StudentDashboard.jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      const response = await fetch(
        `http://localhost:5000/api/student-course-progress/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  fetchData()
}, [])
```

### Using the Service Layer

```jsx
import { fetchStudentCourseProgress } from '../services/dashboardService'

useEffect(() => {
  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      const data = await fetchStudentCourseProgress(userId, token)
      setDashboardData(data)
    } catch (error) {
      setError(error.message)
    }
  }
  
  loadData()
}, [])
```

## Backend Implementation

### PostgreSQL Queries to Support Dashboard

See the SQL queries provided in the dashboard setup guide for:
- Student course progress
- Quiz performance tracking
- Activity timeline
- Analytics aggregation

## Features

✅ Responsive design (Mobile, Tablet, Desktop)
✅ Dark mode ready
✅ Accessibility compliant (WCAG)
✅ Smooth animations
✅ Real-time data integration
✅ Progress visualization
✅ Analytics dashboard
✅ Activity timeline
✅ Quiz performance tracking
✅ Course management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized component rendering
- Lazy loading support
- Efficient data fetching
- Minimal re-renders
- Fast initial load

## Troubleshooting

### Dashboard not loading
1. Check if token is in localStorage
2. Verify API endpoint is accessible
3. Check browser console for errors

### Data not showing
1. Verify API response format matches expected structure
2. Check network tab for failed requests
3. Ensure user is authenticated

### Styling issues
1. Verify Tailwind CSS is properly configured
2. Check if tailwind.config.js is in root
3. Clear browser cache

## Future Enhancements

- Dark mode support
- Mobile app version
- Real-time notifications
- Advanced analytics
- Custom dashboards
- Export functionality
- Integration with video player
- Offline support

## Support

For issues or questions, please refer to the project documentation or contact the development team.

## License

This dashboard is part of the LMS platform and follows the same license terms.
