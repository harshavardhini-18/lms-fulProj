import { Router } from 'express';
import {
  create,
  getByCourseAndTimestamp,
  listByCourse,
} from '../controllers/quizController.js';
import { requireUser } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.use(requireUser);

router.get('/course/:courseId', listByCourse);
router.get('/course/:courseId/timestamp/:triggerTimestampSeconds', getByCourseAndTimestamp);
router.post('/', requireFields('course', 'triggerTimestampSeconds', 'title', 'questions'), create);

export default router;
