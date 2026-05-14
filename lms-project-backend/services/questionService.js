import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

export const QUESTION_TYPES = ['mcq', 'multi_choice', 'true_false', 'fill_blank', 'code_image'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const STATUSES = ['active', 'archived'];

function parseId(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${label} must be a positive number`, 400);
  }
  return parsed;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeOptions(rawOptions, type, label = 'question') {
  const list = Array.isArray(rawOptions) ? rawOptions : [];
  return list.map((opt, idx) => ({
    id: String(opt?.id || `${label}-opt-${idx + 1}-${uid()}`),
    label: String(opt?.label || '').trim(),
    isCorrect: Boolean(opt?.isCorrect),
  }));
}

function validateOptionsList(options, { min, max, exactlyOneCorrect, atLeastOneCorrect, label }) {
  if (options.length < min) throw new AppError(`${label}: at least ${min} option(s) required`, 400);
  if (max !== undefined && options.length > max) throw new AppError(`${label}: at most ${max} options allowed`, 400);
  if (options.some((c) => !c.label)) throw new AppError(`${label}: all options must have text`, 400);
  const correct = options.filter((c) => c.isCorrect).length;
  if (exactlyOneCorrect && correct !== 1) throw new AppError(`${label}: must mark exactly one correct option`, 400);
  if (atLeastOneCorrect && correct < 1) throw new AppError(`${label}: must mark at least one correct option`, 400);
}

/**
 * Sanitize a single question payload into the canonical DB shape.
 * Returns: { type, prompt, codeImageUrl, options, acceptedAnswers, points, difficulty, status, categoryId, tags }
 */
export function sanitizeQuestionPayload(payload, label = 'Question') {
  if (!payload || typeof payload !== 'object') {
    throw new AppError(`${label}: invalid payload`, 400);
  }

  const type = QUESTION_TYPES.includes(payload.type) ? payload.type : 'mcq';
  const prompt = String(payload.prompt ?? payload.question ?? '').trim();
  const codeImageUrlRaw = String(payload.codeImageUrl ?? payload.code_image_url ?? '').trim();
  if (type !== 'code_image' && !prompt) throw new AppError(`${label}: prompt is required`, 400);
  if (prompt.length > 4000) throw new AppError(`${label}: prompt must be 4000 chars or less`, 400);

  const difficulty = DIFFICULTIES.includes(payload.difficulty) ? payload.difficulty : 'medium';
  const status = STATUSES.includes(payload.status) ? payload.status : 'active';
  const points = Math.max(0, Number.isFinite(Number(payload.points)) ? Number(payload.points) : 1);

  const categoryId = payload.categoryId !== undefined && payload.categoryId !== null && `${payload.categoryId}`.trim() !== ''
    ? parseId(payload.categoryId, 'categoryId')
    : null;

  const tags = Array.isArray(payload.tags)
    ? payload.tags
        .map((t) => String(t || '').trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20)
    : [];

  let options = [];
  let acceptedAnswers = [];
  let answerValidationMode = 'strict';
  let codeImageUrl = '';

  if (type === 'mcq') {
    options = normalizeOptions(payload.options ?? payload.choices, type, 'mcq');
    validateOptionsList(options, { min: 2, max: 6, exactlyOneCorrect: true, label });
  } else if (type === 'multi_choice') {
    options = normalizeOptions(payload.options ?? payload.choices, type, 'mc');
    validateOptionsList(options, { min: 2, max: 8, atLeastOneCorrect: true, label });
  } else if (type === 'true_false') {
    const rawTF = Array.isArray(payload.options) && payload.options.length === 2
      ? payload.options
      : [
          { label: 'True', isCorrect: payload.correctAnswer === true || payload.correctAnswer === 'true' },
          { label: 'False', isCorrect: payload.correctAnswer === false || payload.correctAnswer === 'false' },
        ];
    options = [
      { id: 'tf-true', label: 'True', isCorrect: Boolean(rawTF[0]?.isCorrect) },
      { id: 'tf-false', label: 'False', isCorrect: Boolean(rawTF[1]?.isCorrect) },
    ];
    if (options.filter((o) => o.isCorrect).length !== 1) {
      throw new AppError(`${label}: select either True or False as correct`, 400);
    }
  } else if (type === 'fill_blank') {
    const raw = payload.acceptedAnswers ?? payload.accepted_answers ?? payload.correctAnswer;
    const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const answer = arr.map((a) => String(a || '').trim()).find(Boolean) || '';
    if (!answer) {
      throw new AppError(`${label}: correct answer is required`, 400);
    }
    if (answer.length > 300) {
      throw new AppError(`${label}: correct answer must be 300 characters or less`, 400);
    }
    acceptedAnswers = [answer];
    answerValidationMode = 'strict';
  } else if (type === 'code_image') {
    codeImageUrl = codeImageUrlRaw;
    if (!prompt && !codeImageUrl) {
      throw new AppError(`${label}: add question text, an image, or both`, 400);
    }
    options = normalizeOptions(payload.options ?? payload.choices, type, 'code');
    validateOptionsList(options, { min: 2, max: 6, exactlyOneCorrect: true, label });
  }

  return {
    type,
    prompt,
    codeImageUrl,
    options,
    acceptedAnswers,
    answerValidationMode,
    points,
    difficulty,
    status,
    categoryId,
    tags,
  };
}

function mapRow(row) {
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
    usageCount: Number(row.usage_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SORTABLE = {
  updated_at: 'q.updated_at',
  created_at: 'q.created_at',
  prompt: 'q.prompt',
  type: 'q.type',
  difficulty: 'q.difficulty',
};

function buildSort(sort) {
  const raw = String(sort || 'updated_at:desc').split(':');
  const field = SORTABLE[raw[0]] || SORTABLE.updated_at;
  const dir = String(raw[1] || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `${field} ${dir}`;
}

export async function listQuestions(filters = {}) {
  const where = ['q.is_deleted = FALSE'];
  const params = [];

  if (filters.q && String(filters.q).trim()) {
    params.push(`%${String(filters.q).trim().toLowerCase()}%`);
    where.push(`LOWER(q.prompt) LIKE $${params.length}`);
  }
  if (filters.type && QUESTION_TYPES.includes(String(filters.type))) {
    params.push(String(filters.type));
    where.push(`q.type = $${params.length}`);
  }
  if (filters.categoryId !== undefined && filters.categoryId !== null && `${filters.categoryId}`.trim() !== '') {
    params.push(parseId(filters.categoryId, 'categoryId'));
    where.push(`q.category_id = $${params.length}`);
  }
  if (filters.difficulty && DIFFICULTIES.includes(String(filters.difficulty))) {
    params.push(String(filters.difficulty));
    where.push(`q.difficulty = $${params.length}`);
  }
  if (filters.status && STATUSES.includes(String(filters.status))) {
    params.push(String(filters.status));
    where.push(`q.status = $${params.length}`);
  }
  if (filters.tag && String(filters.tag).trim()) {
    params.push(String(filters.tag).trim().toLowerCase());
    where.push(`$${params.length} = ANY(q.tags)`);
  }
  if (filters.excludeQuizId !== undefined && filters.excludeQuizId !== null && `${filters.excludeQuizId}`.trim() !== '') {
    params.push(parseId(filters.excludeQuizId, 'excludeQuizId'));
    where.push(`NOT EXISTS (
      SELECT 1 FROM quiz_questions qq
      WHERE qq.quiz_id = $${params.length} AND qq.question_id = q.id
    )`);
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;

  const orderBy = buildSort(filters.sort);

  const countResult = await pool.query(
    `SELECT COUNT(*)::INT AS total
     FROM questions q
     WHERE ${where.join(' AND ')}`,
    params
  );
  const total = countResult.rows[0]?.total || 0;

  const dataParams = [...params, pageSize, offset];
  const dataResult = await pool.query(
    `SELECT q.*,
            c.name AS category_name,
            (SELECT COUNT(*)::INT FROM quiz_questions qq WHERE qq.question_id = q.id) AS usage_count
     FROM questions q
     LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
     WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    data: dataResult.rows.map(mapRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getQuestion(id) {
  const parsed = parseId(id, 'questionId');
  const result = await pool.query(
    `SELECT q.*,
            c.name AS category_name,
            (SELECT COUNT(*)::INT FROM quiz_questions qq WHERE qq.question_id = q.id) AS usage_count
     FROM questions q
     LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
     WHERE q.id = $1 AND q.is_deleted = FALSE`,
    [parsed]
  );
  const row = result.rows[0];
  if (!row) throw new AppError('Question not found', 404);
  return mapRow(row);
}

async function validateCategoryExists(categoryId, client) {
  if (!categoryId) return;
  const r = await (client || pool).query(
    `SELECT 1 FROM quiz_categories WHERE id = $1 AND is_deleted = FALSE`,
    [categoryId]
  );
  if (!r.rows[0]) throw new AppError('Category not found', 404);
}

export async function insertQuestionRow(client, sanitized, actorId) {
  await validateCategoryExists(sanitized.categoryId, client);
  const result = await client.query(
    `INSERT INTO questions (
      type, prompt, code_image_url, options, accepted_answers, fill_blank_validation_mode,
      category_id, difficulty, tags, points, status,
      created_by, updated_by
    ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$12)
    RETURNING *`,
    [
      sanitized.type,
      sanitized.prompt,
      sanitized.codeImageUrl,
      JSON.stringify(sanitized.options),
      JSON.stringify(sanitized.acceptedAnswers),
      sanitized.answerValidationMode,
      sanitized.categoryId,
      sanitized.difficulty,
      sanitized.tags,
      sanitized.points,
      sanitized.status,
      actorId,
    ]
  );
  return result.rows[0];
}

export async function createQuestion(payload, actor) {
  const actorId = parseId(actor?.id, 'actorId');
  const sanitized = sanitizeQuestionPayload(payload);
  const row = await insertQuestionRow(pool, sanitized, actorId);
  return getQuestion(row.id);
}

export async function bulkCreateQuestions(payloads, actor) {
  const actorId = parseId(actor?.id, 'actorId');
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new AppError('At least one question is required', 400);
  }
  if (payloads.length > 200) throw new AppError('Cannot bulk-create more than 200 questions at once', 400);

  const sanitizedAll = payloads.map((p, i) => sanitizeQuestionPayload(p, `Question ${i + 1}`));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const s of sanitizedAll) {
      const row = await insertQuestionRow(client, s, actorId);
      inserted.push(row);
    }
    await client.query('COMMIT');
    const ids = inserted.map((r) => r.id);
    const result = await pool.query(
      `SELECT q.*, c.name AS category_name,
              (SELECT COUNT(*)::INT FROM quiz_questions qq WHERE qq.question_id = q.id) AS usage_count
       FROM questions q
       LEFT JOIN quiz_categories c ON c.id = q.category_id AND c.is_deleted = FALSE
       WHERE q.id = ANY($1::bigint[])
       ORDER BY q.id ASC`,
      [ids]
    );
    return result.rows.map(mapRow);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateQuestion(id, payload, actor) {
  const parsed = parseId(id, 'questionId');
  const actorId = parseId(actor?.id, 'actorId');

  const existing = await pool.query(
    `SELECT * FROM questions WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  const row = existing.rows[0];
  if (!row) throw new AppError('Question not found', 404);

  // Merge payload over existing for required fields not provided.
  const merged = {
    type: payload.type ?? row.type,
    prompt: payload.prompt ?? payload.question ?? row.prompt,
    codeImageUrl: payload.codeImageUrl ?? payload.code_image_url ?? row.code_image_url,
    options: payload.options ?? payload.choices ?? row.options,
    acceptedAnswers: payload.acceptedAnswers ?? payload.accepted_answers ?? row.accepted_answers,
    answerValidationMode: payload.answerValidationMode
      ?? payload.fillBlankValidationMode
      ?? payload.fill_blank_validation_mode
      ?? row.fill_blank_validation_mode,
    categoryId: payload.categoryId !== undefined ? payload.categoryId : row.category_id,
    difficulty: payload.difficulty ?? row.difficulty,
    tags: payload.tags ?? row.tags,
    points: payload.points ?? row.points,
    status: payload.status ?? row.status,
  };
  const sanitized = sanitizeQuestionPayload(merged);
  await validateCategoryExists(sanitized.categoryId);

  await pool.query(
    `UPDATE questions
     SET type = $1, prompt = $2, code_image_url = $3,
         options = $4::jsonb, accepted_answers = $5::jsonb,
         fill_blank_validation_mode = $6,
         category_id = $7, difficulty = $8, tags = $9,
         points = $10, status = $11, updated_by = $12
     WHERE id = $13`,
    [
      sanitized.type,
      sanitized.prompt,
      sanitized.codeImageUrl,
      JSON.stringify(sanitized.options),
      JSON.stringify(sanitized.acceptedAnswers),
      sanitized.answerValidationMode,
      sanitized.categoryId,
      sanitized.difficulty,
      sanitized.tags,
      sanitized.points,
      sanitized.status,
      actorId,
      parsed,
    ]
  );
  return getQuestion(parsed);
}

export async function deleteQuestion(id, { force = false } = {}) {
  const parsed = parseId(id, 'questionId');
  const existing = await pool.query(
    `SELECT * FROM questions WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  const row = existing.rows[0];
  if (!row) throw new AppError('Question not found', 404);

  const usage = await pool.query(
    `SELECT COUNT(*)::INT AS c FROM quiz_questions qq
     JOIN quizzes q ON q.id = qq.quiz_id AND q.is_deleted = FALSE
     WHERE qq.question_id = $1`,
    [parsed]
  );
  const usedIn = usage.rows[0]?.c || 0;

  if (usedIn > 0 && !force) {
    throw new AppError(
      `Question is linked to ${usedIn} active quiz(zes). Pass force=true to remove anyway.`,
      409,
      { usedIn }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (force && usedIn > 0) {
      await client.query(`DELETE FROM quiz_questions WHERE question_id = $1`, [parsed]);
      // Recompute total_points for affected quizzes
      await client.query(
        `UPDATE quizzes z
         SET total_points = COALESCE((
           SELECT SUM(COALESCE(qq.points_override, qn.points))
           FROM quiz_questions qq
           JOIN questions qn ON qn.id = qq.question_id
           WHERE qq.quiz_id = z.id
         ), 0)
         WHERE z.is_deleted = FALSE`
      );
    }
    await client.query(
      `UPDATE questions SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1`,
      [parsed]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { success: true, removedFromQuizzes: force ? usedIn : 0 };
}
