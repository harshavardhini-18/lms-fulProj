import dotenv from 'dotenv';
 import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const postgresPassword = process.env.POSTGRES_PASSWORD ?? process.env.PGPASSWORD;

if (typeof postgresPassword !== 'string' || !postgresPassword.trim()) {
	throw new Error(
		'POSTGRES_PASSWORD is missing or invalid. Set it in lms-project-backend/.env to start the server.'
	);
}

export const pool = new Pool({
	user: process.env.POSTGRES_USER || process.env.PGUSER || 'postgres',
	host: process.env.POSTGRES_HOST || process.env.PGHOST || 'localhost',
	database: process.env.POSTGRES_DB || process.env.PGDATABASE || 'elearning_db',
	password: postgresPassword,
	port: Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432),
});