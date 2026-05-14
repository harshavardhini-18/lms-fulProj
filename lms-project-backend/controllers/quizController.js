import asyncHandler from '../utils/asyncHandler.js';
import {
  createQuiz,
  deleteQuiz,
  duplicateQuiz,
  getQuiz,
  listQuizzes,
  updateQuiz,
  setQuizLifecycleStatus,
} from '../services/quizService.js';

export const list = asyncHandler(async (req, res) => {
  const result = await listQuizzes(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await getQuiz(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await createQuiz(req.body, req.user);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateQuiz(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await deleteQuiz(req.params.id);
  res.json({ success: true, data });
});

export const publish = asyncHandler(async (req, res) => {
  const data = await setQuizLifecycleStatus(req.params.id, 'published', req.user);
  res.json({ success: true, data });
});

export const archiveQuiz = asyncHandler(async (req, res) => {
  const data = await setQuizLifecycleStatus(req.params.id, 'archived', req.user);
  res.json({ success: true, data });
});

export const duplicate = asyncHandler(async (req, res) => {
  const data = await duplicateQuiz(req.params.id, req.body, req.user);
  res.status(201).json({ success: true, data });
});
