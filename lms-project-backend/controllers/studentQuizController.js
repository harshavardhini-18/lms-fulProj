import asyncHandler from '../utils/asyncHandler.js';
import {
  getAttemptPlayer,
  getAttemptResults,
  getStudentQuizOverview,
  abandonInProgressAttempt,
  listPublishedQuizzesForStudent,
  patchAttempt,
  startOrResumeAttempt,
  submitAttempt,
} from '../services/studentQuizAttemptService.js';

export const listQuizzes = asyncHandler(async (req, res) => {
  const result = await listPublishedQuizzesForStudent(req.user.id, req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

export const getOverview = asyncHandler(async (req, res) => {
  const data = await getStudentQuizOverview(req.params.quizId, req.user.id);
  res.json({ success: true, data });
});

export const abandonInProgress = asyncHandler(async (req, res) => {
  const data = await abandonInProgressAttempt(req.params.quizId, req.user.id);
  res.json({ success: true, data });
});

export const postAttempt = asyncHandler(async (req, res) => {
  const data = await startOrResumeAttempt(req.params.quizId, req.user.id);
  res.status(201).json({ success: true, data });
});

export const getAttempt = asyncHandler(async (req, res) => {
  const data = await getAttemptPlayer(req.params.attemptId, req.user.id);
  res.json({ success: true, data });
});

export const patchAttemptState = asyncHandler(async (req, res) => {
  const data = await patchAttempt(req.params.attemptId, req.user.id, req.body || {});
  res.json({ success: true, data });
});

export const postSubmit = asyncHandler(async (req, res) => {
  const data = await submitAttempt(req.params.attemptId, req.user.id);
  res.json({ success: true, data });
});

export const getResults = asyncHandler(async (req, res) => {
  const data = await getAttemptResults(req.params.attemptId, req.user.id);
  res.json({ success: true, data });
});
