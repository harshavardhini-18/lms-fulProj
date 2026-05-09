import { Router } from 'express';
import {
  create,
  getById,
  getByCourseAndTimestamp,
  list,
  listByCourse,
  remove,
  update,
} from '../controllers/quizController.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

router.use(requireUser);

router.get('/', list);
router.get('/course/:courseId', listByCourse);
router.get('/course/:courseId/timestamp/:triggerTimestampSeconds', getByCourseAndTimestamp);
router.get('/:quizId', getById);
router.post('/', create);
router.put('/:quizId', update);
router.delete('/:quizId', remove);

export default router;
