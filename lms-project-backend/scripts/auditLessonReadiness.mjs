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

async function runAudit() {
  const summarySql = `
    WITH active_lessons AS (
      SELECT
        s.id,
        s.title,
        s.status,
        s.primary_video_url,
        s.content_json
      FROM subtopics s
      JOIN modules m ON m.id = s.module_id AND m.is_deleted = FALSE
      JOIN courses c ON c.id = m.course_id AND c.is_deleted = FALSE
      WHERE s.is_deleted = FALSE
    ),
    checks AS (
      SELECT
        id,
        title,
        status,
        CASE WHEN COALESCE(BTRIM(primary_video_url), '') = '' THEN TRUE ELSE FALSE END AS missing_video,
        CASE
          WHEN content_json IS NULL
            OR jsonb_typeof(content_json) <> 'object'
            OR COALESCE(content_json->>'type', '') <> 'doc'
            OR jsonb_typeof(content_json->'content') <> 'array'
          THEN TRUE
          ELSE FALSE
        END AS invalid_content_json
      FROM active_lessons
    )
    SELECT
      COUNT(*)::int AS total_active_lessons,
      COUNT(*) FILTER (WHERE status = 'published')::int AS published_lessons,
      COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_lessons,
      COUNT(*) FILTER (WHERE status = 'published' AND missing_video)::int AS published_missing_video,
      COUNT(*) FILTER (WHERE status = 'published' AND invalid_content_json)::int AS published_invalid_content_json,
      COUNT(*) FILTER (WHERE status = 'draft' AND missing_video)::int AS draft_missing_video,
      COUNT(*) FILTER (WHERE status = 'draft' AND invalid_content_json)::int AS draft_invalid_content_json
    FROM checks;
  `;

  const publishedIssuesSql = `
    WITH active_lessons AS (
      SELECT
        s.id,
        s.title,
        s.status,
        s.primary_video_url,
        s.content_json
      FROM subtopics s
      JOIN modules m ON m.id = s.module_id AND m.is_deleted = FALSE
      JOIN courses c ON c.id = m.course_id AND c.is_deleted = FALSE
      WHERE s.is_deleted = FALSE
    )
    SELECT
      id,
      title,
      CASE WHEN COALESCE(BTRIM(primary_video_url), '') = '' THEN TRUE ELSE FALSE END AS missing_video,
      CASE
        WHEN content_json IS NULL
          OR jsonb_typeof(content_json) <> 'object'
          OR COALESCE(content_json->>'type', '') <> 'doc'
          OR jsonb_typeof(content_json->'content') <> 'array'
        THEN TRUE
        ELSE FALSE
      END AS invalid_content_json
    FROM active_lessons
    WHERE status = 'published'
      AND (
        COALESCE(BTRIM(primary_video_url), '') = ''
        OR content_json IS NULL
        OR jsonb_typeof(content_json) <> 'object'
        OR COALESCE(content_json->>'type', '') <> 'doc'
        OR jsonb_typeof(content_json->'content') <> 'array'
      )
    ORDER BY id ASC
    LIMIT 25;
  `;

  const [{ rows: summaryRows }, { rows: publishedIssuesRows }] = await Promise.all([
    pool.query(summarySql),
    pool.query(publishedIssuesSql),
  ]);

  console.log('Lesson readiness summary:');
  console.log(JSON.stringify(summaryRows[0], null, 2));

  if (publishedIssuesRows.length > 0) {
    console.log('\nPublished lessons with readiness issues (up to 25):');
    console.log(JSON.stringify(publishedIssuesRows, null, 2));
  } else {
    console.log('\nNo published readiness issues found.');
  }
}

runAudit()
  .catch((error) => {
    console.error('Readiness audit failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
