import { Router } from 'express';
import { create, getById, list } from '../controllers/courseController.js';
import { requireUser } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.use(requireUser);

router.get('/', list);
router.get('/:courseId', getById);
router.post('/', requireFields('title', 'video'), create);

export default router;
