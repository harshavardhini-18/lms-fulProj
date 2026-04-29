import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

const DEFAULT_SCENE = {
  elements: [],
  appState: { viewBackgroundColor: '#ffffff' },
  files: {},
};

function normalizeNoteRow(row) {
  return {
    _id: String(row.id),
    id: row.id,
    user: row.user_id,
    course: row.course_id,
    lessonId: row.lesson_id,
    anchorTimestampSeconds: row.anchor_timestamp_seconds,
    title: row.title,
    textContent: row.text_content || '',
    drawingScene: row.drawing_scene || DEFAULT_SCENE,
    drawingAssets: Array.isArray(row.drawing_assets) ? row.drawing_assets : [],
    createdAtClient: row.created_at_client,
    lastSavedAt: row.last_saved_at,
    isPinned: row.is_pinned,
    isArchived: row.is_archived,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeScene(scene) {
  if (!scene || typeof scene !== 'object') return DEFAULT_SCENE;
  if (!Array.isArray(scene.elements)) {
    return { ...DEFAULT_SCENE, ...scene, elements: [] };
  }
  return scene;
}

function normalizeAssets(assets) {
  if (!Array.isArray(assets)) return [];
  return assets;
}

function parseNoteId(noteId) {
  const parsed = Number(noteId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('Invalid note id', 400);
  }
  return parsed;
}

export async function ensureNotesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.notes (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL,
      lesson_id TEXT NULL,
      anchor_timestamp_seconds INTEGER NOT NULL DEFAULT 0,
      title VARCHAR(180) NOT NULL,
      text_content TEXT NOT NULL DEFAULT '',
      drawing_scene JSONB NOT NULL DEFAULT '{"elements":[],"appState":{"viewBackgroundColor":"#ffffff"},"files":{}}'::jsonb,
      drawing_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at_client TIMESTAMPTZ NULL,
      last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notes_user_course_deleted_updated
    ON public.notes(user_id, course_id, is_deleted, updated_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notes_course_lesson_anchor
    ON public.notes(course_id, lesson_id, anchor_timestamp_seconds)
  `);
}

async function updateCourseProgressSafe(userId, courseId, anchorTimestampSeconds) {
  try {
    await pool.query(
      `INSERT INTO course_progress (user_id, course_id, last_watched_second, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, course_id)
       DO UPDATE SET
         last_watched_second = EXCLUDED.last_watched_second,
         updated_at = NOW()`,
      [userId, courseId, Number(anchorTimestampSeconds || 0)]
    );
  } catch {
    // Course progress schema differs across environments; notes must still save.
  }
}

export async function listNotesByCourse(userId, courseId) {
  const result = await pool.query(
    `SELECT *
     FROM public.notes
     WHERE user_id = $1
       AND course_id = $2
       AND is_deleted = FALSE
     ORDER BY updated_at DESC`,
    [Number(userId), String(courseId)]
  );
  return result.rows.map(normalizeNoteRow);
}

export async function createNoteWithAssetsAndProgress(userId, payload) {
  const title = String(payload.title || '').trim();
  if (!title) throw new AppError('Title is required', 400);
  if (!payload.course) throw new AppError('Course is required', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertResult = await client.query(
      `INSERT INTO public.notes (
         user_id, course_id, lesson_id, anchor_timestamp_seconds, title,
         text_content, drawing_scene, drawing_assets, created_at_client, last_saved_at,
         is_pinned, is_archived, is_deleted, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, NOW(), $10, $11, FALSE, NOW(), NOW())
       RETURNING *`,
      [
        Number(userId),
        String(payload.course),
        payload.lessonId ? String(payload.lessonId) : null,
        Number(payload.anchorTimestampSeconds || 0),
        title,
        String(payload.textContent || ''),
        JSON.stringify(normalizeScene(payload.drawingScene)),
        JSON.stringify(normalizeAssets(payload.drawingAssets)),
        payload.createdAtClient || null,
        Boolean(payload.isPinned),
        Boolean(payload.isArchived),
      ]
    );

    await client.query('COMMIT');
    await updateCourseProgressSafe(
      Number(userId),
      String(payload.course),
      Number(payload.anchorTimestampSeconds || 0)
    );
    return normalizeNoteRow(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateNoteWithAssetsAndProgress(userId, noteId, payload) {
  const parsedNoteId = parseNoteId(noteId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingResult = await client.query(
      `SELECT *
       FROM public.notes
       WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
       LIMIT 1`,
      [parsedNoteId, Number(userId)]
    );
    const existing = existingResult.rows[0];
    if (!existing) {
      await client.query('ROLLBACK');
      throw new AppError('Note not found', 404);
    }

    const updatedResult = await client.query(
      `UPDATE public.notes
       SET
         title = $1,
         text_content = $2,
         drawing_scene = $3::jsonb,
         drawing_assets = $4::jsonb,
         lesson_id = $5,
         anchor_timestamp_seconds = $6,
         is_pinned = $7,
         is_archived = $8,
         last_saved_at = NOW(),
         updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        payload.title !== undefined ? String(payload.title).trim() : existing.title,
        payload.textContent !== undefined ? String(payload.textContent) : existing.text_content,
        JSON.stringify(payload.drawingScene !== undefined ? normalizeScene(payload.drawingScene) : existing.drawing_scene),
        JSON.stringify(payload.drawingAssets !== undefined ? normalizeAssets(payload.drawingAssets) : existing.drawing_assets),
        payload.lessonId !== undefined ? (payload.lessonId ? String(payload.lessonId) : null) : existing.lesson_id,
        payload.anchorTimestampSeconds !== undefined
          ? Number(payload.anchorTimestampSeconds || 0)
          : Number(existing.anchor_timestamp_seconds || 0),
        payload.isPinned !== undefined ? Boolean(payload.isPinned) : existing.is_pinned,
        payload.isArchived !== undefined ? Boolean(payload.isArchived) : existing.is_archived,
        parsedNoteId,
        Number(userId),
      ]
    );

    await client.query('COMMIT');
    await updateCourseProgressSafe(
      Number(userId),
      String(existing.course_id),
      payload.anchorTimestampSeconds !== undefined
        ? Number(payload.anchorTimestampSeconds || 0)
        : Number(existing.anchor_timestamp_seconds || 0)
    );
    return normalizeNoteRow(updatedResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteNoteWithAssets(userId, noteId) {
  const parsedNoteId = parseNoteId(noteId);
  const result = await pool.query(
    `UPDATE public.notes
     SET is_deleted = TRUE, last_saved_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
     RETURNING id`,
    [parsedNoteId, Number(userId)]
  );
  if (!result.rows[0]) throw new AppError('Note not found', 404);
}
