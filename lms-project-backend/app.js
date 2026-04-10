import express from 'express';
import cors from 'cors';

import { attachUser, requireUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireFields } from './middleware/validate.js';
import { firebaseAdminSignIn, login } from './controllers/authController.js';

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachUser);

// Public route: only login is accessible without authentication
app.post('/login', requireFields('email', 'password'), login);
app.post('/api/auth/firebase/login', requireFields('idToken'), firebaseAdminSignIn);
app.post('/api/auth/firebase/admin-login', requireFields('idToken'), firebaseAdminSignIn);

// Guard all remaining routes
app.use(requireUser);

app.get('/', (req, res) => {
	res.json({ success: true, message: 'LMS backend API is running', health: '/health' });
});

app.get('/health', (req, res) => {
	res.json({ success: true, message: 'API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

