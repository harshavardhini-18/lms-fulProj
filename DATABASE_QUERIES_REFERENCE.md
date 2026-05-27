# Dashboard Database Queries - Quick Reference

This file contains all the PostgreSQL queries needed to support the Student Dashboard backend.

## 1. Student Course Progress Summary

Get total enrolled courses, lessons, and quizzes for a student:

```sql
SELECT 
  COUNT(DISTINCT cp.course_id) as enrolled_courses_count,
  SUM(cp.lessons_total) as lessons_total,
  SUM(cp.lessons_completed) as lessons_completed,
  SUM(cp.quizzes_total) as quizzes_total,
  SUM(cp.quizzes_passed) as quizzes_passed,
  ROUND(AVG(cp.completion_percent)::numeric, 2) as completion_percent,
  MAX(cp.last_watched_at) as last_activity
FROM course_progress cp
WHERE cp.user_id = $1;
```

## 2. Get All Student Courses with Progress

List all courses a student is enrolled in:

```sql
SELECT 
  c.id,
  c.title,
  c.instructor,
  cp.completion_percent as progress,
  c.thumbnail_url as thumbnail,
  cp.lessons_completed,
  cp.lessons_total,
  cp.quizzes_passed,
  cp.quizzes_total,
  cp.status,
  cp.enrolled_at,
  cp.completed_at,
  cp.last_watched_at
FROM course_progress cp
JOIN courses c ON cp.course_id = c.id
WHERE cp.user_id = $1
ORDER BY cp.last_watched_at DESC NULLS LAST;
```

## 3. Quiz Progress for Specific Course

Get quiz performance for a student in a course:

```sql
SELECT 
  qp.id,
  q.id as quiz_id,
  q.title,
  q.trigger_timestamp_seconds,
  qp.total_attempts,
  qp.best_score,
  qp.latest_score,
  qp.is_passed,
  qp.first_attempt_at,
  qp.last_attempt_at,
  qp.passed_at
FROM quiz_progress qp
JOIN quizzes q ON qp.quiz_id = q.id
WHERE qp.user_id = $1 
  AND q.course_id = $2
ORDER BY q.trigger_timestamp_seconds;
```

## 4. Student Quiz Attempt Details

Get specific quiz attempt with all answers:

```sql
SELECT 
  qa.id as answer_id,
  qa.position,
  q.prompt,
  q.question_type,
  qq.points_override as points_available,
  qaa.student_answer,
  qaa.correct_answer,
  qaa.is_correct,
  qaa.points_earned
FROM quiz_attempts qa
JOIN quiz_attempt_answers qaa ON qa.id = qaa.attempt_id
JOIN questions q ON qaa.question_id = q.id
LEFT JOIN quiz_questions qq ON q.id = qq.question_id
WHERE qa.user_id = $1 
  AND qa.quiz_id = $2
  AND qa.status = 'submitted'
ORDER BY qaa.position;
```

## 5. Recent Activity Timeline

Get recent learning activities:

```sql
-- Completed lessons
SELECT 
  'lesson_completed' as activity_type,
  'Completed ' || l.title as title,
  l.title as detail,
  COALESCE(cpl.completed_at, cp.last_watched_at) as activity_at,
  c.id as course_id,
  c.title as course_title
FROM course_progress cp
JOIN courses c ON cp.course_id = c.id
WHERE cp.user_id = $1
  AND cp.lessons_completed > 0
ORDER BY COALESCE(cpl.completed_at, cp.last_watched_at) DESC
LIMIT 5

UNION ALL

-- Passed quizzes
SELECT 
  'quiz_passed' as activity_type,
  'Passed ' || q.title || ' Quiz' as title,
  q.title as detail,
  qp.passed_at as activity_at,
  q.course_id,
  c.title as course_title
FROM quiz_progress qp
JOIN quizzes q ON qp.quiz_id = q.id
JOIN courses c ON q.course_id = c.id
WHERE qp.user_id = $1 
  AND qp.is_passed = true
ORDER BY qp.passed_at DESC
LIMIT 5

ORDER BY activity_at DESC
LIMIT 10;
```

## 6. Analytics - Weekly Learning Hours

Get study hours for each day of the week:

```sql
WITH weekly_data AS (
  SELECT 
    DATE_TRUNC('day', last_watched_at)::date as activity_date,
    EXTRACT(DOW FROM last_watched_at)::int as day_of_week,
    TO_CHAR(last_watched_at, 'Dy') as day_name,
    COUNT(*) as activity_count
  FROM course_progress
  WHERE user_id = $1
    AND last_watched_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE_TRUNC('day', last_watched_at), day_of_week
)
SELECT 
  day_name as day,
  activity_count * 2.5 as hours  -- Rough estimate: 2.5 hours per activity
FROM weekly_data
ORDER BY day_of_week;
```

## 7. Quiz Performance Statistics

Get overall quiz performance:

```sql
SELECT 
  COUNT(DISTINCT qp.quiz_id) as total_quizzes,
  SUM(CASE WHEN qp.is_passed THEN 1 ELSE 0 END) as passed_quizzes,
  COUNT(DISTINCT qp.quiz_id) - SUM(CASE WHEN qp.is_passed THEN 1 ELSE 0 END) as failed_quizzes,
  ROUND(
    (SUM(CASE WHEN qp.is_passed THEN 1 ELSE 0 END)::numeric / 
     COUNT(DISTINCT qp.quiz_id) * 100)::numeric, 
    2
  ) as pass_rate_percent,
  ROUND(AVG(qp.best_score)::numeric, 2) as avg_score
FROM quiz_progress qp
WHERE qp.user_id = $1;
```

## 8. Subject/Course-wise Performance

Get performance broken down by course:

```sql
SELECT 
  c.id,
  c.title as subject,
  ROUND(AVG(qp.best_score)::numeric, 2) as average_score,
  COUNT(CASE WHEN qp.is_passed THEN 1 END) as passed_count,
  COUNT(*) as total_quizzes,
  CASE 
    WHEN AVG(qp.best_score) >= 80 THEN 'Excellent'
    WHEN AVG(qp.best_score) >= 60 THEN 'Good'
    ELSE 'Needs Improvement'
  END as performance_level
FROM quiz_progress qp
JOIN quizzes q ON qp.quiz_id = q.id
JOIN courses c ON q.course_id = c.id
WHERE qp.user_id = $1
GROUP BY c.id, c.title
ORDER BY average_score DESC;
```

## 9. Lessons Completion Status

Get lessons broken down by status:

```sql
SELECT 
  COUNT(CASE WHEN cp.lessons_completed = cp.lessons_total THEN 1 END) as completed,
  COUNT(CASE WHEN cp.lessons_completed > 0 AND cp.lessons_completed < cp.lessons_total THEN 1 END) as in_progress,
  COUNT(CASE WHEN cp.lessons_completed = 0 THEN 1 END) as not_started
FROM course_progress cp
WHERE cp.user_id = $1;
```

## 10. Enrollment Timeline

Get student enrollment dates and completion dates:

```sql
SELECT 
  c.title,
  cp.enrolled_at,
  cp.completed_at,
  CASE 
    WHEN cp.completed_at IS NOT NULL 
    THEN EXTRACT(DAY FROM cp.completed_at - cp.enrolled_at)::int
    ELSE NULL
  END as days_to_complete,
  cp.status
FROM course_progress cp
JOIN courses c ON cp.course_id = c.id
WHERE cp.user_id = $1
ORDER BY cp.enrolled_at DESC;
```

## Usage Examples

### In Node.js with node-postgres:

```javascript
const userId = 1

// Get summary
const summary = await pool.query(
  `SELECT COUNT(DISTINCT cp.course_id) as enrolled_courses_count,
          SUM(cp.lessons_total) as lessons_total,
          SUM(cp.lessons_completed) as lessons_completed,
          SUM(cp.quizzes_total) as quizzes_total,
          SUM(cp.quizzes_passed) as quizzes_passed,
          ROUND(AVG(cp.completion_percent)::numeric, 2) as completion_percent
   FROM course_progress cp
   WHERE cp.user_id = $1`,
  [userId]
)

console.log(summary.rows[0])
```

### In Express route:

```javascript
app.get('/api/student-course-progress/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params
  
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT cp.course_id) as enrolled_courses_count,
        SUM(cp.lessons_total) as lessons_total,
        SUM(cp.lessons_completed) as lessons_completed,
        SUM(cp.quizzes_total) as quizzes_total,
        SUM(cp.quizzes_passed) as quizzes_passed,
        ROUND(AVG(cp.completion_percent)::numeric, 2) as completion_percent
      FROM course_progress cp
      WHERE cp.user_id = $1
    `, [userId])
    
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

## Index Recommendations

Add these indexes for better query performance:

```sql
CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX idx_quiz_progress_user_id ON quiz_progress(user_id);
CREATE INDEX idx_quiz_progress_user_quiz ON quiz_progress(user_id, quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_course_progress_last_watched ON course_progress(last_watched_at DESC);
```

## Performance Tips

1. Use prepared statements (parameterized queries)
2. Add indexes on frequently filtered columns
3. Cache aggregated data if students > 1000
4. Use pagination for large result sets
5. Add LIMIT clauses to limit results

## Testing Queries

Test with mock student ID:
```sql
-- Check if user has data
SELECT COUNT(*) FROM course_progress WHERE user_id = 1;

-- Get basic stats
SELECT * FROM course_progress WHERE user_id = 1;

-- Get quiz data
SELECT * FROM quiz_progress WHERE user_id = 1 LIMIT 5;
```

---

**For more details, refer to:**
- STUDENT_DASHBOARD_GUIDE.md
- DASHBOARD_BACKEND_SETUP.md
- DASHBOARD_IMPLEMENTATION_NOTES.md
