import asyncHandler from '../utils/asyncHandler.js';
import { getCourseProgress, updateWatchProgress } from '../services/progressService.js';

export const getByCourse = asyncHandler(async (req, res) => {
  const progress = await getCourseProgress(req.user._id, req.params.courseId);
  res.json({ success: true, data: progress });
});

export const updateWatch = asyncHandler(async (req, res) => {
  const progress = await updateWatchProgress(req.user._id, req.params.courseId, req.body);
  res.json({ success: true, data: progress });
});
