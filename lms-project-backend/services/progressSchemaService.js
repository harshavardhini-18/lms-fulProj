import { pool } from '../config/postgres.js';

/**
 * Course + in-lesson quiz progress (PostgreSQL).
 *
 * student_course_progress  — rollup per user + course (completion %)
 * student_lesson_progress  — per topic/subtopic (watch + linked quiz)
 * quiz_attempt_answers     — per-question marks + student vs correct answer
 * quiz_attempts            — extended with course_id / subtopic_id when quiz is on a topic
 */
export async function ensureProgressSchema() {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS student_course_progress (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
			status VARCHAR(20) NOT NULL DEFAULT 'enrolled'
				CHECK (status IN ('enrolled', 'in_progress', 'completed')),
			lessons_total INTEGER NOT NULL DEFAULT 0 CHECK (lessons_total >= 0),
			lessons_completed INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
			quizzes_total INTEGER NOT NULL DEFAULT 0 CHECK (quizzes_total >= 0),
			quizzes_passed INTEGER NOT NULL DEFAULT 0 CHECK (quizzes_passed >= 0),
			completion_percent SMALLINT NOT NULL DEFAULT 0
				CHECK (completion_percent >= 0 AND completion_percent <= 100),
			last_subtopic_id BIGINT NULL REFERENCES subtopics(id) ON DELETE SET NULL,
			last_watched_seconds INTEGER NOT NULL DEFAULT 0 CHECK (last_watched_seconds >= 0),
			enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			completed_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (user_id, course_id)
		)
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS student_lesson_progress (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
			module_id BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
			subtopic_id BIGINT NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
			is_content_completed BOOLEAN NOT NULL DEFAULT FALSE,
			content_completed_at TIMESTAMPTZ NULL,
			watch_seconds INTEGER NOT NULL DEFAULT 0 CHECK (watch_seconds >= 0),
			quiz_required BOOLEAN NOT NULL DEFAULT FALSE,
			quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
			quiz_best_score_percent SMALLINT NOT NULL DEFAULT 0
				CHECK (quiz_best_score_percent >= 0 AND quiz_best_score_percent <= 100),
			quiz_best_score_earned NUMERIC(10, 2) NOT NULL DEFAULT 0,
			quiz_best_max_points NUMERIC(10, 2) NOT NULL DEFAULT 0,
			quiz_attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (quiz_attempts_count >= 0),
			last_quiz_attempt_id BIGINT NULL REFERENCES quiz_attempts(id) ON DELETE SET NULL,
			lesson_completed BOOLEAN NOT NULL DEFAULT FALSE,
			lesson_completed_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (user_id, subtopic_id)
		)
	`);

	await pool.query(`
		CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
			id BIGSERIAL PRIMARY KEY,
			attempt_id BIGINT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
			question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
			position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
			question_type VARCHAR(40) NOT NULL DEFAULT '',
			student_answer JSONB NULL,
			correct_answer JSONB NOT NULL DEFAULT 'null'::jsonb,
			student_answer_label TEXT NOT NULL DEFAULT '',
			correct_answer_label TEXT NOT NULL DEFAULT '',
			is_correct BOOLEAN NOT NULL DEFAULT FALSE,
			is_skipped BOOLEAN NOT NULL DEFAULT FALSE,
			points_earned NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
			points_max NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (points_max >= 0),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (attempt_id, question_id)
		)
	`);

	await pool.query(`
		ALTER TABLE quiz_attempts
		ADD COLUMN IF NOT EXISTS course_id BIGINT NULL REFERENCES courses(id) ON DELETE SET NULL
	`);
	await pool.query(`
		ALTER TABLE quiz_attempts
		ADD COLUMN IF NOT EXISTS module_id BIGINT NULL REFERENCES modules(id) ON DELETE SET NULL
	`);
	await pool.query(`
		ALTER TABLE quiz_attempts
		ADD COLUMN IF NOT EXISTS subtopic_id BIGINT NULL REFERENCES subtopics(id) ON DELETE SET NULL
	`);
	await pool.query(`
		ALTER TABLE quiz_attempts
		ADD COLUMN IF NOT EXISTS attempt_source VARCHAR(30) NOT NULL DEFAULT 'standalone'
	`);
	await pool.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempts_attempt_source_check'
			) THEN
				ALTER TABLE quiz_attempts
				ADD CONSTRAINT quiz_attempts_attempt_source_check
				CHECK (attempt_source IN ('standalone', 'course_lesson'));
			END IF;
		END;
		$$;
	`);
	await pool.query(`
		ALTER TABLE quiz_attempts
		ADD COLUMN IF NOT EXISTS score_percent SMALLINT NULL
	`);
	await pool.query(`
		ALTER TABLE quiz_attempts
		ADD COLUMN IF NOT EXISTS passed BOOLEAN NOT NULL DEFAULT FALSE
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_scp_user_course
		ON student_course_progress(user_id, course_id)
	`);
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_slp_user_course
		ON student_lesson_progress(user_id, course_id)
	`);
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_slp_subtopic
		ON student_lesson_progress(subtopic_id)
	`);
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt
		ON quiz_attempt_answers(attempt_id, position)
	`);
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_quiz_attempts_course
		ON quiz_attempts(user_id, course_id)
		WHERE course_id IS NOT NULL
	`);
	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_quiz_attempts_subtopic
		ON quiz_attempts(user_id, subtopic_id)
		WHERE subtopic_id IS NOT NULL
	`);
}
