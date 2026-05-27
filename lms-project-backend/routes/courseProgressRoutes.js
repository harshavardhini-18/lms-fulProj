import { Router } from 'express';
import { requireStudent } from '../middleware/auth.js';
import {
  completeLesson,
  deleteCourseProgress,
  deleteLessonProgress,
  getAttemptAnswers,
  getByCourse,
} from '../controllers/courseProgressController.js';

const router = Router();

router.use(requireStudent);

router.get('/course/:courseId', getByCourse);
router.patch(
  '/course/:courseId/modules/:moduleId/lessons/:lessonId/complete',
  completeLesson
);
router.delete('/course/:courseId', deleteCourseProgress);
router.delete('/course/:courseId/lessons/:lessonId', deleteLessonProgress);
router.get('/attempts/:attemptId/answers', getAttemptAnswers);

export default router;
