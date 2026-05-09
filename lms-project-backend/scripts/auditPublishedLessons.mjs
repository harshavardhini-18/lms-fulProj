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
    WITH published_lessons AS (
      SELECT
        s.id,
        s.title,
        s.primary_video_url,
        s.content_json
      FROM subtopics s
      JOIN modules m ON m.id = s.module_id AND m.is_deleted = FALSE
      JOIN courses c ON c.id = m.course_id AND c.is_deleted = FALSE
      WHERE s.is_deleted = FALSE
        AND s.status = 'published'
    )
    SELECT
      COUNT(*)::int AS total_published_lessons,
      COALESCE(SUM(CASE WHEN COALESCE(BTRIM(primary_video_url), '') = '' THEN 1 ELSE 0 END), 0)::int AS missing_primary_video_url,
      COALESCE(SUM(
        CASE
          WHEN content_json IS NULL
            OR jsonb_typeof(content_json) <> 'object'
            OR COALESCE(content_json->>'type', '') <> 'doc'
            OR jsonb_typeof(content_json->'content') <> 'array'
          THEN 1
          ELSE 0
        END
      ), 0)::int AS invalid_content_json_shape
    FROM published_lessons;
  `;

  const problematicRowsSql = `
    WITH published_lessons AS (
      SELECT
        s.id,
        s.title,
        s.primary_video_url,
        s.content_json
      FROM subtopics s
      JOIN modules m ON m.id = s.module_id AND m.is_deleted = FALSE
      JOIN courses c ON c.id = m.course_id AND c.is_deleted = FALSE
      WHERE s.is_deleted = FALSE
        AND s.status = 'published'
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
    FROM published_lessons
    WHERE
      COALESCE(BTRIM(primary_video_url), '') = ''
      OR content_json IS NULL
      OR jsonb_typeof(content_json) <> 'object'
      OR COALESCE(content_json->>'type', '') <> 'doc'
      OR jsonb_typeof(content_json->'content') <> 'array'
    ORDER BY id ASC
    LIMIT 25;
  `;

  const [{ rows: summaryRows }, { rows: problematicRows }] = await Promise.all([
    pool.query(summarySql),
    pool.query(problematicRowsSql),
  ]);

  console.log('Published lesson audit summary:');
  console.log(JSON.stringify(summaryRows[0], null, 2));

  if (problematicRows.length > 0) {
    console.log('\nSample problematic lessons (up to 25):');
    console.log(JSON.stringify(problematicRows, null, 2));
  } else {
    console.log('\nNo problematic published lessons found.');
  }
}

runAudit()
  .catch((error) => {
    console.error('Audit failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
