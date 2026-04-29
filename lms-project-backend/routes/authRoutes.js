import { Router } from 'express';
import {
	adminCreateUser,
	me,
	completeOnboarding,
	updateStudentProfile,
} from '../controllers/authController.js';
import { requireAdmin, requireUser } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

// Protected routes only (authentication required)
router.post('/admin/create-user', requireUser, requireAdmin, requireFields('email', 'password', 'role'), adminCreateUser);
router.get('/me', requireUser, me);
router.post('/onboarding', requireUser, completeOnboarding);
router.put('/update-profile', requireUser, updateStudentProfile);

export default router;

