import { Router } from 'express';
import { requireStudent } from '../middleware/auth.js';
import {
  abandonInProgress,
  getAttempt,
  getOverview,
  getResults,
  listQuizzes,
  patchAttemptState,
  postAttempt,
  postSubmit,
} from '../controllers/studentQuizController.js';

const router = Router();

router.use(requireStudent);

router.get('/', listQuizzes);
router.get('/attempts/:attemptId/results', getResults);
router.post('/attempts/:attemptId/submit', postSubmit);
router.patch('/attempts/:attemptId', patchAttemptState);
router.get('/attempts/:attemptId', getAttempt);
router.post('/:quizId/abandon-in-progress', abandonInProgress);
router.get('/:quizId/overview', getOverview);
router.post('/:quizId/attempts', postAttempt);

export default router;
