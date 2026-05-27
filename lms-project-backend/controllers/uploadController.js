import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function sanitizeFolder(value) {
  const safe = String(value || 'misc').toLowerCase().trim();
  const cleaned = safe.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  return cleaned || 'misc';
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getUploadDir(folder) {
  return path.join(process.cwd(), 'uploads', folder);
}

export function buildStorage() {
  return {
    destination: (req, file, cb) => {
      const folder = sanitizeFolder(req.body?.folder || 'misc');
      const dir = getUploadDir(folder);
      ensureDir(dir);
      req.uploadFolder = folder;
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      cb(null, name);
    },
  };
}

export function formatUploadResponse(req, file) {
  const folder = req.uploadFolder || 'misc';
  const publicPath = `/uploads/${folder}/${file.filename}`;
  const url = `${req.protocol}://${req.get('host')}${publicPath}`;
  return {
    success: true,
    data: {
      url,
      path: publicPath,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    },
  };
}
