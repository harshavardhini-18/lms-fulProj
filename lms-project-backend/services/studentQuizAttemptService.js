import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';
import {
  gradeFillBlankAnswer,
  getFillBlankCorrectAnswer,
} from '../utils/fillBlankAnswerValidation.js';

function parseId(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${label} must be a positive number`, 400);
  }
  return parsed;
}

function mapQuestionRow(row) {
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    codeImageUrl: row.code_image_url || '',
    options: Array.isArray(row.options) ? row.options : [],
    acceptedAnswers: Array.isArray(row.accepted_answers) ? row.accepted_answers : [],
    answerValidationMode: row.fill_blank_validation_mode || 'strict',
    difficulty: row.difficulty,
    points: Number(row.points || 1),
    effectivePoints: row.points_override !== null && row.points_override !== undefined
      ? Number(row.points_override)
      : Number(row.points || 1),
  };
}

async function loadQuizQuestionsOrdered(quizId, client = pool) {
  const result = await client.query(
    `SELECT qq.position, qq.points_override, q.*
     FROM quiz_questions qq
     JOIN questions q ON q.id = qq.question_id AND q.is_deleted = FALSE
     WHERE qq.quiz_id = $1
     ORDER BY qq.position ASC, qq.created_at ASC`,
    [quizId]
  );
  return result.rows.map((row) => mapQuestionRow(row));
}

export function stripQuestionForExam(q) {
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    codeImageUrl: q.codeImageUrl || '',
    effectivePoints: q.effectivePoints ?? q.points ?? 1,
    difficulty: q.difficulty || 'medium',
    options: (q.options || []).map((o) => ({
      id: o.id,
      label: o.label,
    })),
  };
}

function calcScoreForQuestion(q, rawAnswer) {
  const pts = q.effectivePoints ?? q.points ?? 1;
  if (q.type === 'mcq' || q.type === 'code_image' || q.type === 'true_false') {
    const correct = (q.options || []).find((o) => o.isCorrect);
    const chosen = rawAnswer;
    const match = (a, b) => String(a) === String(b);
    return correct && match(chosen, correct.id) ? pts : 0;
  }
  if (q.type === 'multi_choice') {
    const correctIds = (q.options || []).filter((o) => o.isCorrect).map((o) => String(o.id));
    if (!correctIds.length) return 0;
    const selected = Array.isArray(rawAnswer) ? rawAnswer.map(String) : [];
    const selectedCorrect = selected.filter((id) => correctIds.includes(id)).length;
    const selectedWrong = selected.filter((id) => !correctIds.includes(id)).length;
    const ratio = Math.max(0, (selectedCorrect - selectedWrong) / correctIds.length);
    return Math.round(ratio * pts * 10) / 10;
  }
  if (q.type === 'fill_blank') {
    return gradeFillBlankAnswer(q, rawAnswer) ? pts : 0;
  }
  return 0;
}

function formatStudentAnswerLabel(q, rawAnswer) {
  if (rawAnswer === undefined || rawAnswer === null) return '—';
  if (q.type === 'fill_blank') {
    const s = String(rawAnswer).trim();
    return s || '—';
  }
  if (q.type === 'multi_choice') {
    const ids = Array.isArray(rawAnswer) ? rawAnswer.map(String) : [];
    if (!ids.length) return '—';
    const labels = ids
      .map((id) => (q.options || []).find((o) => String(o.id) === id)?.label)
      .filter(Boolean);
    return labels.length ? labels.join(', ') : '—';
  }
  const opt = (q.options || []).find((o) => String(o.id) === String(rawAnswer));
  return opt?.label ? String(opt.label) : '—';
}

function formatCorrectAnswerLabel(q) {
  if (q.type === 'fill_blank') {
    const a = getFillBlankCorrectAnswer(q);
    return a || '—';
  }
  const correctOpts = (q.options || []).filter((o) => o.isCorrect);
  if (!correctOpts.length) return '—';
  return correctOpts.map((o) => o.label).join(', ');
}

export async function listPublishedQuizzesForStudent(userId, filters = {}) {
  const params = [];
  const where = [`q.is_deleted = FALSE`, `q.status = 'published'`];

  if (filters.q && String(filters.q).trim()) {
    params.push(`%${String(filters.q).trim().toLowerCase()}%`);
    where.push(`LOWER(q.title) LIKE $${params.length}`);
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;

  const countResult = await pool.query(
    `SELECT COUNT(*)::INT AS total
     FROM quizzes q
     WHERE ${where.join(' AND ')}`,
    params
  );
  const total = countResult.rows[0]?.total || 0;

  const userIdx = params.length + 1;
  const limitIdx = params.length + 2;
  const offsetIdx = params.length + 3;

  const dataResult = await pool.query(
    `SELECT q.*,
            c.name AS category_name,
            m.id AS module_id,
            m.title AS module_title,
            cr.id AS course_id,
            cr.title AS course_title,
            CASE WHEN s.id IS NOT NULL THEN 'lesson' ELSE 'global' END AS placement,
            (SELECT COUNT(*)::INT FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
            (SELECT COUNT(*)::INT FROM quiz_attempts qa
             WHERE qa.quiz_id = q.id AND qa.user_id = $${userIdx} AND qa.status = 'submitted')::INT AS submitted_count,
            (SELECT MAX(qa.score_earned) FROM quiz_attempts qa
             WHERE qa.quiz_id = q.id AND qa.user_id = $${userIdx} AND qa.status = 'submitted') AS best_score_earned,
            (SELECT qa.score_earned FROM quiz_attempts qa
             WHERE qa.quiz_id = q.id AND qa.user_id = $${userIdx} AND qa.status = 'submitted'
             ORDER BY qa.submitted_at DESC NULLS LAST LIMIT 1) AS last_score_earned,
            (SELECT qa.max_points FROM quiz_attempts qa
             WHERE qa.quiz_id = q.id AND qa.user_id = $${userIdx} AND qa.status = 'submitted'
             ORDER BY qa.submitted_at DESC NULLS LAST LIMIT 1) AS last_max_points,
            (SELECT qa.id FROM quiz_attempts qa
             WHERE qa.quiz_id = q.id AND qa.user_id = $${userIdx} AND qa.status = 'in_progress'
             LIMIT 1) AS in_progress_attempt_id,
            (SELECT qa.id FROM quiz_attempts qa
             WHERE qa.quiz_id = q.id AND qa.user_id = $${userIdx} AND qa.status = 'submitted'
             ORDER BY qa.submitted_at DESC NULLS LAST LIMIT 1) AS last_submitted_attempt_id
     FROM quizzes q
     LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
     LEFT JOIN subtopics s ON s.quiz_id = q.id AND s.is_deleted = FALSE
     LEFT JOIN modules m ON m.id = s.module_id AND m.is_deleted = FALSE
     LEFT JOIN courses cr ON cr.id = m.course_id AND cr.is_deleted = FALSE
     WHERE ${where.join(' AND ')}
     ORDER BY q.updated_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, userId, pageSize, offset]
  );

  const rows = dataResult.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    categoryName: row.category_name,
    courseId: row.course_id ?? null,
    courseTitle: row.course_title || null,
    moduleId: row.module_id ?? null,
    moduleTitle: row.module_title || null,
    placement: row.placement || 'global',
    questionCount: Number(row.question_count || 0),
    totalPoints: Number(row.total_points || 0),
    submittedCount: Number(row.submitted_count || 0),
    bestScoreEarned: row.best_score_earned != null ? Number(row.best_score_earned) : null,
    lastScoreEarned: row.last_score_earned != null ? Number(row.last_score_earned) : null,
    lastMaxPoints: row.last_max_points != null ? Number(row.last_max_points) : null,
    inProgressAttemptId: row.in_progress_attempt_id ?? null,
    lastSubmittedAttemptId: row.last_submitted_attempt_id ?? null,
  }));

  return {
    data: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getStudentQuizOverview(quizId, userId) {
  const qid = parseId(quizId, 'quizId');
  const quizRes = await pool.query(
    `SELECT q.*, c.name AS category_name,
            (SELECT COUNT(*)::INT FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count
     FROM quizzes q
     LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
     WHERE q.id = $1 AND q.is_deleted = FALSE`,
    [qid]
  );
  const row = quizRes.rows[0];
  if (!row) throw new AppError('Quiz not found', 404);
  if (row.status !== 'published') throw new AppError('Quiz is not available', 404);

  const inProg = await pool.query(
    `SELECT id, started_at, current_index FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2 AND status = 'in_progress'`,
    [qid, userId]
  );

  const history = await pool.query(
    `SELECT id,
            submitted_at,
            score_earned,
            max_points,
            CASE
              WHEN max_points > 0 AND score_earned IS NOT NULL THEN
                ROUND(100.0 * score_earned::numeric / max_points)::INT
              ELSE NULL
            END AS percent
     FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2 AND status = 'submitted'
     ORDER BY submitted_at DESC NULLS LAST
     LIMIT 10`,
    [qid, userId]
  );

  const lastSub = await pool.query(
    `SELECT id FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2 AND status = 'submitted'
     ORDER BY submitted_at DESC NULLS LAST
     LIMIT 1`,
    [qid, userId]
  );

  const stats = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'submitted')::INT AS submitted_count,
       COALESCE(MAX(score_earned) FILTER (WHERE status = 'submitted'), NULL) AS best_score,
       (SELECT score_earned FROM quiz_attempts
        WHERE quiz_id = $1 AND user_id = $2 AND status = 'submitted'
        ORDER BY submitted_at DESC NULLS LAST LIMIT 1) AS last_score,
       (SELECT max_points FROM quiz_attempts
        WHERE quiz_id = $1 AND user_id = $2 AND status = 'submitted'
        ORDER BY submitted_at DESC NULLS LAST LIMIT 1) AS last_max_points
     FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2`,
    [qid, userId]
  );

  const s = stats.rows[0];
  const inRow = inProg.rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    categoryName: row.category_name,
    questionCount: Number(row.question_count || 0),
    totalPoints: Number(row.total_points || 0),
    inProgressAttemptId: inRow?.id ?? null,
    inProgressStartedAt: inRow?.started_at ?? null,
    inProgressCurrentIndex: inRow != null ? Number(inRow.current_index || 0) : null,
    submittedCount: Number(s?.submitted_count || 0),
    bestScoreEarned: s?.best_score != null ? Number(s.best_score) : null,
    lastScoreEarned: s?.last_score != null ? Number(s.last_score) : null,
    lastMaxPoints: s?.last_max_points != null ? Number(s.last_max_points) : null,
    lastSubmittedAttemptId: lastSub.rows[0]?.id ?? null,
    attemptHistory: history.rows.map((h) => ({
      attemptId: h.id,
      submittedAt: h.submitted_at,
      percent: h.percent != null ? Number(h.percent) : null,
      scoreEarned: h.score_earned != null ? Number(h.score_earned) : null,
      maxPoints: h.max_points != null ? Number(h.max_points) : null,
    })),
  };
}

export async function abandonInProgressAttempt(quizId, userId) {
  const qid = parseId(quizId, 'quizId');
  const uid = parseId(userId, 'userId');
  const del = await pool.query(
    `DELETE FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2 AND status = 'in_progress'
     RETURNING id`,
    [qid, uid]
  );
  if (!del.rows[0]) {
    throw new AppError('No in-progress attempt to abandon', 404);
  }
  return { abandoned: true, attemptId: del.rows[0].id };
}

export async function startOrResumeAttempt(quizId, userId) {
  const qid = parseId(quizId, 'quizId');
  const quizCheck = await pool.query(
    `SELECT id FROM quizzes WHERE id = $1 AND is_deleted = FALSE AND status = 'published'`,
    [qid]
  );
  if (!quizCheck.rows[0]) throw new AppError('Quiz not found or not available', 404);

  const existing = await pool.query(
    `SELECT * FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2 AND status = 'in_progress'`,
    [qid, userId]
  );
  if (existing.rows[0]) {
    const attempt = existing.rows[0];
    const questions = await loadQuizQuestionsOrdered(qid);
    return formatPlayerResponse(attempt, questions);
  }

  const insert = await pool.query(
    `INSERT INTO quiz_attempts (quiz_id, user_id, status)
     VALUES ($1, $2, 'in_progress')
     RETURNING *`,
    [qid, userId]
  );
  const attempt = insert.rows[0];
  const questions = await loadQuizQuestionsOrdered(qid);
  return formatPlayerResponse(attempt, questions);
}

function formatPlayerResponse(attemptRow, questionsFull) {
  const answers = attemptRow.answers || {};
  const flagged = attemptRow.flagged || {};
  const visited = attemptRow.visited || {};
  const questions = questionsFull.map(stripQuestionForExam);
  return {
    attempt: {
      id: attemptRow.id,
      quizId: attemptRow.quiz_id,
      status: attemptRow.status,
      answers,
      flagged,
      visited,
      currentIndex: Number(attemptRow.current_index || 0),
      startedAt: attemptRow.started_at,
    },
    questions,
  };
}

export async function getAttemptPlayer(attemptId, userId) {
  const aid = parseId(attemptId, 'attemptId');
  const res = await pool.query(
    `SELECT * FROM quiz_attempts WHERE id = $1 AND user_id = $2`,
    [aid, userId]
  );
  const attempt = res.rows[0];
  if (!attempt) throw new AppError('Attempt not found', 404);
  if (attempt.status !== 'in_progress') throw new AppError('Attempt is already submitted', 400);

  const questions = await loadQuizQuestionsOrdered(attempt.quiz_id);
  return formatPlayerResponse(attempt, questions);
}

export async function patchAttempt(attemptId, userId, body) {
  const aid = parseId(attemptId, 'attemptId');
  const res = await pool.query(
    `SELECT * FROM quiz_attempts WHERE id = $1 AND user_id = $2`,
    [aid, userId]
  );
  const attempt = res.rows[0];
  if (!attempt) throw new AppError('Attempt not found', 404);
  if (attempt.status !== 'in_progress') throw new AppError('Attempt is already submitted', 400);

  let answers = typeof attempt.answers === 'object' && attempt.answers !== null ? { ...attempt.answers } : {};
  let flagged = typeof attempt.flagged === 'object' && attempt.flagged !== null ? { ...attempt.flagged } : {};
  let visited = typeof attempt.visited === 'object' && attempt.visited !== null ? { ...attempt.visited } : {};
  let currentIndex = Number(attempt.current_index || 0);

  if (body.answers && typeof body.answers === 'object') {
    answers = { ...answers, ...body.answers };
  }
  if (body.flagged && typeof body.flagged === 'object') {
    flagged = { ...flagged, ...body.flagged };
  }
  if (body.visited && typeof body.visited === 'object') {
    visited = { ...visited, ...body.visited };
  }
  if (body.currentIndex !== undefined && body.currentIndex !== null) {
    const ci = Number(body.currentIndex);
    if (Number.isFinite(ci) && ci >= 0) currentIndex = ci;
  }

  await pool.query(
    `UPDATE quiz_attempts SET answers = $1::jsonb, flagged = $2::jsonb, visited = $3::jsonb, current_index = $4
     WHERE id = $5`,
    [JSON.stringify(answers), JSON.stringify(flagged), JSON.stringify(visited), currentIndex, aid]
  );

  return { success: true, answers, flagged, visited, currentIndex };
}

export async function submitAttempt(attemptId, userId) {
  const aid = parseId(attemptId, 'attemptId');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `SELECT * FROM quiz_attempts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [aid, userId]
    );
    const attempt = res.rows[0];
    if (!attempt) throw new AppError('Attempt not found', 404);
    if (attempt.status !== 'in_progress') throw new AppError('Attempt is already submitted', 400);

    const questions = await loadQuizQuestionsOrdered(attempt.quiz_id, client);
    const answers = typeof attempt.answers === 'object' && attempt.answers !== null ? attempt.answers : {};

    let totalEarned = 0;
    let maxPoints = 0;
    const breakdown = [];

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const max = q.effectivePoints ?? q.points ?? 1;
      maxPoints += max;
      const raw = answers[String(i)];
      const skipped = raw === undefined || raw === null
        || (q.type === 'fill_blank' && String(raw).trim() === '')
        || (q.type === 'multi_choice' && (!Array.isArray(raw) || raw.length === 0))
        || ((q.type === 'mcq' || q.type === 'code_image' || q.type === 'true_false') && !raw);

      const earned = skipped ? 0 : calcScoreForQuestion(q, raw);
      totalEarned += earned;

      breakdown.push({
        index: i,
        questionId: q.id,
        type: q.type,
        prompt: q.prompt,
        earned,
        maxPoints: max,
        skipped: !!skipped,
        isCorrect: !skipped && earned >= max,
        studentAnswerLabel: skipped ? '—' : formatStudentAnswerLabel(q, raw),
        correctAnswerLabel: formatCorrectAnswerLabel(q),
      });
    }

    const sub = await client.query(`SELECT NOW() AS now`);
    const endTime = sub.rows[0].now;
    const started = new Date(attempt.started_at);
    const timeSpent = Math.max(0, Math.round((endTime - started) / 1000));

    await client.query(
      `UPDATE quiz_attempts
       SET status = 'submitted',
           submitted_at = NOW(),
           time_spent_seconds = $1,
           score_earned = $2,
           max_points = $3,
           result_breakdown = $4::jsonb
       WHERE id = $5`,
      [timeSpent, totalEarned, maxPoints, JSON.stringify(breakdown), aid]
    );
    await client.query('COMMIT');

    return {
      attemptId: aid,
      quizId: attempt.quiz_id,
      scoreEarned: totalEarned,
      maxPoints,
      percent: maxPoints > 0 ? Math.round((totalEarned / maxPoints) * 100) : 0,
      timeSpentSeconds: timeSpent,
      breakdown,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getAttemptResults(attemptId, userId) {
  const aid = parseId(attemptId, 'attemptId');
  const res = await pool.query(
    `SELECT qa.*, q.title AS quiz_title
     FROM quiz_attempts qa
     JOIN quizzes q ON q.id = qa.quiz_id
     WHERE qa.id = $1 AND qa.user_id = $2`,
    [aid, userId]
  );
  const row = res.rows[0];
  if (!row) throw new AppError('Attempt not found', 404);
  if (row.status !== 'submitted') throw new AppError('Quiz not submitted yet', 400);

  let bd = row.result_breakdown;
  if (bd == null) bd = [];
  else if (typeof bd === 'string') {
    try {
      bd = JSON.parse(bd);
    } catch {
      bd = [];
    }
  }
  if (!Array.isArray(bd)) bd = [];

  return {
    attemptId: row.id,
    quizId: row.quiz_id,
    quizTitle: row.quiz_title,
    scoreEarned: Number(row.score_earned || 0),
    maxPoints: Number(row.max_points || 0),
    percent: Number(row.max_points) > 0
      ? Math.round((Number(row.score_earned) / Number(row.max_points)) * 100)
      : 0,
    timeSpentSeconds: row.time_spent_seconds,
    submittedAt: row.submitted_at,
    breakdown: bd,
  };
}
