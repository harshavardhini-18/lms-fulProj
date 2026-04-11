import { Router } from 'express';
import { create, listByCourse, remove, update } from '../controllers/noteController.js';
import { requireUser } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.get('/course/:courseId', requireUser, listByCourse);
router.post('/', requireUser, requireFields('course', 'title'), create);
router.put('/:noteId', requireUser, update);
router.delete('/:noteId', requireUser, remove);

export default router;
