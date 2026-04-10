import { Router } from 'express';
import { adminCreateUser, me } from '../controllers/authController.js';
import { requireAdmin, requireUser } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.post('/admin/create-user', requireUser, requireAdmin, requireFields('email', 'password', 'role'), adminCreateUser);
router.get('/me', requireUser, me);

export default router;

