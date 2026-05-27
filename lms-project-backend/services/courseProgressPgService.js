import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

const PASS_PERCENT = Number(process.env.COURSE_QUIZ_PASS_PERCENT || 60);

function parseId(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${label} must be a positive number`, 400);
  }
  return parsed;
}

/** Subtopic (lesson) that has this quiz assigned in a course. */
export async function resolveCourseQuizContext(quizId, client = pool) {
  const qid = parseId(quizId, 'quizId');
  const res = await client.query(
    `SELECT s.id AS subtopic_id,
            s.module_id,
            m.course_id,
            s.quiz_id,
            s.title AS subtopic_title
     FROM subtopics s
     JOIN modules m ON m.id = s.module_id AND m.is_deleted = FALSE
     WHERE s.quiz_id = $1 AND s.is_deleted = FALSE AND s.status = 'published'
     LIMIT 1`,
    [qid]
  );
  return res.rows[0] || null;
}

export async function ensureStudentCourseProgress(userId, courseId, client = pool) {
  const uid = parseId(userId, 'userId');
  const cid = parseId(courseId, 'courseId');
  await client.query(
    `INSERT INTO student_course_progress (user_id, course_id, status)
     VALUES ($1, $2, 'enrolled')
     ON CONFLICT (user_id, course_id) DO NOTHING`,
    [uid, cid]
  );
}

export async function ensureStudentLessonProgress(userId, subtopicId, client = pool) {
  const uid = parseId(userId, 'userId');
  const sid = parseId(subtopicId, 'subtopicId');
  const row = await client.query(
    `SELECT s.id AS subtopic_id, s.module_id, m.course_id, s.quiz_id IS NOT NULL AS quiz_required
     FROM subtopics s
     JOIN modules m ON m.id = s.module_id
     WHERE s.id = $1 AND s.is_deleted = FALSE`,
    [sid]
  );
  const st = row.rows[0];
  if (!st) return null;

  await ensureStudentCourseProgress(uid, st.course_id, client);

  await client.query(
    `INSERT INTO student_lesson_progress (
       user_id, course_id, module_id, subtopic_id, quiz_required
     ) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, subtopic_id) DO NOTHING`,
    [uid, st.course_id, st.module_id, st.subtopic_id, !!st.quiz_required]
  );
  return st;
}

/** Count published lessons & recompute completion_percent for a course. */
export async function recalculateCourseProgress(userId, courseId, client = pool) {
  const uid = parseId(userId, 'userId');
  const cid = parseId(courseId, 'courseId');

  const totals = await client.query(
    `SELECT
       (SELECT COUNT(*)::INT FROM subtopics s
        JOIN modules m ON m.id = s.module_id
        WHERE m.course_id = $1 AND m.is_deleted = FALSE
          AND s.is_deleted = FALSE AND s.status = 'published') AS lessons_total,
       (SELECT COUNT(*)::INT FROM subtopics s
        JOIN modules m ON m.id = s.module_id
        WHERE m.course_id = $1 AND m.is_deleted = FALSE
          AND s.is_deleted = FALSE AND s.status = 'published'
          AND s.quiz_id IS NOT NULL) AS quizzes_total`,
    [cid]
  );
  const lessonsTotal = Number(totals.rows[0]?.lessons_total || 0);
  const quizzesTotal = Number(totals.rows[0]?.quizzes_total || 0);

  const done = await client.query(
    `SELECT
       COUNT(*) FILTER (WHERE lesson_completed)::INT AS lessons_completed,
       COUNT(*) FILTER (WHERE quiz_required AND quiz_passed)::INT AS quizzes_passed
     FROM student_lesson_progress
     WHERE user_id = $1 AND course_id = $2`,
    [uid, cid]
  );
  const lessonsCompleted = Number(done.rows[0]?.lessons_completed || 0);
  const quizzesPassed = Number(done.rows[0]?.quizzes_passed || 0);

  let completionPercent = 0;
  if (lessonsTotal > 0) {
    completionPercent = Math.round((lessonsCompleted / lessonsTotal) * 100);
  }
  const status =
    completionPercent >= 100 ? 'completed' : completionPercent > 0 ? 'in_progress' : 'enrolled';

  const completedAt = status === 'completed' ? new Date() : null;

  await client.query(
    `INSERT INTO student_course_progress (
       user_id, course_id, status, lessons_total, lessons_completed,
       quizzes_total, quizzes_passed, completion_percent, completed_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (user_id, course_id) DO UPDATE SET
       status = EXCLUDED.status,
       lessons_total = EXCLUDED.lessons_total,
       lessons_completed = EXCLUDED.lessons_completed,
       quizzes_total = EXCLUDED.quizzes_total,
       quizzes_passed = EXCLUDED.quizzes_passed,
       completion_percent = EXCLUDED.completion_percent,
       completed_at = CASE
         WHEN EXCLUDED.status = 'completed' THEN COALESCE(student_course_progress.completed_at, NOW())
         ELSE NULL
       END,
       updated_at = NOW()`,
    [
      uid,
      cid,
      status,
      lessonsTotal,
      lessonsCompleted,
      quizzesTotal,
      quizzesPassed,
      completionPercent,
      completedAt,
    ]
  );

  return {
    courseId: cid,
    lessonsTotal,
    lessonsCompleted,
    quizzesTotal,
    quizzesPassed,
    completionPercent,
    status,
  };
}

function buildCorrectAnswerPayload(q) {
  if (q.type === 'fill_blank') {
    const accepted = Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : [];
    return { acceptedAnswers: accepted };
  }
  const correctOpts = (q.options || []).filter((o) => o.isCorrect);
  return {
    optionIds: correctOpts.map((o) => o.id),
    labels: correctOpts.map((o) => o.label),
  };
}

function buildStudentAnswerPayload(q, raw) {
  if (raw === undefined || raw === null) return null;
  if (q.type === 'multi_choice') {
    return { optionIds: Array.isArray(raw) ? raw : [] };
  }
  if (q.type === 'fill_blank') {
    return { text: String(raw) };
  }
  return { optionId: raw };
}

/** Persist per-question rows after grading. */
export async function persistQuizAttemptAnswers(attemptId, questions, answersMap, breakdown, client) {
  const aid = parseId(attemptId, 'attemptId');
  await client.query(`DELETE FROM quiz_attempt_answers WHERE attempt_id = $1`, [aid]);

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const raw = answersMap[String(i)];
    const bd = breakdown[i] || {};
    const skipped = !!bd.skipped;
    const max = Number(bd.maxPoints ?? q.effectivePoints ?? q.points ?? 1);
    const earned = Number(bd.earned ?? 0);

    await client.query(
      `INSERT INTO quiz_attempt_answers (
         attempt_id, question_id, position, question_type,
         student_answer, correct_answer,
         student_answer_label, correct_answer_label,
         is_correct, is_skipped, points_earned, points_max
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12)`,
      [
        aid,
        q.id,
        i,
        q.type,
        JSON.stringify(buildStudentAnswerPayload(q, raw)),
        JSON.stringify(buildCorrectAnswerPayload(q)),
        bd.studentAnswerLabel || '—',
        bd.correctAnswerLabel || '—',
        !!bd.isCorrect,
        skipped,
        earned,
        max,
      ]
    );
  }
}

/** After quiz submit: link attempt to course, update lesson + course rollups. */
export async function recordCourseQuizSubmit({
  attemptId,
  userId,
  quizId,
  scoreEarned,
  maxPoints,
  questions,
  answersMap,
  breakdown,
  client,
}) {
  const ctx = await resolveCourseQuizContext(quizId, client);
  if (!ctx) return null;

  const uid = parseId(userId, 'userId');
  const percent = maxPoints > 0 ? Math.round((scoreEarned / maxPoints) * 100) : 0;
  const passed = percent >= PASS_PERCENT;

  await client.query(
    `UPDATE quiz_attempts SET
       course_id = $1,
       module_id = $2,
       subtopic_id = $3,
       attempt_source = 'course_lesson',
       score_percent = $4,
       passed = $5
     WHERE id = $6 AND user_id = $7`,
    [ctx.course_id, ctx.module_id, ctx.subtopic_id, percent, passed, attemptId, uid]
  );

  await persistQuizAttemptAnswers(attemptId, questions, answersMap, breakdown, client);

  await ensureStudentLessonProgress(uid, ctx.subtopic_id, client);

  const lessonDone = passed;

  await client.query(
    `UPDATE student_lesson_progress SET
       quiz_attempts_count = quiz_attempts_count + 1,
       quiz_best_score_percent = GREATEST(quiz_best_score_percent, $1),
       quiz_best_score_earned = CASE
         WHEN $2::numeric > quiz_best_score_earned THEN $2::numeric ELSE quiz_best_score_earned END,
       quiz_best_max_points = CASE
         WHEN $2::numeric > quiz_best_score_earned THEN $3::numeric ELSE quiz_best_max_points END,
       quiz_passed = quiz_passed OR $4,
       last_quiz_attempt_id = $5,
       lesson_completed = lesson_completed OR $6,
       lesson_completed_at = CASE
         WHEN $6 AND lesson_completed_at IS NULL THEN NOW()
         ELSE lesson_completed_at
       END,
       updated_at = NOW()
     WHERE user_id = $7 AND subtopic_id = $8`,
    [
      percent,
      scoreEarned,
      maxPoints,
      passed,
      attemptId,
      lessonDone,
      uid,
      ctx.subtopic_id,
    ]
  );

  return recalculateCourseProgress(uid, ctx.course_id, client);
}

export async function markLessonContentComplete(userId, courseId, moduleId, subtopicId, watchSeconds = 0) {
  const uid = parseId(userId, 'userId');
  const cid = parseId(courseId, 'courseId');
  const mid = parseId(moduleId, 'moduleId');
  const sid = parseId(subtopicId, 'subtopicId');

  await ensureStudentCourseProgress(uid, cid);

  const st = await pool.query(
    `SELECT quiz_id IS NOT NULL AS quiz_required FROM subtopics WHERE id = $1`,
    [sid]
  );
  const quizRequired = !!st.rows[0]?.quiz_required;

  await pool.query(
    `INSERT INTO student_lesson_progress (
       user_id, course_id, module_id, subtopic_id, quiz_required,
       is_content_completed, content_completed_at, watch_seconds
     ) VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), $6)
     ON CONFLICT (user_id, subtopic_id) DO UPDATE SET
       is_content_completed = TRUE,
       content_completed_at = COALESCE(student_lesson_progress.content_completed_at, NOW()),
       watch_seconds = GREATEST(student_lesson_progress.watch_seconds, EXCLUDED.watch_seconds),
       lesson_completed = CASE
         WHEN student_lesson_progress.quiz_required AND NOT student_lesson_progress.quiz_passed THEN FALSE
         ELSE TRUE
       END,
       lesson_completed_at = CASE
         WHEN (NOT student_lesson_progress.quiz_required OR student_lesson_progress.quiz_passed)
           AND student_lesson_progress.lesson_completed_at IS NULL THEN NOW()
         ELSE student_lesson_progress.lesson_completed_at
       END,
       updated_at = NOW()`,
    [uid, cid, mid, sid, quizRequired, Math.max(0, Number(watchSeconds) || 0)]
  );

  return recalculateCourseProgress(uid, cid);
}

export async function getStudentCourseProgress(userId, courseId) {
  const uid = parseId(userId, 'userId');
  const cid = parseId(courseId, 'courseId');

  await ensureStudentCourseProgress(uid, cid);
  await recalculateCourseProgress(uid, cid);

  const res = await pool.query(
    `SELECT * FROM student_course_progress WHERE user_id = $1 AND course_id = $2`,
    [uid, cid]
  );
  const row = res.rows[0];
  if (!row) {
    return {
      courseId: cid,
      completionPercent: 0,
      lessonsTotal: 0,
      lessonsCompleted: 0,
      quizzesTotal: 0,
      quizzesPassed: 0,
      status: 'enrolled',
      lessons: [],
    };
  }

  const lessons = await pool.query(
    `SELECT subtopic_id, module_id, is_content_completed, watch_seconds,
            quiz_required, quiz_passed, quiz_best_score_percent,
            lesson_completed, lesson_completed_at, last_quiz_attempt_id
     FROM student_lesson_progress
     WHERE user_id = $1 AND course_id = $2
     ORDER BY module_id, subtopic_id`,
    [uid, cid]
  );

  return {
    courseId: cid,
    status: row.status,
    completionPercent: Number(row.completion_percent || 0),
    lessonsTotal: Number(row.lessons_total || 0),
    lessonsCompleted: Number(row.lessons_completed || 0),
    quizzesTotal: Number(row.quizzes_total || 0),
    quizzesPassed: Number(row.quizzes_passed || 0),
    lastSubtopicId: row.last_subtopic_id,
    lastWatchedSeconds: Number(row.last_watched_seconds || 0),
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
    lessons: lessons.rows.map((lp) => ({
      subtopicId: lp.subtopic_id,
      moduleId: lp.module_id,
      isContentCompleted: lp.is_content_completed,
      watchSeconds: Number(lp.watch_seconds || 0),
      quizRequired: lp.quiz_required,
      quizPassed: lp.quiz_passed,
      quizBestScorePercent: Number(lp.quiz_best_score_percent || 0),
      lessonCompleted: lp.lesson_completed,
      lessonCompletedAt: lp.lesson_completed_at,
      lastQuizAttemptId: lp.last_quiz_attempt_id,
    })),
  };
}

export async function getQuizAttemptAnswerRows(attemptId, userId) {
  const aid = parseId(attemptId, 'attemptId');
  const uid = parseId(userId, 'userId');
  const res = await pool.query(
    `SELECT qaa.*, qa.quiz_id, qa.course_id, qa.subtopic_id, qa.score_earned, qa.max_points, qa.score_percent
     FROM quiz_attempt_answers qaa
     JOIN quiz_attempts qa ON qa.id = qaa.attempt_id
     WHERE qaa.attempt_id = $1 AND qa.user_id = $2
     ORDER BY qaa.position ASC`,
    [aid, uid]
  );
  return res.rows;
}

export async function deleteStudentCourseProgress(userId, courseId) {
  const uid = parseId(userId, 'userId');
  const cid = parseId(courseId, 'courseId');

  const lessonResult = await pool.query(
    `DELETE FROM student_lesson_progress
     WHERE user_id = $1 AND course_id = $2`,
    [uid, cid]
  );

  const courseResult = await pool.query(
    `DELETE FROM student_course_progress
     WHERE user_id = $1 AND course_id = $2`,
    [uid, cid]
  );

  return {
    courseId: cid,
    deletedLessonProgress: lessonResult.rowCount,
    deletedCourseProgress: courseResult.rowCount,
  };
}

export async function deleteStudentLessonProgress(userId, courseId, subtopicId) {
  const uid = parseId(userId, 'userId');
  const cid = parseId(courseId, 'courseId');
  const sid = parseId(subtopicId, 'subtopicId');

  const lesson = await pool.query(
    `SELECT s.id
     FROM subtopics s
     JOIN modules m ON m.id = s.module_id
     WHERE s.id = $1 AND m.course_id = $2
       AND m.is_deleted = FALSE AND s.is_deleted = FALSE`,
    [sid, cid]
  );

  if (!lesson.rows[0]) {
    throw new AppError('Lesson not found in course', 404);
  }

  const result = await pool.query(
    `DELETE FROM student_lesson_progress
     WHERE user_id = $1 AND subtopic_id = $2`,
    [uid, sid]
  );

  const progress = await recalculateCourseProgress(uid, cid);

  return {
    courseId: cid,
    subtopicId: sid,
    deletedLessonProgress: result.rowCount,
    progress,
  };
}
