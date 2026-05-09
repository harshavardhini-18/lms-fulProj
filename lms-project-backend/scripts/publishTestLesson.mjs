import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || process.env.PGUSER || 'postgres',
  host: process.env.POSTGRES_HOST || process.env.PGHOST || 'localhost',
  database: process.env.POSTGRES_DB || process.env.PGDATABASE || 'elearning_db',
  password: process.env.POSTGRES_PASSWORD ?? process.env.PGPASSWORD,
  port: Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432),
});

const DEFAULT_VIDEO_URL =
  process.env.TEST_LESSON_VIDEO_URL ||
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const DEFAULT_CONTENT_JSON = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Welcome to this lesson' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is a sample lesson body rendered from Tiptap-style JSON stored as JSONB in Postgres. ',
        },
        {
          type: 'text',
          marks: [{ type: 'bold' }],
          text: 'Bold works.',
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Point one' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Point two' }],
            },
          ],
        },
      ],
    },
  ],
};

async function publishLesson(lessonId) {
  const id = Number.parseInt(String(lessonId), 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Provide a valid numeric lesson id as the first CLI argument.');
  }

  const existing = await pool.query(
    `SELECT id, title, summary, primary_video_url, content_json, status
     FROM subtopics
     WHERE id = $1 AND is_deleted = FALSE`,
    [id]
  );

  if (existing.rowCount === 0) {
    throw new Error(`Lesson ${id} not found or already deleted.`);
  }

  const lesson = existing.rows[0];
  const nextSummary =
    String(lesson.summary || '').trim() || 'Sample lesson summary for staging validation.';
  const nextVideoUrl = String(lesson.primary_video_url || '').trim() || DEFAULT_VIDEO_URL;
  const nextContentJson = (() => {
    const current = lesson.content_json;
    if (
      current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      current.type === 'doc' &&
      Array.isArray(current.content) &&
      current.content.length > 0
    ) {
      return current;
    }
    return DEFAULT_CONTENT_JSON;
  })();

  const updated = await pool.query(
    `UPDATE subtopics
     SET summary = $1,
         primary_video_url = $2,
         content_json = $3::jsonb,
         status = 'published'
     WHERE id = $4
     RETURNING id, title, status, primary_video_url, content_json`,
    [nextSummary, nextVideoUrl, JSON.stringify(nextContentJson), id]
  );

  console.log('Lesson published successfully:');
  console.log(JSON.stringify(updated.rows[0], null, 2));
}

const lessonIdArg = process.argv[2];

publishLesson(lessonIdArg)
  .catch((error) => {
    console.error('Publish helper failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
