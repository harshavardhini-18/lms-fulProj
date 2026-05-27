import { Router } from 'express';
import { requireStudent, requireInstructor } from '../middleware/auth.js';
import * as courseProgressFullController from '../controllers/courseProgressFullController.js';

const router = Router();

// ==================== STUDENT ROUTES ====================

// CREATE
router.post('/', requireStudent, courseProgressFullController.createCourseProgress);
router.post('/bulk', requireInstructor, courseProgressFullController.bulkCreateCourseProgress);

// READ - User's own progress
router.get('/', requireStudent, courseProgressFullController.getUserCourseProgress);
router.get('/:courseId', requireStudent, courseProgressFullController.getCourseProgress);
router.get('/id/:progressId', requireStudent, courseProgressFullController.getCourseProgressById);

// UPDATE - User's own progress
router.patch('/:progressId', requireStudent, courseProgressFullController.updateCourseProgress);
router.patch('/:courseId/user', requireStudent, courseProgressFullController.updateUserCourseProgress);
router.patch('/:courseId/complete', requireStudent, courseProgressFullController.markCourseAsCompleted);
router.patch('/:courseId/lesson/:lessonId', requireStudent, courseProgressFullController.updateLessonProgress);
router.patch('/:courseId/reset', requireStudent, courseProgressFullController.resetCourseProgress);

// DELETE
router.delete('/:progressId', requireStudent, courseProgressFullController.deleteCourseProgress);
router.delete('/:courseId/user', requireStudent, courseProgressFullController.deleteUserCourseProgress);

// ==================== INSTRUCTOR ROUTES ====================

// READ - Course level analytics
router.get('/course/:courseId/all', requireInstructor, courseProgressFullController.getCourseLevelProgress);
router.get('/:courseId/stats', requireInstructor, courseProgressFullController.getCourseCompletionStats);

// UPDATE - Bulk operations
router.patch('/bulk/completion', requireInstructor, courseProgressFullController.bulkUpdateCompletionPercent);

export default router;
