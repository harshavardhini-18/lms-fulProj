import asyncHandler from '../utils/asyncHandler.js';
import {
  createNoteWithAssetsAndProgress,
  deleteNoteWithAssets,
  listNotesByCourse,
  updateNoteWithAssetsAndProgress,
} from '../services/noteService.js';

export const listByCourse = asyncHandler(async (req, res) => {
  const notes = await listNotesByCourse(req.user._id, req.params.courseId);
  res.json({ success: true, data: notes });
});

export const create = asyncHandler(async (req, res) => {
  const note = await createNoteWithAssetsAndProgress(req.user._id, req.body);
  res.status(201).json({ success: true, data: note });
});

export const update = asyncHandler(async (req, res) => {
  const note = await updateNoteWithAssetsAndProgress(req.user._id, req.params.noteId, req.body);
  res.json({ success: true, data: note });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteNoteWithAssets(req.user._id, req.params.noteId);
  res.json({ success: true });
});
