import { pool } from '../config/postgres.js';

export async function ensureCourseSchema() {
	await pool.query(`
		CREATE OR REPLACE FUNCTION set_updated_at()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = NOW();
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS courses (
			id BIGSERIAL PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			subtitle VARCHAR(255) NOT NULL DEFAULT '',
			slug VARCHAR(255) NOT NULL UNIQUE,
			description TEXT NOT NULL DEFAULT '',
			summary TEXT NOT NULL DEFAULT '',
			category VARCHAR(100) NOT NULL DEFAULT '',
			level VARCHAR(50) NOT NULL DEFAULT 'beginner'
				CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
			price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
			status VARCHAR(20) NOT NULL DEFAULT 'draft'
				CHECK (status IN ('draft', 'published', 'archived')),
			thumbnail_url TEXT NOT NULL DEFAULT '',
			banner_url TEXT NOT NULL DEFAULT '',
			language VARCHAR(50) NOT NULL DEFAULT 'English',
			instructor VARCHAR(120) NOT NULL DEFAULT '',
			duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
			is_free BOOLEAN NOT NULL DEFAULT TRUE,
			rating NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
			rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
			created_by BIGINT NOT NULL REFERENCES users(id),
			updated_by BIGINT NULL REFERENCES users(id),
			is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
			deleted_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);

	await pool.query(`
		ALTER TABLE courses
		ADD COLUMN IF NOT EXISTS instructor VARCHAR(120) NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE courses
		ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255) NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE courses
		ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE courses
		ADD COLUMN IF NOT EXISTS banner_url TEXT NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE courses
		ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT TRUE
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS modules (
			id BIGSERIAL PRIMARY KEY,
			course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
			title VARCHAR(255) NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			position INTEGER NOT NULL CHECK (position >= 0),
			is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
			deleted_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS subtopics (
			id BIGSERIAL PRIMARY KEY,
			module_id BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
			title VARCHAR(255) NOT NULL,
			summary TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			content_type VARCHAR(30) NOT NULL DEFAULT 'video',
			text_content TEXT NOT NULL DEFAULT '',
			content_json JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
			status VARCHAR(20) NOT NULL DEFAULT 'draft'
				CHECK (status IN ('draft', 'published')),
			primary_video_url TEXT NOT NULL DEFAULT '',
			primary_video_duration INTEGER NOT NULL DEFAULT 0 CHECK (primary_video_duration >= 0),
			thumbnail_url TEXT NOT NULL DEFAULT '',
			video_type VARCHAR(20) NOT NULL DEFAULT 'mp4'
				CHECK (video_type IN ('mp4', 'hls')),
			version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
			notes_enabled BOOLEAN NOT NULL DEFAULT TRUE,
			timestamp_start INTEGER NOT NULL DEFAULT 0 CHECK (timestamp_start >= 0),
			timestamp_end INTEGER NOT NULL DEFAULT 0 CHECK (timestamp_end >= 0),
			timestamp_notes_enabled BOOLEAN NOT NULL DEFAULT FALSE,
			is_free_preview BOOLEAN NOT NULL DEFAULT FALSE,
			locked_until_previous_completed BOOLEAN NOT NULL DEFAULT FALSE,
			quiz_id VARCHAR(120) NULL,
			resources JSONB NOT NULL DEFAULT '[]'::jsonb,
			assignment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
			position INTEGER NOT NULL CHECK (position >= 0),
			is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
			deleted_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT ''
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'subtopics_summary_length_check'
			) THEN
				ALTER TABLE subtopics
				ADD CONSTRAINT subtopics_summary_length_check
				CHECK (char_length(summary) <= 500);
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS content_type VARCHAR(30) NOT NULL DEFAULT 'video'
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS text_content TEXT NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS content_json JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft'
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'subtopics_status_check'
			) THEN
				ALTER TABLE subtopics
				ADD CONSTRAINT subtopics_status_check
				CHECK (status IN ('draft', 'published'));
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS primary_video_url TEXT NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS primary_video_duration INTEGER NOT NULL DEFAULT 0
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'subtopics_primary_video_duration_check'
			) THEN
				ALTER TABLE subtopics
				ADD CONSTRAINT subtopics_primary_video_duration_check
				CHECK (primary_video_duration >= 0);
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT ''
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) NOT NULL DEFAULT 'mp4'
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'subtopics_video_type_check'
			) THEN
				ALTER TABLE subtopics
				ADD CONSTRAINT subtopics_video_type_check
				CHECK (video_type IN ('mp4', 'hls'));
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'subtopics_version_check'
			) THEN
				ALTER TABLE subtopics
				ADD CONSTRAINT subtopics_version_check
				CHECK (version > 0);
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS notes_enabled BOOLEAN NOT NULL DEFAULT TRUE
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS timestamp_start INTEGER NOT NULL DEFAULT 0
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS timestamp_end INTEGER NOT NULL DEFAULT 0
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS timestamp_notes_enabled BOOLEAN NOT NULL DEFAULT FALSE
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN NOT NULL DEFAULT FALSE
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS locked_until_previous_completed BOOLEAN NOT NULL DEFAULT FALSE
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS quiz_id VARCHAR(120) NULL
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb
	`);

	await pool.query(`
		ALTER TABLE subtopics
		ADD COLUMN IF NOT EXISTS assignment_details JSONB NOT NULL DEFAULT '{}'::jsonb
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS videos (
			id BIGSERIAL PRIMARY KEY,
			subtopic_id BIGINT NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
			title VARCHAR(255) NOT NULL,
			video_url TEXT NOT NULL,
			storage_key TEXT NOT NULL DEFAULT '',
			duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
			position INTEGER NOT NULL CHECK (position >= 0),
			file_size_bytes BIGINT NULL CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
			mime_type VARCHAR(120) NOT NULL DEFAULT '',
			thumbnail_url TEXT NOT NULL DEFAULT '',
			status VARCHAR(20) NOT NULL DEFAULT 'ready'
				CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
			is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
			deleted_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS tags (
			id BIGSERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL UNIQUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS course_tags (
			course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
			tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (course_id, tag_id)
		)
	`);

	await pool.query(`
		CREATE UNIQUE INDEX IF NOT EXISTS uq_modules_course_position_active
		ON modules(course_id, position)
		WHERE is_deleted = FALSE
	`);

	await pool.query(`
		CREATE UNIQUE INDEX IF NOT EXISTS uq_subtopics_module_position_active
		ON subtopics(module_id, position)
		WHERE is_deleted = FALSE
	`);

	await pool.query(`
		CREATE UNIQUE INDEX IF NOT EXISTS uq_videos_subtopic_position_active
		ON videos(subtopic_id, position)
		WHERE is_deleted = FALSE
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_courses_status_deleted_created
		ON courses(status, is_deleted, created_at DESC)
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_courses_created_by
		ON courses(created_by)
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_modules_course_active
		ON modules(course_id, is_deleted, position)
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_subtopics_module_active
		ON subtopics(module_id, is_deleted, position)
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_subtopics_status_active
		ON subtopics(status, is_deleted, module_id, position)
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_videos_subtopic_active
		ON videos(subtopic_id, is_deleted, position)
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_trigger
				WHERE tgname = 'courses_set_updated_at'
			) THEN
				CREATE TRIGGER courses_set_updated_at
				BEFORE UPDATE ON courses
				FOR EACH ROW
				EXECUTE FUNCTION set_updated_at();
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_trigger
				WHERE tgname = 'modules_set_updated_at'
			) THEN
				CREATE TRIGGER modules_set_updated_at
				BEFORE UPDATE ON modules
				FOR EACH ROW
				EXECUTE FUNCTION set_updated_at();
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_trigger
				WHERE tgname = 'subtopics_set_updated_at'
			) THEN
				CREATE TRIGGER subtopics_set_updated_at
				BEFORE UPDATE ON subtopics
				FOR EACH ROW
				EXECUTE FUNCTION set_updated_at();
			END IF;
		END;
		$$;
	`);

	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_trigger
				WHERE tgname = 'videos_set_updated_at'
			) THEN
				CREATE TRIGGER videos_set_updated_at
				BEFORE UPDATE ON videos
				FOR EACH ROW
				EXECUTE FUNCTION set_updated_at();
			END IF;
		END;
		$$;
	`);
}
