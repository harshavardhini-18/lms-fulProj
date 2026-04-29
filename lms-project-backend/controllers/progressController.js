import asyncHandler from '../utils/asyncHandler.js';
import { 
  getCourseProgress, 
  updateWatchProgress,
  updateLessonWatchProgress,
  completeLessonProgress,
  recordLessonQuizAttempt
} from '../services/progressService.js';

export const getByCourse = asyncHandler(async (req, res) => {
  const progress = await getCourseProgress(req.user._id, req.params.courseId);
  res.json({ success: true, data: progress });
});

export const updateWatch = asyncHandler(async (req, res) => {
  const progress = await updateWatchProgress(req.user._id, req.params.courseId, req.body);
  res.json({ success: true, data: progress });
});

// Update watched time for a lesson
export const updateLessonWatch = asyncHandler(async (req, res) => {
  const { courseId, moduleId, lessonId } = req.params;
  const progress = await updateLessonWatchProgress(
    req.user._id,
    courseId,
    moduleId,
    lessonId,
    req.body
  );
  res.json({ success: true, data: progress });
});

// Mark lesson as completed (after quiz or after video ends)
export const completeLesson = asyncHandler(async (req, res) => {
  const { courseId, moduleId, lessonId } = req.params;
  const progress = await completeLessonProgress(req.user._id, courseId, moduleId, lessonId);
  res.json({ success: true, data: progress });
});

// Record quiz attempt for a lesson
export const recordQuizAttempt = asyncHandler(async (req, res) => {
  const { courseId, moduleId, lessonId } = req.params;
  const progress = await recordLessonQuizAttempt(
    req.user._id,
    courseId,
    moduleId,
    lessonId,
    req.body
  );
  res.json({ success: true, data: progress });
});
