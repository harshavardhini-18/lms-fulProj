import { Router } from 'express';
import { 
  getByCourse, 
  updateWatch,
  updateLessonWatch,
  completeLesson,
  recordQuizAttempt
} from '../controllers/progressController.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

router.use(requireUser);

// Lesson-level progress (more specific routes first)
router.patch('/course/:courseId/modules/:moduleId/lessons/:lessonId/watch', updateLessonWatch);
router.patch('/course/:courseId/modules/:moduleId/lessons/:lessonId/complete', completeLesson);
router.post('/course/:courseId/modules/:moduleId/lessons/:lessonId/quiz', recordQuizAttempt);

// Course-level progress (less specific routes after)
router.get('/course/:courseId', getByCourse);
router.patch('/course/:courseId/watch', updateWatch);

export default router;
