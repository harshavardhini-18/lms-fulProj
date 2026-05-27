import { Router } from 'express';
import multer from 'multer';
import { requireUser } from '../middleware/auth.js';
import { buildStorage, formatUploadResponse } from '../controllers/uploadController.js';

const router = Router();
const storage = multer.diskStorage(buildStorage());

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
});

router.use(requireUser);

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  return res.json(formatUploadResponse(req, req.file));
});

export default router;
