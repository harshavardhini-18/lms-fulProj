import asyncHandler from '../utils/asyncHandler.js';
import {
  createQuiz,
  getQuizByCourseAndTimestamp,
  listQuizzesByCourse,
} from '../services/quizService.js';

export const create = asyncHandler(async (req, res) => {
  const quiz = await createQuiz(req.body, req.user._id);
  res.status(201).json({ success: true, data: quiz });
});

export const listByCourse = asyncHandler(async (req, res) => {
  const quizzes = await listQuizzesByCourse(req.params.courseId);
  res.json({ success: true, data: quizzes });
});

export const getByCourseAndTimestamp = asyncHandler(async (req, res) => {
  const timestamp = Number(req.params.triggerTimestampSeconds);
  const quiz = await getQuizByCourseAndTimestamp(req.params.courseId, timestamp);
  res.json({ success: true, data: quiz });
});
