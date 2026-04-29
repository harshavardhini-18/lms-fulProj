import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

function toSlug(text = '') {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseId(value, label) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return parsed;
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  return Boolean(value);
}

function isPrivilegedUser(actor) {
  const role = String(actor?.role || '').toLowerCase();
  return ['admin', 'staff'].includes(role);
}

function normalizeLessonStatus(value, fallback = 'draft') {
  const normalized = String(value || fallback).toLowerCase();
  if (normalized !== 'draft' && normalized !== 'published') {
    throw new AppError('Invalid lesson status', 400);
  }
  return normalized;
}

function normalizeSummary(value, fallback = '') {
  const summary = String(value ?? fallback).trim();
  if (summary.length > 500) {
    throw new AppError('Lesson summary cannot exceed 500 characters', 400);
  }
  return summary;
}

const ALLOWED_TIPTAP_NODE_TYPES = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
  'horizontalRule',
  'image',
]);

const ALLOWED_TIPTAP_MARK_TYPES = new Set([
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'link',
]);

function hasRenderableContent(doc) {
  if (!doc || typeof doc !== 'object') return false;
  const stack = [doc];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (current.type === 'text' && String(current.text || '').trim()) return true;
    if (current.type === 'image' && String(current.attrs?.src || '').trim()) return true;
    if (Array.isArray(current.content)) stack.push(...current.content);
  }
  return false;
}

function validateTiptapNode(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    throw new AppError('Invalid contentJson structure', 400);
  }
  const type = String(node.type || '').trim();
  if (!ALLOWED_TIPTAP_NODE_TYPES.has(type)) {
    throw new AppError(`Unsupported content node type: ${type || 'unknown'}`, 400);
  }
  if (Array.isArray(node.marks)) {
    for (const mark of node.marks) {
      const markType = String(mark?.type || '').trim();
      if (!ALLOWED_TIPTAP_MARK_TYPES.has(markType)) {
        throw new AppError(`Unsupported content mark type: ${markType || 'unknown'}`, 400);
      }
    }
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) validateTiptapNode(child);
  }
}

function normalizeContentJson(value, fallback = { type: 'doc', content: [] }) {
  if (value === undefined) return fallback;
  const candidate = value === null ? fallback : value;
  if (typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new AppError('contentJson must be a valid object', 400);
  }
  validateTiptapNode(candidate);
  return candidate;
}

function normalizeVideoType(value, fallback = 'mp4') {
  const normalized = String(value || fallback).toLowerCase().trim();
  if (normalized !== 'mp4' && normalized !== 'hls') {
    throw new AppError('Invalid video type', 400);
  }
  return normalized;
}

function normalizeVersion(value, fallback = 1) {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('Invalid lesson version', 400);
  }
  return parsed;
}

function assertPublishableLesson(payload) {
  if (normalizeLessonStatus(payload.status, 'draft') !== 'published') return;
  if (!String(payload.title || '').trim()) {
    throw new AppError('title is required to publish a lesson', 400);
  }
  if (!normalizeSummary(payload.summary || '').trim()) {
    throw new AppError('summary is required to publish a lesson', 400);
  }
  if (!String(payload.videoUrl || '').trim()) {
    throw new AppError('videoUrl is required to publish a lesson', 400);
  }
  const normalizedContent = normalizeContentJson(payload.contentJson);
  if (!hasRenderableContent(normalizedContent)) {
    throw new AppError('contentJson must have renderable content to publish a lesson', 400);
  }
}

function sanitizeResources(resources) {
  if (!Array.isArray(resources)) return [];
  return resources
    .map((item) => ({
      label: String(item?.label || '').trim(),
      url: String(item?.url || '').trim(),
    }))
    .filter((item) => item.label || item.url);
}

function sanitizeAssignmentDetails(details) {
  if (!details || typeof details !== 'object') return {};
  return {
    instructions: String(details.instructions || '').trim(),
    dueDate: String(details.dueDate || '').trim(),
  };
}

async function ensureCourseAccess(courseId, actor) {
  const result = await pool.query(
    'SELECT * FROM courses WHERE id = $1 AND is_deleted = FALSE',
    [courseId]
  );
  const course = result.rows[0];
  if (!course) throw new AppError('Course not found', 404);

  const role = String(actor?.role || '').toLowerCase();
  const isPrivileged = ['admin', 'staff'].includes(role);
  if (!isPrivileged && Number(actor?.id) !== Number(course.created_by)) {
    throw new AppError('Not authorized to manage this course', 403);
  }

  return course;
}

async function nextPosition(table, foreignKey, foreignId) {
  const result = await pool.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
     FROM ${table}
     WHERE ${foreignKey} = $1 AND is_deleted = FALSE`,
    [foreignId]
  );
  return Number(result.rows[0]?.next_pos || 0);
}

async function ensureTags(courseId, tags) {
  const normalized = Array.from(
    new Set(
      (Array.isArray(tags) ? tags : [])
        .map((t) => String(t || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );

  await pool.query('DELETE FROM course_tags WHERE course_id = $1', [courseId]);
  for (const tagName of normalized) {
    const tagInsert = await pool.query(
      `INSERT INTO tags (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tagName]
    );
    const tagId = tagInsert.rows[0].id;
    await pool.query(
      `INSERT INTO course_tags (course_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT (course_id, tag_id) DO NOTHING`,
      [courseId, tagId]
    );
  }
}

async function getCourseTags(courseId) {
  const result = await pool.query(
    `SELECT t.name
     FROM course_tags ct
     JOIN tags t ON t.id = ct.tag_id
     WHERE ct.course_id = $1
     ORDER BY t.name ASC`,
    [courseId]
  );
  return result.rows.map((r) => r.name);
}

function mapCourseRow(row, tags = []) {
  return {
    _id: String(row.id),
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    description: row.description || '',
    summary: row.summary || '',
    slug: row.slug,
    category: row.category || '',
    level: row.level,
    language: row.language,
    status: row.status,
    thumbnailUrl: row.thumbnail_url || '',
    bannerUrl: row.banner_url || '',
    instructor: row.instructor || '',
    price: Number(row.price || 0),
    isFree: Boolean(row.is_free),
    durationSeconds: Number(row.duration_seconds || 0),
    tags,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLessonRow(row, videoRow) {
  const fallbackVideoUrl = videoRow?.video_url || '';
  const fallbackVideoDuration = Number(videoRow?.duration_seconds || 0);
  let contentJson = row.content_json;
  if (!contentJson || typeof contentJson !== 'object' || Array.isArray(contentJson)) {
    contentJson = { type: 'doc', content: [] };
  }

  return {
    _id: String(row.id),
    id: row.id,
    title: row.title,
    summary: row.summary || '',
    description: row.description || '',
    contentType: row.content_type || 'video',
    textContent: row.text_content || '',
    contentJson,
    status: String(row.status || 'draft').toLowerCase(),
    thumbnailUrl: row.thumbnail_url || '',
    videoType: String(row.video_type || 'mp4').toLowerCase(),
    version: Number(row.version || 1),
    notesEnabled: Boolean(row.notes_enabled),
    timestampStart: Number(row.timestamp_start || 0),
    timestampEnd: Number(row.timestamp_end || 0),
    timestampNotesEnabled: Boolean(row.timestamp_notes_enabled),
    isFreePreview: Boolean(row.is_free_preview),
    lockedUntilPreviousCompleted: Boolean(row.locked_until_previous_completed),
    quizId: row.quiz_id || '',
    resources: Array.isArray(row.resources) ? row.resources : [],
    assignmentDetails: row.assignment_details || {},
    videoUrl: row.primary_video_url || fallbackVideoUrl,
    videoDuration:
      row.primary_video_duration === null || row.primary_video_duration === undefined
        ? fallbackVideoDuration
        : Number(row.primary_video_duration),
    order: Number(row.position || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getVideoBySubtopicId(subtopicId) {
  const result = await pool.query(
    `SELECT *
     FROM videos
     WHERE subtopic_id = $1 AND is_deleted = FALSE
     ORDER BY position ASC, id ASC
     LIMIT 1`,
    [subtopicId]
  );
  return result.rows[0] || null;
}

async function upsertPrimaryVideo(subtopicId, lessonData) {
  const videoUrl = String(lessonData.videoUrl || '').trim();
  const contentType = String(lessonData.contentType || 'video').trim();
  const duration = Number(lessonData.videoDuration || 0);

  const existing = await getVideoBySubtopicId(subtopicId);
  const shouldPersist = contentType === 'video' || videoUrl;

  if (!shouldPersist) {
    if (existing) {
      await pool.query(
        `UPDATE videos
         SET is_deleted = TRUE,
             deleted_at = NOW()
         WHERE id = $1`,
        [existing.id]
      );
    }
    return null;
  }

  if (existing) {
    const updated = await pool.query(
      `UPDATE videos
       SET title = $1,
           video_url = $2,
           duration_seconds = $3,
           status = $4,
           is_deleted = FALSE,
           deleted_at = NULL
       WHERE id = $5
       RETURNING *`,
      [
        String(lessonData.title || '').trim() || 'Lesson Video',
        videoUrl,
        Number.isFinite(duration) && duration >= 0 ? duration : 0,
        videoUrl ? 'ready' : 'uploading',
        existing.id,
      ]
    );
    return updated.rows[0];
  }

  const created = await pool.query(
    `INSERT INTO videos (
      subtopic_id,
      title,
      video_url,
      duration_seconds,
      position,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      subtopicId,
      String(lessonData.title || '').trim() || 'Lesson Video',
      videoUrl,
      Number.isFinite(duration) && duration >= 0 ? duration : 0,
      0,
      videoUrl ? 'ready' : 'uploading',
    ]
  );

  return created.rows[0];
}

export async function createCourse(payload, actor) {
  const creatorId = Number(actor?.id);
  if (!creatorId) throw new AppError('Creator user not found', 404);

  const title = String(payload.title || '').trim();
  if (!title) throw new AppError('title is required', 400);

  const baseSlug = toSlug(title);
  if (!baseSlug) throw new AppError('Invalid title for slug generation', 400);

  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const conflict = await pool.query(
      'SELECT id FROM courses WHERE slug = $1 LIMIT 1',
      [slug]
    );
    if (conflict.rowCount === 0) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const isFree = payload.isFree === undefined ? true : Boolean(payload.isFree);
  const price = isFree ? 0 : Number(payload.price || 0);

  const inserted = await pool.query(
    `INSERT INTO courses (
      title, subtitle, slug, description, summary, category, level, price, is_free,
      status, thumbnail_url, banner_url, language, instructor, created_by, updated_by
    ) VALUES (
      $1, $2, $3, $4, $5, COALESCE($6, ''), $7, $8, $9,
      $10, $11, $12, $13, $14, $15, $16
    )
    RETURNING *`,
    [
      title,
      String(payload.subtitle || '').trim(),
      slug,
      String(payload.description || '').trim(),
      String(payload.summary || '').trim(),
      String(payload.category ?? '').trim(),
      String(payload.level || 'beginner').toLowerCase(),
      Number.isFinite(price) && price >= 0 ? price : 0,
      isFree,
      String(payload.status || 'draft').toLowerCase(),
      String(payload.thumbnailUrl || '').trim(),
      String(payload.bannerUrl || '').trim(),
      String(payload.language || 'English').trim(),
      String(payload.instructor || '').trim(),
      creatorId,
      creatorId,
    ]
  );

  const course = inserted.rows[0];
  await ensureTags(course.id, payload.tags);
  const tags = await getCourseTags(course.id);
  return mapCourseRow(course, tags);
}

export async function listCourses(query = {}) {
  const conditions = ['is_deleted = FALSE'];
  const params = [];

  if (query.createdBy) {
    params.push(parseId(query.createdBy, 'createdBy'));
    conditions.push(`created_by = $${params.length}`);
  }

  if (query.status) {
    params.push(String(query.status).toLowerCase());
    conditions.push(`status = $${params.length}`);
  } else {
    const includeAll = String(query.includeAll || '').toLowerCase() === 'true';
    if (!includeAll) {
      conditions.push(`status = 'published'`);
    }
  }

  const rows = await pool.query(
    `SELECT *
     FROM courses
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC`
    ,
    params
  );

  const withTags = await Promise.all(
    rows.rows.map(async (row) => mapCourseRow(row, await getCourseTags(row.id)))
  );
  return withTags;
}

export async function getCourseById(courseId) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const result = await pool.query(
    'SELECT * FROM courses WHERE id = $1 AND is_deleted = FALSE',
    [parsedCourseId]
  );
  const row = result.rows[0];
  if (!row) throw new AppError('Course not found', 404);
  return mapCourseRow(row, await getCourseTags(row.id));
}

export async function getCourseWithModules(courseId, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const canSeeDraftLessons = isPrivilegedUser(actor);
  const courseResult = await pool.query(
    'SELECT * FROM courses WHERE id = $1 AND is_deleted = FALSE',
    [parsedCourseId]
  );
  const courseRow = courseResult.rows[0];
  if (!courseRow) throw new AppError('Course not found', 404);

  const moduleResult = await pool.query(
    `SELECT *
     FROM modules
     WHERE course_id = $1 AND is_deleted = FALSE
     ORDER BY position ASC, id ASC`,
    [parsedCourseId]
  );

  const lessonResult = await pool.query(
    `SELECT *
     FROM subtopics
     WHERE module_id = ANY($1::bigint[])
       AND ($2::boolean = TRUE OR status = 'published')
       AND is_deleted = FALSE
     ORDER BY module_id ASC, position ASC, id ASC`,
    [moduleResult.rows.map((m) => m.id), canSeeDraftLessons]
  );

  const lessonByModule = new Map();
  for (const lessonRow of lessonResult.rows) {
    const video = await getVideoBySubtopicId(lessonRow.id);
    const mapped = mapLessonRow(lessonRow, video);
    const bucket = lessonByModule.get(lessonRow.module_id) || [];
    bucket.push(mapped);
    lessonByModule.set(lessonRow.module_id, bucket);
  }

  const modules = moduleResult.rows.map((m) => ({
    _id: String(m.id),
    id: m.id,
    title: m.title,
    description: m.description || '',
    order: Number(m.position || 0),
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    lessons: lessonByModule.get(m.id) || [],
  }));

  return {
    ...mapCourseRow(courseRow, await getCourseTags(courseRow.id)),
    modules,
  };
}

export async function getModule(moduleId, actor) {
  const parsedModuleId = parseId(moduleId, 'moduleId');
  const canSeeDraftLessons = isPrivilegedUser(actor);
  const moduleResult = await pool.query(
    `SELECT *
     FROM modules
     WHERE id = $1 AND is_deleted = FALSE`,
    [parsedModuleId]
  );
  const moduleRow = moduleResult.rows[0];
  if (!moduleRow) throw new AppError('Module not found', 404);

  const lessonResult = await pool.query(
    `SELECT *
     FROM subtopics
     WHERE module_id = $1
       AND ($2::boolean = TRUE OR status = 'published')
       AND is_deleted = FALSE
     ORDER BY position ASC, id ASC`,
    [parsedModuleId, canSeeDraftLessons]
  );

  const lessons = [];
  for (const row of lessonResult.rows) {
    const video = await getVideoBySubtopicId(row.id);
    lessons.push(mapLessonRow(row, video));
  }

  return {
    _id: String(moduleRow.id),
    id: moduleRow.id,
    courseId: moduleRow.course_id,
    title: moduleRow.title,
    description: moduleRow.description || '',
    order: Number(moduleRow.position || 0),
    lessons,
    createdAt: moduleRow.created_at,
    updatedAt: moduleRow.updated_at,
  };
}

export async function getLesson(moduleId, lessonId, actor) {
  const parsedModuleId = parseId(moduleId, 'moduleId');
  const parsedLessonId = parseId(lessonId, 'lessonId');
  const canSeeDraftLessons = isPrivilegedUser(actor);

  const lessonResult = await pool.query(
    `SELECT *
     FROM subtopics
     WHERE id = $1
       AND module_id = $2
       AND ($3::boolean = TRUE OR status = 'published')
       AND is_deleted = FALSE`,
    [parsedLessonId, parsedModuleId, canSeeDraftLessons]
  );
  const lessonRow = lessonResult.rows[0];
  if (!lessonRow) throw new AppError('Lesson not found', 404);

  const video = await getVideoBySubtopicId(parsedLessonId);
  return mapLessonRow(lessonRow, video);
}

export async function updateCourse(courseId, updates, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const current = await ensureCourseAccess(parsedCourseId, actor);

  const title = updates.title !== undefined ? String(updates.title || '').trim() : current.title;
  if (!title) throw new AppError('title is required', 400);

  let slug = current.slug;
  if (title !== current.title) {
    const baseSlug = toSlug(title);
    if (!baseSlug) throw new AppError('Invalid title for slug generation', 400);

    slug = baseSlug;
    let suffix = 1;
    while (true) {
      const conflict = await pool.query(
        'SELECT id FROM courses WHERE slug = $1 AND id <> $2 LIMIT 1',
        [slug, parsedCourseId]
      );
      if (conflict.rowCount === 0) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
  }

  const isFree = updates.isFree !== undefined ? Boolean(updates.isFree) : Boolean(current.is_free);
  const priceInput = updates.price !== undefined ? Number(updates.price) : Number(current.price || 0);
  const price = isFree ? 0 : (Number.isFinite(priceInput) && priceInput >= 0 ? priceInput : 0);

  const updated = await pool.query(
    `UPDATE courses
     SET title = $1,
         subtitle = $2,
         slug = $3,
         description = $4,
         summary = $5,
         category = COALESCE($6, ''),
         level = $7,
         price = $8,
         is_free = $9,
         status = $10,
         thumbnail_url = $11,
         banner_url = $12,
         language = $13,
         instructor = $14,
         updated_by = $15
     WHERE id = $16
     RETURNING *`,
    [
      title,
      updates.subtitle !== undefined ? String(updates.subtitle || '').trim() : current.subtitle,
      slug,
      updates.description !== undefined ? String(updates.description || '').trim() : current.description,
      updates.summary !== undefined ? String(updates.summary || '').trim() : current.summary,
      updates.category !== undefined
        ? String(updates.category ?? '').trim()
        : String(current.category ?? '').trim(),
      updates.level !== undefined ? String(updates.level || '').toLowerCase() : current.level,
      price,
      isFree,
      updates.status !== undefined ? String(updates.status || '').toLowerCase() : current.status,
      updates.thumbnailUrl !== undefined ? String(updates.thumbnailUrl || '').trim() : current.thumbnail_url,
      updates.bannerUrl !== undefined ? String(updates.bannerUrl || '').trim() : current.banner_url,
      updates.language !== undefined ? String(updates.language || '').trim() : current.language,
      updates.instructor !== undefined ? String(updates.instructor || '').trim() : current.instructor,
      Number(actor.id),
      parsedCourseId,
    ]
  );

  if (updates.tags !== undefined) {
    await ensureTags(parsedCourseId, updates.tags);
  }

  return mapCourseRow(updated.rows[0], await getCourseTags(parsedCourseId));
}

export async function deleteCourse(courseId, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  await ensureCourseAccess(parsedCourseId, actor);

  await pool.query(
    `UPDATE courses
     SET is_deleted = TRUE,
         deleted_at = NOW(),
         updated_by = $1
     WHERE id = $2`,
    [Number(actor.id), parsedCourseId]
  );

  return { success: true, message: 'Course deleted successfully' };
}

export async function createModule(courseId, moduleData, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  await ensureCourseAccess(parsedCourseId, actor);

  const title = String(moduleData.title || '').trim();
  if (!title) throw new AppError('Module title is required', 400);

  const position = moduleData.order !== undefined
    ? Number(moduleData.order)
    : await nextPosition('modules', 'course_id', parsedCourseId);

  const inserted = await pool.query(
    `INSERT INTO modules (course_id, title, description, position)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      parsedCourseId,
      title,
      String(moduleData.description || '').trim(),
      Number.isFinite(position) && position >= 0 ? position : 0,
    ]
  );

  const row = inserted.rows[0];
  return {
    _id: String(row.id),
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description || '',
    order: Number(row.position || 0),
    lessons: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateModule(courseId, moduleId, updates, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const parsedModuleId = parseId(moduleId, 'moduleId');
  await ensureCourseAccess(parsedCourseId, actor);

  const existing = await pool.query(
    `SELECT * FROM modules
     WHERE id = $1 AND course_id = $2 AND is_deleted = FALSE`,
    [parsedModuleId, parsedCourseId]
  );
  const moduleRow = existing.rows[0];
  if (!moduleRow) throw new AppError('Module not found', 404);

  const updated = await pool.query(
    `UPDATE modules
     SET title = $1,
         description = $2,
         position = $3
     WHERE id = $4
     RETURNING *`,
    [
      updates.title !== undefined ? String(updates.title || '').trim() : moduleRow.title,
      updates.description !== undefined ? String(updates.description || '').trim() : moduleRow.description,
      updates.order !== undefined && Number.isFinite(Number(updates.order)) && Number(updates.order) >= 0
        ? Number(updates.order)
        : moduleRow.position,
      parsedModuleId,
    ]
  );

  const row = updated.rows[0];
  return {
    _id: String(row.id),
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description || '',
    order: Number(row.position || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function deleteModule(courseId, moduleId, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const parsedModuleId = parseId(moduleId, 'moduleId');
  await ensureCourseAccess(parsedCourseId, actor);

  const result = await pool.query(
    `UPDATE modules
     SET is_deleted = TRUE,
         deleted_at = NOW()
     WHERE id = $1 AND course_id = $2 AND is_deleted = FALSE
     RETURNING id`,
    [parsedModuleId, parsedCourseId]
  );

  if (result.rowCount === 0) throw new AppError('Module not found', 404);
  return { success: true, message: 'Module deleted successfully' };
}

export async function createLesson(courseId, moduleId, lessonData, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const parsedModuleId = parseId(moduleId, 'moduleId');
  await ensureCourseAccess(parsedCourseId, actor);

  const moduleCheck = await pool.query(
    `SELECT id FROM modules
     WHERE id = $1 AND course_id = $2 AND is_deleted = FALSE`,
    [parsedModuleId, parsedCourseId]
  );
  if (moduleCheck.rowCount === 0) throw new AppError('Module not found', 404);

  const title = String(lessonData.title || '').trim();
  if (!title) throw new AppError('Lesson title is required', 400);
  assertPublishableLesson({ ...lessonData, title });

  const position = lessonData.order !== undefined
    ? Number(lessonData.order)
    : await nextPosition('subtopics', 'module_id', parsedModuleId);

  const inserted = await pool.query(
    `INSERT INTO subtopics (
      module_id,
      title,
      summary,
      description,
      content_type,
      text_content,
      content_json,
      status,
      primary_video_url,
      primary_video_duration,
      thumbnail_url,
      video_type,
      version,
      notes_enabled,
      timestamp_start,
      timestamp_end,
      timestamp_notes_enabled,
      is_free_preview,
      locked_until_previous_completed,
      quiz_id,
      resources,
      assignment_details,
      position
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20::jsonb, $21::jsonb, $22
    )
    RETURNING *`,
    [
      parsedModuleId,
      title,
      normalizeSummary(lessonData.summary),
      String(lessonData.description || '').trim(),
      String(lessonData.contentType || 'video').trim(),
      String(lessonData.textContent || ''),
      JSON.stringify(normalizeContentJson(lessonData.contentJson)),
      normalizeLessonStatus(lessonData.status, 'draft'),
      String(lessonData.videoUrl || '').trim(),
      Number(lessonData.videoDuration || 0),
      String(lessonData.thumbnailUrl || '').trim(),
      normalizeVideoType(lessonData.videoType, 'mp4'),
      normalizeVersion(lessonData.version, 1),
      toBool(lessonData.notesEnabled, true),
      Number(lessonData.timestampStart || 0),
      Number(lessonData.timestampEnd || 0),
      toBool(lessonData.timestampNotesEnabled, false),
      toBool(lessonData.isFreePreview, false),
      toBool(lessonData.lockedUntilPreviousCompleted, false),
      String(lessonData.quizId || '').trim() || null,
      JSON.stringify(sanitizeResources(lessonData.resources)),
      JSON.stringify(sanitizeAssignmentDetails(lessonData.assignmentDetails)),
      Number.isFinite(position) && position >= 0 ? position : 0,
    ]
  );

  const row = inserted.rows[0];
  const video = await upsertPrimaryVideo(row.id, lessonData);
  return mapLessonRow(row, video);
}

export async function updateLesson(courseId, moduleId, lessonId, updates, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const parsedModuleId = parseId(moduleId, 'moduleId');
  const parsedLessonId = parseId(lessonId, 'lessonId');
  await ensureCourseAccess(parsedCourseId, actor);

  const existing = await pool.query(
    `SELECT s.*
     FROM subtopics s
     JOIN modules m ON m.id = s.module_id
     WHERE s.id = $1
       AND s.module_id = $2
       AND m.course_id = $3
       AND s.is_deleted = FALSE
       AND m.is_deleted = FALSE`,
    [parsedLessonId, parsedModuleId, parsedCourseId]
  );
  const lessonRow = existing.rows[0];
  if (!lessonRow) throw new AppError('Lesson not found', 404);
  assertPublishableLesson({
    ...lessonRow,
    ...updates,
    videoUrl: updates.videoUrl !== undefined ? updates.videoUrl : lessonRow.primary_video_url,
    contentJson: updates.contentJson !== undefined ? updates.contentJson : lessonRow.content_json,
    summary: updates.summary !== undefined ? updates.summary : lessonRow.summary,
    status: updates.status !== undefined ? updates.status : lessonRow.status,
    title: updates.title !== undefined ? updates.title : lessonRow.title,
  });

  const updated = await pool.query(
    `UPDATE subtopics
     SET title = $1,
         summary = $2,
         description = $3,
         content_type = $4,
         text_content = $5,
         content_json = $6::jsonb,
         status = $7,
         primary_video_url = $8,
         primary_video_duration = $9,
         thumbnail_url = $10,
         video_type = $11,
         version = $12,
         notes_enabled = $13,
         timestamp_start = $14,
         timestamp_end = $15,
         timestamp_notes_enabled = $16,
         is_free_preview = $17,
         locked_until_previous_completed = $18,
         quiz_id = $19,
         resources = $20::jsonb,
         assignment_details = $21::jsonb,
         position = $22
     WHERE id = $23
     RETURNING *`,
    [
      updates.title !== undefined ? String(updates.title || '').trim() : lessonRow.title,
      updates.summary !== undefined ? normalizeSummary(updates.summary) : normalizeSummary(lessonRow.summary),
      updates.description !== undefined ? String(updates.description || '').trim() : lessonRow.description,
      updates.contentType !== undefined ? String(updates.contentType || 'video').trim() : lessonRow.content_type,
      updates.textContent !== undefined ? String(updates.textContent || '') : lessonRow.text_content,
      JSON.stringify(
        updates.contentJson !== undefined
          ? normalizeContentJson(updates.contentJson)
          : normalizeContentJson(lessonRow.content_json)
      ),
      updates.status !== undefined
        ? normalizeLessonStatus(updates.status, 'draft')
        : normalizeLessonStatus(lessonRow.status, 'draft'),
      updates.videoUrl !== undefined ? String(updates.videoUrl || '').trim() : (lessonRow.primary_video_url || ''),
      updates.videoDuration !== undefined
        ? Math.max(0, Number(updates.videoDuration || 0))
        : Math.max(0, Number(lessonRow.primary_video_duration || 0)),
      updates.thumbnailUrl !== undefined ? String(updates.thumbnailUrl || '').trim() : (lessonRow.thumbnail_url || ''),
      updates.videoType !== undefined
        ? normalizeVideoType(updates.videoType, 'mp4')
        : normalizeVideoType(lessonRow.video_type, 'mp4'),
      updates.version !== undefined
        ? normalizeVersion(updates.version, Number(lessonRow.version || 1))
        : Number(lessonRow.version || 1),
      updates.notesEnabled !== undefined ? toBool(updates.notesEnabled, true) : lessonRow.notes_enabled,
      updates.timestampStart !== undefined ? Number(updates.timestampStart || 0) : lessonRow.timestamp_start,
      updates.timestampEnd !== undefined ? Number(updates.timestampEnd || 0) : lessonRow.timestamp_end,
      updates.timestampNotesEnabled !== undefined ? toBool(updates.timestampNotesEnabled, false) : lessonRow.timestamp_notes_enabled,
      updates.isFreePreview !== undefined ? toBool(updates.isFreePreview, false) : lessonRow.is_free_preview,
      updates.lockedUntilPreviousCompleted !== undefined
        ? toBool(updates.lockedUntilPreviousCompleted, false)
        : lessonRow.locked_until_previous_completed,
      updates.quizId !== undefined ? String(updates.quizId || '').trim() || null : lessonRow.quiz_id,
      updates.resources !== undefined
        ? JSON.stringify(sanitizeResources(updates.resources))
        : JSON.stringify(Array.isArray(lessonRow.resources) ? lessonRow.resources : []),
      updates.assignmentDetails !== undefined
        ? JSON.stringify(sanitizeAssignmentDetails(updates.assignmentDetails))
        : JSON.stringify(lessonRow.assignment_details || {}),
      updates.order !== undefined && Number.isFinite(Number(updates.order)) && Number(updates.order) >= 0
        ? Number(updates.order)
        : lessonRow.position,
      parsedLessonId,
    ]
  );

  const mergedForVideo = {
    title: updates.title !== undefined ? updates.title : lessonRow.title,
    contentType: updates.contentType !== undefined ? updates.contentType : lessonRow.content_type,
    videoUrl: updates.videoUrl,
    videoDuration: updates.videoDuration,
  };
  const video = await upsertPrimaryVideo(parsedLessonId, mergedForVideo);

  return mapLessonRow(updated.rows[0], video);
}

export async function deleteLesson(courseId, moduleId, lessonId, actor) {
  const parsedCourseId = parseId(courseId, 'courseId');
  const parsedModuleId = parseId(moduleId, 'moduleId');
  const parsedLessonId = parseId(lessonId, 'lessonId');
  await ensureCourseAccess(parsedCourseId, actor);

  const result = await pool.query(
    `UPDATE subtopics s
     SET is_deleted = TRUE,
         deleted_at = NOW()
     FROM modules m
     WHERE s.id = $1
       AND s.module_id = $2
       AND s.module_id = m.id
       AND m.course_id = $3
       AND s.is_deleted = FALSE
     RETURNING s.id`,
    [parsedLessonId, parsedModuleId, parsedCourseId]
  );

  if (result.rowCount === 0) throw new AppError('Lesson not found', 404);

  await pool.query(
    `UPDATE videos
     SET is_deleted = TRUE,
         deleted_at = NOW()
     WHERE subtopic_id = $1`,
    [parsedLessonId]
  );

  return { success: true, message: 'Lesson deleted successfully' };
}
