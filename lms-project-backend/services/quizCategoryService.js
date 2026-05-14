import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

function parseId(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(`${label} must be a positive number`, 400);
  }
  return parsed;
}

function toSlug(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

function mapRow(row) {
  return {
    _id: String(row.id),
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    questionCount: Number(row.question_count || 0),
    quizCount: Number(row.quiz_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCategories({ q } = {}) {
  const params = [];
  const where = ['c.is_deleted = FALSE'];
  if (q && String(q).trim()) {
    params.push(`%${String(q).trim().toLowerCase()}%`);
    where.push(`LOWER(c.name) LIKE $${params.length}`);
  }
  const result = await pool.query(
    `SELECT c.*,
            (SELECT COUNT(*)::INT FROM questions q WHERE q.category_id = c.id AND q.is_deleted = FALSE) AS question_count,
            (SELECT COUNT(*)::INT FROM quizzes z WHERE z.category_id = c.id AND z.is_deleted = FALSE) AS quiz_count
     FROM quiz_categories c
     WHERE ${where.join(' AND ')}
     ORDER BY c.name ASC`,
    params
  );
  return result.rows.map(mapRow);
}

export async function getCategory(id) {
  const parsed = parseId(id, 'categoryId');
  const result = await pool.query(
    `SELECT c.*,
            (SELECT COUNT(*)::INT FROM questions q WHERE q.category_id = c.id AND q.is_deleted = FALSE) AS question_count,
            (SELECT COUNT(*)::INT FROM quizzes z WHERE z.category_id = c.id AND z.is_deleted = FALSE) AS quiz_count
     FROM quiz_categories c
     WHERE c.id = $1 AND c.is_deleted = FALSE`,
    [parsed]
  );
  const row = result.rows[0];
  if (!row) throw new AppError('Category not found', 404);
  return mapRow(row);
}

export async function createCategory(payload, actor) {
  const actorId = parseId(actor?.id, 'actorId');
  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Category name is required', 400);
  if (name.length > 120) throw new AppError('Category name must be 120 chars or less', 400);

  const description = String(payload?.description || '').trim();
  let slug = toSlug(payload?.slug || name);
  if (!slug) slug = toSlug(`category-${Date.now()}`);

  // Ensure slug uniqueness; if collides, append numeric suffix.
  let attempt = slug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await pool.query(
      `SELECT 1 FROM quiz_categories WHERE slug = $1 LIMIT 1`,
      [attempt]
    );
    if (!exists.rows[0]) break;
    suffix += 1;
    attempt = `${slug}-${suffix}`;
  }

  const result = await pool.query(
    `INSERT INTO quiz_categories (name, slug, description, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$4)
     RETURNING *`,
    [name, attempt, description, actorId]
  );
  return mapRow({ ...result.rows[0], question_count: 0, quiz_count: 0 });
}

export async function updateCategory(id, payload, actor) {
  const parsed = parseId(id, 'categoryId');
  const actorId = parseId(actor?.id, 'actorId');

  const existing = await pool.query(
    `SELECT * FROM quiz_categories WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  const row = existing.rows[0];
  if (!row) throw new AppError('Category not found', 404);

  const name = payload?.name !== undefined ? String(payload.name || '').trim() : row.name;
  if (!name) throw new AppError('Category name is required', 400);
  const description = payload?.description !== undefined
    ? String(payload.description || '').trim()
    : row.description;

  const updated = await pool.query(
    `UPDATE quiz_categories
     SET name = $1, description = $2, updated_by = $3
     WHERE id = $4
     RETURNING *`,
    [name, description, actorId, parsed]
  );
  return getCategory(updated.rows[0].id);
}

export async function deleteCategory(id) {
  const parsed = parseId(id, 'categoryId');
  const existing = await pool.query(
    `SELECT * FROM quiz_categories WHERE id = $1 AND is_deleted = FALSE`,
    [parsed]
  );
  const row = existing.rows[0];
  if (!row) throw new AppError('Category not found', 404);

  await pool.query(
    `UPDATE quiz_categories
     SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1`,
    [parsed]
  );
  // category_id on questions/quizzes is ON DELETE SET NULL — but soft-delete
  // doesn't trigger that. Manually null out references so UI stays clean.
  await pool.query(`UPDATE questions SET category_id = NULL WHERE category_id = $1`, [parsed]);
  await pool.query(`UPDATE quizzes SET category_id = NULL WHERE category_id = $1`, [parsed]);
  return { success: true };
}
