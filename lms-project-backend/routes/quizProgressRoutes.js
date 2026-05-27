import { Router } from 'express';
import { requireStudent, requireInstructor } from '../middleware/auth.js';
import * as quizProgressController from '../controllers/quizProgressController.js';

const router = Router();

// ==================== STUDENT ROUTES ====================

// CREATE
router.post('/', requireStudent, quizProgressController.createQuizProgress);

// READ - User's quiz progress
router.get('/', requireStudent, quizProgressController.getUserQuizProgress);
router.get('/:quizId', requireStudent, quizProgressController.getQuizProgress);
router.get('/id/:progressId', requireStudent, quizProgressController.getQuizProgressById);

// UPDATE - Track user's quiz attempts
router.patch('/:progressId', requireStudent, quizProgressController.updateQuizProgress);
router.patch('/:quizId/user', requireStudent, quizProgressController.updateUserQuizProgress);
router.patch('/:quizId/attempt', requireStudent, quizProgressController.updateProgressWithAttempt);
router.patch('/:quizId/pass', requireStudent, quizProgressController.markQuizAsPassed);
router.patch('/:quizId/reset', requireStudent, quizProgressController.resetQuizProgress);

// DELETE
router.delete('/:progressId', requireStudent, quizProgressController.deleteQuizProgress);
router.delete('/:quizId/user', requireStudent, quizProgressController.deleteUserQuizProgress);

// ==================== INSTRUCTOR ROUTES ====================

// CREATE - Bulk
router.post('/bulk', requireInstructor, quizProgressController.bulkCreateQuizProgress);

// READ - Quiz analytics
router.get('/quiz/:quizId/all', requireInstructor, quizProgressController.getQuizLevelProgress);
router.get('/:quizId/stats', requireInstructor, quizProgressController.getQuizPerformanceStats);
router.get('/course/:courseId/all', requireInstructor, quizProgressController.getCourseQuizProgress);

export default router;
