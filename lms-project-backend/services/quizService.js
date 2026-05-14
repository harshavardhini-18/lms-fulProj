import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';
import {
  insertQuestionRow,
  sanitizeQuestionPayload,
} from './questionService.js';

const STATUSES = ['draft', 'published', 'archived'];

function parseId(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${label} must be a positive number`, 400);
  }
  return parsed;
}

function mapQuestionRow(row) {
  return {
    _id: String(row.id),
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    codeImageUrl: row.code_image_url || '',
    options: Array.isArray(row.options) ? row.options : [],
    acceptedAnswers: Array.isArray(row.accepted_answers) ? row.accepted_answers : [],
    answerValidationMode: row.fill_blank_validation_mode || 'strict',
    categoryId: row.category_id,
    categoryName: row.category_name || null,
    difficulty: row.difficulty,
    tags: Array.isArray(row.tags) ? row.tags : [],
    points: Number(row.points || 1),
    status: row.status,
  };
}

function mapQuizRow(row, questions = [], questionCount = null) {
  return {
    _id: String(row.id),
    id: row.id,
    title: row.title,
    description: row.description || '',
    categoryId: row.category_id,
    categoryName: row.category_name || null,
    status: row.status,
    totalPoints: Number(row.total_points || 0),
    questionCount: questionCount !== null ? questionCount : questions.length,
    questions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SORTABLE = {
  updated_at: 'q.updated_at',
  created_at: 'q.created_at',
  title: 'q.title',
};

function buildSort(sort) {
  const raw = String(sort || 'updated_at:desc').split(':');
  const field = SORTABLE[raw[0]] || SORTABLE.updated_at;
  const dir = String(raw[1] || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `${field} ${dir}`;
}

async function validateCategoryExists(categoryId, client = pool) {
  if (!categoryId) return;
  const r = await client.query(
    `SELECT 1 FROM quiz_categories WHERE id = $1 AND is_deleted = FALSE`,
    [categoryId]
  );
  if (!r.rows[0]) throw new AppError('Category not found', 404);
}

async function loadQuizQuestions(quizId, client = pool) {
  const result = await client.query(
    `SELECT qq.position, qq.points_override, q.*,
            c.name AS category_name
     FROM quiz_questions qq
     JOIN questions q ON q.id = qq.question_id AND q.is_deleted = FALSE
     LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
     WHERE qq.quiz_id = $1
     ORDER BY qq.position ASC, qq.created_at ASC`,
    [quizId]
  );
  return result.rows.map((row) => ({
    ...mapQuestionRow(row),
    position: Number(row.position || 0),
    pointsOverride: row.points_override !== null && row.points_override !== undefined
      ? Number(row.points_override)
      : null,
    effectivePoints: row.points_override !== null && row.points_override !== undefined
      ? Number(row.points_override)
      : Number(row.points || 1),
  }));
}

async function recomputeTotalPoints(quizId, client) {
  const r = await client.query(
    `SELECT COALESCE(SUM(COALESCE(qq.points_override, q.points)), 0)::INT AS total
     FROM quiz_questions qq
     JOIN questions q ON q.id = qq.question_id
     WHERE qq.quiz_id = $1`,
    [quizId]
  );
  const total = r.rows[0]?.total || 0;
  await client.query(`UPDATE quizzes SET total_points = $1 WHERE id = $2`, [total, quizId]);
  return total;
}

/**
 * Resolve the question item array from payload into question_ids + positions.
 * Each item is either:
 *   { mode: 'import', questionId, pointsOverride? }
 *   { mode: 'create', ...question payload..., pointsOverride? }
 */
async function resolveQuestionItems(items, actorId, client) {
  if (!Array.isArray(items)) return [];
  const resolved = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i] || {};
    const mode = item.mode || (item.questionId ? 'import' : 'create');
    let questionId;
    if (mode === 'import') {
      questionId = parseId(item.questionId, `questions[${i}].questionId`);
      const exists = await client.query(
        `SELECT 1 FROM questions WHERE id = $1 AND is_deleted = FALSE`,
        [questionId]
      );
      if (!exists.rows[0]) throw new AppError(`Question ${questionId} not found`, 404);
    } else {
      const sanitized = sanitizeQuestionPayload(item, `Question ${i + 1}`);
      const inserted = await insertQuestionRow(client, sanitized, actorId);
      questionId = inserted.id;
    }
    const pointsOverride = item.pointsOverride !== undefined && item.pointsOverride !== null && `${item.pointsOverride}`.trim() !== ''
      ? Math.max(0, Number(item.pointsOverride))
      : null;
    resolved.push({ questionId, pointsOverride });
  }
  // Dedupe: same question can't appear twice in one quiz (PK constraint), keep first.
  const seen = new Set();
  return resolved.filter((r) => {
    if (seen.has(r.questionId)) return false;
    seen.add(r.questionId);
    return true;
  });
}

export async function listQuizzes(filters = {}) {
  const where = ['q.is_deleted = FALSE'];
  const params = [];

  if (filters.q && String(filters.q).trim()) {
    params.push(`%${String(filters.q).trim().toLowerCase()}%`);
    where.push(`LOWER(q.title) LIKE $${params.length}`);
  }
  if (filters.categoryId !== undefined && filters.categoryId !== null && `${filters.categoryId}`.trim() !== '') {
    params.push(parseId(filters.categoryId, 'categoryId'));
    where.push(`q.category_id = $${params.length}`);
  }
  if (filters.status && STATUSES.includes(String(filters.status))) {
    params.push(String(filters.status));
    where.push(`q.status = $${params.length}`);
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;
  const orderBy = buildSort(filters.sort);

  const countResult = await pool.query(
    `SELECT COUNT(*)::INT AS total
     FROM quizzes q
     WHERE ${where.join(' AND ')}`,
    params
  );
  const total = countResult.rows[0]?.total || 0;

  const dataParams = [...params, pageSize, offset];
  const dataResult = await pool.query(
    `SELECT q.*,
            c.name AS category_name,
            (SELECT COUNT(*)::INT FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count
     FROM quizzes q
     LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
     WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    data: dataResult.rows.map((row) => mapQuizRow(row, [], Number(row.question_count || 0))),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getQuiz(id) {
  const parsed = parseId(id, 'quizId');
  const result = await pool.query(
    `SELECT q.*, c.name AS category_name
     FROM quizzes q
     LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
     WHERE q.id = $1 AND q.is_deleted = FALSE`,
    [parsed]
  );
  const row = result.rows[0];
  if (!row) throw new AppError('Quiz not found', 404);
  const questions = await loadQuizQuestions(parsed);
  return mapQuizRow(row, questions, questions.length);
}

export async function createQuiz(payload, actor) {
  const actorId = parseId(actor?.id, 'actorId');
  const title = String(payload?.title || '').trim();
  if (!title) throw new AppError('Quiz title is required', 400);
  if (title.length > 255) throw new AppError('Quiz title must be 255 chars or less', 400);

  const description = String(payload?.description || '').trim();
  const status = 'archived';

  const categoryId = payload?.categoryId !== undefined && payload?.categoryId !== null && `${payload.categoryId}`.trim() !== ''
    ? parseId(payload.categoryId, 'categoryId')
    : null;

  const items = Array.isArray(payload?.questions) ? payload.questions : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await validateCategoryExists(categoryId, client);

    const inserted = await client.query(
      `INSERT INTO quizzes (title, description, category_id, status, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$5)
       RETURNING *`,
      [title, description, categoryId, status, actorId]
    );
    const quizRow = inserted.rows[0];

    const resolved = await resolveQuestionItems(items, actorId, client);
    for (let i = 0; i < resolved.length; i++) {
      await client.query(
        `INSERT INTO quiz_questions (quiz_id, question_id, position, points_override)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (quiz_id, question_id) DO NOTHING`,
        [quizRow.id, resolved[i].questionId, i, resolved[i].pointsOverride]
      );
    }
    await recomputeTotalPoints(quizRow.id, client);
    await client.query('COMMIT');
    return getQuiz(quizRow.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateQuiz(id, payload, actor) {
  const parsed = parseId(id, 'quizId');
  const actorId = parseId(actor?.id, 'actorId');

  const existing = await pool.query(
    `SELECT * FROM quizzes WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  const row = existing.rows[0];
  if (!row) throw new AppError('Quiz not found', 404);

  const title = payload?.title !== undefined ? String(payload.title || '').trim() : row.title;
  if (!title) throw new AppError('Quiz title is required', 400);

  const description = payload?.description !== undefined ? String(payload.description || '').trim() : row.description;
  const status = row.status;
  const categoryId = payload?.categoryId !== undefined
    ? (payload.categoryId === null || `${payload.categoryId}`.trim() === ''
        ? null
        : parseId(payload.categoryId, 'categoryId'))
    : row.category_id;

  const rewireQuestions = Array.isArray(payload?.questions);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await validateCategoryExists(categoryId, client);

    await client.query(
      `UPDATE quizzes
       SET title = $1, description = $2, category_id = $3, status = $4, updated_by = $5
       WHERE id = $6`,
      [title, description, categoryId, status, actorId, parsed]
    );

    if (rewireQuestions) {
      await client.query(`DELETE FROM quiz_questions WHERE quiz_id = $1`, [parsed]);
      const resolved = await resolveQuestionItems(payload.questions, actorId, client);
      for (let i = 0; i < resolved.length; i++) {
        await client.query(
          `INSERT INTO quiz_questions (quiz_id, question_id, position, points_override)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (quiz_id, question_id) DO NOTHING`,
          [parsed, resolved[i].questionId, i, resolved[i].pointsOverride]
        );
      }
      await recomputeTotalPoints(parsed, client);
    }

    await client.query('COMMIT');
    return getQuiz(parsed);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function setQuizLifecycleStatus(id, nextStatus, actor) {
  const parsed = parseId(id, 'quizId');
  const actorId = parseId(actor?.id, 'actorId');
  if (nextStatus !== 'published' && nextStatus !== 'archived') {
    throw new AppError('Invalid lifecycle action', 400);
  }
  const existing = await pool.query(
    `SELECT * FROM quizzes WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  if (!existing.rows[0]) throw new AppError('Quiz not found', 404);
  await pool.query(
    `UPDATE quizzes SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3`,
    [nextStatus, actorId, parsed]
  );
  return getQuiz(parsed);
}

export async function deleteQuiz(id) {
  const parsed = parseId(id, 'quizId');
  const existing = await pool.query(
    `SELECT * FROM quizzes WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  if (!existing.rows[0]) throw new AppError('Quiz not found', 404);

  await pool.query(
    `UPDATE quizzes SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1`,
    [parsed]
  );
  // Junction rows remain in case of restore; cascade only fires on hard delete.
  return { success: true };
}

export async function duplicateQuiz(id, payload, actor) {
  const parsed = parseId(id, 'quizId');
  const actorId = parseId(actor?.id, 'actorId');

  const src = await pool.query(
    `SELECT * FROM quizzes WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  if (!src.rows[0]) throw new AppError('Source quiz not found', 404);

  const links = await pool.query(
    `SELECT question_id, position, points_override
     FROM quiz_questions
     WHERE quiz_id = $1
     ORDER BY position ASC`,
    [parsed]
  );

  const title = String(payload?.title || `${src.rows[0].title} (Copy)`).trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO quizzes (title, description, category_id, status, created_by, updated_by)
       VALUES ($1,$2,$3,'archived',$4,$4)
       RETURNING *`,
      [title, src.rows[0].description, src.rows[0].category_id, actorId]
    );
    const newId = inserted.rows[0].id;
    for (const link of links.rows) {
      await client.query(
        `INSERT INTO quiz_questions (quiz_id, question_id, position, points_override)
         VALUES ($1,$2,$3,$4)`,
        [newId, link.question_id, link.position, link.points_override]
      );
    }
    await recomputeTotalPoints(newId, client);
    await client.query('COMMIT');
    return getQuiz(newId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
