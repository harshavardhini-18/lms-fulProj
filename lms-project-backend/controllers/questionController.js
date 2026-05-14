import asyncHandler from '../utils/asyncHandler.js';
import {
  bulkCreateQuestions,
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from '../services/questionService.js';

export const list = asyncHandler(async (req, res) => {
  const result = await listQuestions(req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await getQuestion(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await createQuestion(req.body, req.user);
  res.status(201).json({ success: true, data });
});

export const bulkCreate = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : Array.isArray(req.body) ? req.body : [];
  const data = await bulkCreateQuestions(items, req.user);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateQuestion(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const force = String(req.query?.force || '').toLowerCase() === 'true' || req.query?.force === '1';
  const data = await deleteQuestion(req.params.id, { force });
  res.json({ success: true, data });
});
