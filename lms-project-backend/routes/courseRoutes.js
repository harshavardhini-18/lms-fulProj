import { Router } from 'express';
import {
  create,
  getById,
  list,
  getCourseDetail,
  getModuleDetail,
  getLessonDetail,
  update,
  deleteCourseHandler,
  createModuleHandler,
  updateModuleHandler,
  deleteModuleHandler,
  createLessonHandler,
  updateLessonHandler,
  deleteLessonHandler,
} from '../controllers/courseController.js';
import { requireUser } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.use(requireUser);

router.get('/', list);
router.get('/:courseId/detail', getCourseDetail);
router.get('/:courseId', getById);
router.post('/', requireFields('title'), create);
router.put('/:courseId', update);
router.delete('/:courseId', deleteCourseHandler);

router.get('/:courseId/modules/:moduleId', getModuleDetail);
router.post('/:courseId/modules', requireFields('title'), createModuleHandler);
router.put('/:courseId/modules/:moduleId', updateModuleHandler);
router.delete('/:courseId/modules/:moduleId', deleteModuleHandler);

router.get('/:courseId/modules/:moduleId/lessons/:lessonId', getLessonDetail);
router.post('/:courseId/modules/:moduleId/lessons', requireFields('title'), createLessonHandler);
router.put('/:courseId/modules/:moduleId/lessons/:lessonId', updateLessonHandler);
router.delete('/:courseId/modules/:moduleId/lessons/:lessonId', deleteLessonHandler);

export default router;
