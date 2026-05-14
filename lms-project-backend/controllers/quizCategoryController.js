import asyncHandler from '../utils/asyncHandler.js';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '../services/quizCategoryService.js';

export const list = asyncHandler(async (req, res) => {
  const data = await listCategories(req.query);
  res.json({ success: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await getCategory(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await createCategory(req.body, req.user);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateCategory(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await deleteCategory(req.params.id);
  res.json({ success: true, data });
});
