import { Router } from 'express';
import { getByCourse, updateWatch } from '../controllers/progressController.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

router.get('/course/:courseId', requireUser, getByCourse);
router.patch('/course/:courseId/watch', requireUser, updateWatch);

export default router;
