import asyncHandler from '../utils/asyncHandler.js';
import {
  createQuiz,
  deleteQuiz,
  getQuizById,
  getQuizByCourseAndTimestamp,
  listQuizzes,
  listQuizzesByCourse,
  updateQuiz,
} from '../services/quizService.js';

export const create = asyncHandler(async (req, res) => {
  const quiz = await createQuiz(req.body, req.user);
  res.status(201).json({ success: true, data: quiz });
});

export const list = asyncHandler(async (req, res) => {
  const quizzes = await listQuizzes(req.query);
  res.json({ success: true, data: quizzes });
});

export const listByCourse = asyncHandler(async (req, res) => {
  const quizzes = await listQuizzesByCourse(req.params.courseId);
  res.json({ success: true, data: quizzes });
});

export const getById = asyncHandler(async (req, res) => {
  const quiz = await getQuizById(req.params.quizId);
  res.json({ success: true, data: quiz });
});

export const getByCourseAndTimestamp = asyncHandler(async (req, res) => {
  const timestamp = Number(req.params.triggerTimestampSeconds);
  const quiz = await getQuizByCourseAndTimestamp(req.params.courseId, timestamp);
  res.json({ success: true, data: quiz });
});

export const update = asyncHandler(async (req, res) => {
  const quiz = await updateQuiz(req.params.quizId, req.body, req.user);
  res.json({ success: true, data: quiz });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await deleteQuiz(req.params.quizId);
  res.json({ success: true, data: result });
});
