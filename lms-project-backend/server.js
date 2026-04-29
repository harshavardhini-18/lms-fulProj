import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeIndexes } from './models/index.js';
import { pool } from './config/postgres.js';
import { ensurePasswordResetTable } from './services/passwordResetService.js';
import { ensureCourseSchema } from './services/courseSchemaService.js';

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

async function bootstrap() {
	try {
		// 1. MongoDB connect
		await connectDB();

		// 2. PostgreSQL connect (real validation check)
		await pool.query('SELECT COUNT(*) FROM users');
		console.log('PostgreSQL users table connected & reachable');
		await ensurePasswordResetTable();
		console.log('PostgreSQL password_resets table ready');
		await ensureCourseSchema();
		console.log('PostgreSQL course/module/lesson schema ready');

		// 3. Optional indexes sync
		if (process.env.SYNC_INDEXES === 'true') {
			await initializeIndexes();
			console.log('Indexes synchronized');
		}

		// 4. Start server
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});

	} catch (error) {
		console.error('Server startup failed:', error.message);
		process.exit(1);
	}
}

bootstrap();