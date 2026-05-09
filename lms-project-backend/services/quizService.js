import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

function parseId(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${label} must be a positive number`, 400);
  }
  return parsed;
}

const QUESTION_TYPES = ['mcq', 'fill_blank', 'code_image'];

function stripAnswersFromQuestions(questions = []) {
  return questions.map((question) => {
    const type = question?.type || 'mcq';
    if (type === 'fill_blank') {
      const { acceptedAnswers, ...rest } = question;
      return rest;
    }
    if (type === 'code_image') {
      return {
        ...question,
        choices: Array.isArray(question?.choices)
          ? question.choices.map(({ isCorrect, ...choice }) => choice)
          : [],
      };
    }
    // mcq default
    return {
      ...question,
      choices: Array.isArray(question?.choices)
        ? question.choices.map(({ isCorrect, ...choice }) => choice)
        : [],
    };
  });
}

function sanitizeQuestions(rawQuestions = []) {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new AppError('At least one quiz question is required', 400);
  }

  return rawQuestions.map((question, qIndex) => {
    const questionText = String(question?.question || '').trim();
    if (!questionText) throw new AppError(`Question ${qIndex + 1} text is required`, 400);

    const type = QUESTION_TYPES.includes(question?.type) ? question.type : 'mcq';

    if (type === 'fill_blank') {
      const raw = question?.acceptedAnswers;
      const acceptedAnswers = Array.isArray(raw)
        ? raw.map((a) => String(a || '').trim().toLowerCase()).filter(Boolean)
        : [String(raw || '').trim().toLowerCase()].filter(Boolean);
      if (acceptedAnswers.length === 0) {
        throw new AppError(`Question ${qIndex + 1} (fill_blank) requires at least one accepted answer`, 400);
      }
      return {
        id: String(question?.id || `q-${qIndex + 1}`),
        type: 'fill_blank',
        question: questionText,
        acceptedAnswers,
      };
    }

    if (type === 'code_image') {
      const codeImageUrl = String(question?.codeImageUrl || '').trim();
      if (!codeImageUrl) {
        throw new AppError(`Question ${qIndex + 1} (code_image) requires a code image`, 400);
      }
      const choices = Array.isArray(question?.choices)
        ? question.choices.map((choice, cIndex) => ({
            id: String(choice?.id || `${qIndex + 1}-${cIndex + 1}`),
            label: String(choice?.label || '').trim(),
            isCorrect: Boolean(choice?.isCorrect),
          }))
        : [];
      if (choices.length < 2) throw new AppError(`Question ${qIndex + 1} (code_image) requires at least 2 choices`, 400);
      if (choices.some((c) => !c.label)) throw new AppError(`Question ${qIndex + 1} has an empty choice`, 400);
      if (!choices.some((c) => c.isCorrect)) throw new AppError(`Question ${qIndex + 1} must have one correct choice`, 400);
      return {
        id: String(question?.id || `q-${qIndex + 1}`),
        type: 'code_image',
        question: questionText,
        codeImageUrl,
        choices,
      };
    }

    // mcq
    const choices = Array.isArray(question?.choices)
      ? question.choices.map((choice, cIndex) => ({
          id: String(choice?.id || `${qIndex + 1}-${cIndex + 1}`),
          label: String(choice?.label || '').trim(),
          isCorrect: Boolean(choice?.isCorrect),
        }))
      : [];

    if (choices.length < 2) throw new AppError(`Question ${qIndex + 1} requires at least 2 choices`, 400);
    if (choices.some((choice) => !choice.label)) throw new AppError(`Question ${qIndex + 1} has an empty choice`, 400);
    if (!choices.some((choice) => choice.isCorrect)) throw new AppError(`Question ${qIndex + 1} must have one correct choice`, 400);

    return {
      id: String(question?.id || `q-${qIndex + 1}`),
      type: 'mcq',
      question: questionText,
      choices,
    };
  });
}

function mapQuizRow(row, includeAnswers = false) {
  const questions = Array.isArray(row.questions) ? row.questions : [];
  return {
    _id: String(row.id),
    id: row.id,
    courseId: row.course_id,
    subtopicId: row.subtopic_id,
    title: row.title,
    description: row.description || '',
    triggerTimestampSeconds: Number(row.trigger_timestamp_seconds || 0),
    status: row.status,
    questions: includeAnswers ? questions : stripAnswersFromQuestions(questions),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCourseIdFromSubtopic(subtopicId) {
  const result = await pool.query(
    `SELECT m.course_id, s.timestamp_end
     FROM subtopics s
     JOIN modules m ON m.id = s.module_id
     WHERE s.id = $1
       AND s.is_deleted = FALSE
       AND m.is_deleted = FALSE`,
    [subtopicId]
  );
  return result.rows[0] || null;
}

async function validateCourseExists(courseId) {
  const result = await pool.query(
    `SELECT id
     FROM courses
     WHERE id = $1
       AND is_deleted = FALSE`,
    [courseId]
  );
  if (!result.rows[0]) throw new AppError('Course not found', 404);
}

export async function createQuiz(payload, actor) {
  const actorId = parseId(actor?.id, 'actorId');
  const subtopicId = payload?.subtopicId !== undefined && payload?.subtopicId !== null
    ? parseId(payload.subtopicId, 'subtopicId')
    : null;

  let courseId = payload?.courseId ?? payload?.course;
  if (courseId !== undefined && courseId !== null) {
    courseId = parseId(courseId, 'courseId');
  }

  let subtopicInfo = null;
  if (subtopicId) {
    subtopicInfo = await getCourseIdFromSubtopic(subtopicId);
    if (!subtopicInfo) throw new AppError('Subtopic not found', 404);
    if (!courseId) courseId = Number(subtopicInfo.course_id);
    if (Number(courseId) !== Number(subtopicInfo.course_id)) {
      throw new AppError('subtopicId does not belong to provided courseId', 400);
    }
  }

  if (!courseId) throw new AppError('courseId is required', 400);
  await validateCourseExists(courseId);

  const title = String(payload?.title || '').trim();
  if (!title) throw new AppError('Quiz title is required', 400);

  const triggerTimestampSeconds =
    payload?.triggerTimestampSeconds !== undefined
      ? Math.max(0, Number(payload.triggerTimestampSeconds || 0))
      : Math.max(0, Number(subtopicInfo?.timestamp_end || 0));

  const questions = sanitizeQuestions(payload?.questions);
  const description = String(payload?.description || '').trim();
  const status = String(payload?.status || 'active').trim().toLowerCase();
  const normalizedStatus = status === 'inactive' ? 'inactive' : 'active';

  const inserted = await pool.query(
    `INSERT INTO quizzes (
      course_id,
      subtopic_id,
      title,
      description,
      trigger_timestamp_seconds,
      questions,
      status,
      created_by,
      updated_by
    ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
    RETURNING *`,
    [
      courseId,
      subtopicId,
      title,
      description,
      triggerTimestampSeconds,
      JSON.stringify(questions),
      normalizedStatus,
      actorId,
      actorId,
    ]
  );

  const row = inserted.rows[0];

  if (subtopicId) {
    await pool.query(
      `UPDATE subtopics
       SET quiz_id = $1
       WHERE id = $2`,
      [String(row.id), subtopicId]
    );
  }

  return mapQuizRow(row, false);
}

export async function listQuizzes(filters = {}, includeAnswers = false) {
  const conditions = ['q.is_deleted = FALSE'];
  const params = [];

  if (filters.courseId !== undefined && filters.courseId !== null && `${filters.courseId}`.trim() !== '') {
    params.push(parseId(filters.courseId, 'courseId'));
    conditions.push(`q.course_id = $${params.length}`);
  }
  if (filters.subtopicId !== undefined && filters.subtopicId !== null && `${filters.subtopicId}`.trim() !== '') {
    params.push(parseId(filters.subtopicId, 'subtopicId'));
    conditions.push(`q.subtopic_id = $${params.length}`);
  }
  if (filters.status && ['active', 'inactive'].includes(String(filters.status).toLowerCase())) {
    params.push(String(filters.status).toLowerCase());
    conditions.push(`q.status = $${params.length}`);
  }

  const result = await pool.query(
    `SELECT q.*
     FROM quizzes q
     WHERE ${conditions.join(' AND ')}
     ORDER BY q.trigger_timestamp_seconds ASC, q.created_at ASC`,
    params
  );
  return result.rows.map((row) => mapQuizRow(row, includeAnswers));
}

export async function getQuizById(quizId, includeAnswers = false) {
  const parsedQuizId = parseId(quizId, 'quizId');
  const result = await pool.query(
    `SELECT *
     FROM quizzes
     WHERE id = $1
       AND is_deleted = FALSE`,
    [parsedQuizId]
  );
  const row = result.rows[0];
  if (!row) throw new AppError('Quiz not found', 404);
  return mapQuizRow(row, includeAnswers);
}

export async function listQuizzesByCourse(courseId, includeAnswers = false) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const result = await pool.query(
    `SELECT *
     FROM quizzes
     WHERE course_id = $1
       AND is_deleted = FALSE
       AND status IN ('active', 'inactive')
     ORDER BY trigger_timestamp_seconds ASC, created_at ASC`,
    [parsedCourseId]
  );
  return result.rows.map((row) => mapQuizRow(row, includeAnswers));
}

export async function getQuizByCourseAndTimestamp(courseId, triggerTimestampSeconds, includeAnswers = false) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const timestamp = Math.max(0, Number(triggerTimestampSeconds || 0));

  const result = await pool.query(
    `SELECT *
     FROM quizzes
     WHERE course_id = $1
       AND trigger_timestamp_seconds = $2
       AND status = 'active'
       AND is_deleted = FALSE
     ORDER BY created_at DESC
     LIMIT 1`,
    [parsedCourseId, timestamp]
  );

  const row = result.rows[0];
  if (!row) throw new AppError('Quiz not found for this timestamp', 404);
  return mapQuizRow(row, includeAnswers);
}

export async function updateQuiz(quizId, payload, actor) {
  const parsedQuizId = parseId(quizId, 'quizId');
  const actorId = parseId(actor?.id, 'actorId');

  const existingResult = await pool.query(
    `SELECT *
     FROM quizzes
     WHERE id = $1
       AND is_deleted = FALSE`,
    [parsedQuizId]
  );
  const existing = existingResult.rows[0];
  if (!existing) throw new AppError('Quiz not found', 404);

  const title = payload?.title !== undefined ? String(payload.title || '').trim() : existing.title;
  if (!title) throw new AppError('Quiz title is required', 400);

  const description =
    payload?.description !== undefined ? String(payload.description || '').trim() : (existing.description || '');

  const triggerTimestampSeconds =
    payload?.triggerTimestampSeconds !== undefined
      ? Math.max(0, Number(payload.triggerTimestampSeconds || 0))
      : Number(existing.trigger_timestamp_seconds || 0);

  const status =
    payload?.status !== undefined && String(payload.status).toLowerCase() === 'inactive'
      ? 'inactive'
      : payload?.status !== undefined
        ? 'active'
        : existing.status;

  const questions =
    payload?.questions !== undefined
      ? sanitizeQuestions(payload.questions)
      : (Array.isArray(existing.questions) ? existing.questions : []);

  const updated = await pool.query(
    `UPDATE quizzes
     SET title = $1,
         description = $2,
         trigger_timestamp_seconds = $3,
         questions = $4::jsonb,
         status = $5,
         updated_by = $6
     WHERE id = $7
     RETURNING *`,
    [
      title,
      description,
      triggerTimestampSeconds,
      JSON.stringify(questions),
      status,
      actorId,
      parsedQuizId,
    ]
  );

  return mapQuizRow(updated.rows[0], false);
}

export async function deleteQuiz(quizId) {
  const parsedQuizId = parseId(quizId, 'quizId');

  const existingResult = await pool.query(
    `SELECT *
     FROM quizzes
     WHERE id = $1
       AND is_deleted = FALSE`,
    [parsedQuizId]
  );
  const existing = existingResult.rows[0];
  if (!existing) throw new AppError('Quiz not found', 404);

  await pool.query(
    `UPDATE quizzes
     SET is_deleted = TRUE,
         deleted_at = NOW()
     WHERE id = $1`,
    [parsedQuizId]
  );

  await pool.query(
    `UPDATE subtopics
     SET quiz_id = NULL
     WHERE quiz_id = $1`,
    [String(parsedQuizId)]
  );

  return { success: true, message: 'Quiz deleted successfully' };
}
