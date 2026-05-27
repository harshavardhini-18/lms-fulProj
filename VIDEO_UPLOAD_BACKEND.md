# Optional: Video Upload Implementation

If you want to upload videos directly instead of using YouTube, here's a complete solution using **AWS S3** or **local file storage**.

---

## Option 1: Simple Local File Storage (Easiest)

### Backend Setup (Express.js)

Install dependencies:
```bash
npm install multer uuid
```

Create video upload route in `lms-project-backend/routes/videoRoutes.js`:

```javascript
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  }
});

// File filter - only MP4
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'video/mp4' || file.originalname.endsWith('.mp4')) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4 videos allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Upload endpoint
router.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      message: 'No video file provided' 
    });
  }

  const videoUrl = `${process.env.API_URL}/videos/${req.file.filename}`;
  
  res.json({ 
    success: true, 
    data: { 
      videoUrl,
      filename: req.file.filename,
      size: req.file.size
    }
  });
});

export default router;
```

### Mount in `app.js`:

```javascript
import videoRoutes from './routes/videoRoutes.js';

// Add after other routes
app.use('/api/videos-upload', videoRoutes);

// Serve uploaded videos as static files
app.use('/videos', express.static(path.join(__dirname, 'uploads/videos')));
```

### Frontend - Add Upload Component

Create `src/admin/components/VideoUploadForm.jsx`:

```javascript
import { useState } from 'react';
import styles from './VideoUploadForm.module.css';

export default function VideoUploadForm({ onVideoUploaded }) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.includes('video/mp4')) {
      setError('Only MP4 videos are supported');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('Video must be smaller than 500MB');
      return;
    }

    setError(null);
    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploadProgress(100);
          onVideoUploaded(response.data);
          setTimeout(() => setLoading(false), 500);
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed');
        setLoading(false);
      });

      xhr.open('POST', 'http://localhost:5000/api/videos-upload/upload');
      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.uploadBox}>
        <input
          type="file"
          accept="video/mp4"
          onChange={handleFileChange}
          disabled={loading}
          id="videoInput"
          className={styles.input}
        />
        <label htmlFor="videoInput" className={styles.label}>
          {loading ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Choose Video (MP4)'}
        </label>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
```

### CSS for upload form:

```css
.container {
  margin: 20px 0;
}

.uploadBox {
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  background: #f0f9ff;
  cursor: pointer;
  transition: all 0.3s;
}

.uploadBox:hover {
  border-color: #2563eb;
  background: #e0f2fe;
}

.input {
  display: none;
}

.label {
  display: block;
  cursor: pointer;
  font-weight: 600;
  color: #3b82f6;
}

.error {
  color: #dc2626;
  margin-top: 10px;
  padding: 10px;
  background: #fee2e2;
  border-radius: 4px;
}
```

---

## Option 2: AWS S3 Upload (Scalable)

### Setup S3 Bucket

1. Create S3 bucket: `my-lms-videos`
2. Make bucket public (or use signed URLs)
3. Add CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Backend Implementation

Install AWS SDK:
```bash
npm install @aws-sdk/client-s3
```

Create S3 service in `services/s3Service.js`:

```javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export async function uploadVideoToS3(fileBuffer, originalFilename) {
  const key = `videos/${uuidv4()}${getFileExtension(originalFilename)}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: 'video/mp4',
    ACL: 'public-read'
  });

  await s3Client.send(command);
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
}

function getFileExtension(filename) {
  return filename.slice(filename.lastIndexOf('.'));
}
```

Update route to use S3:

```javascript
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const videoUrl = await uploadVideoToS3(req.file.buffer, req.file.originalname);
    
    res.json({ 
      success: true, 
      data: { videoUrl }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

---

## Using Uploaded Videos in Lessons

In Admin Lesson Editor:

```javascript
const handleVideoUpload = (uploadData) => {
  setFormData(prev => ({
    ...prev,
    videoUrl: uploadData.videoUrl  // https://...video.mp4
  }));
};

// In render:
<VideoUploadForm onVideoUploaded={handleVideoUpload} />
```

The VideoPlayer component automatically handles MP4 URLs!

---

## Test Uploaded Video

1. Upload video in Admin Panel
2. Get returned URL: `https://example.com/videos/abc123.mp4`
3. Save lesson
4. Go to Student View
5. Video should play with HTML5 `<video>` tag with controls

---

## Benefits of Each Option

| Option | Pros | Cons |
|--------|------|------|
| **YouTube** | Free, reliable, no storage | Requires YouTube account, not private |
| **Local Storage** | Simple, private | Limited storage, speed issues with large files |
| **AWS S3** | Scalable, fast, CDN support | Monthly cost ($0.023 per GB) |
| **Google Drive** | Free, 15GB | Limited bandwidth, slower download |

---

## Recommended Setup

1. **Development**: YouTube URLs or local storage
2. **Production**: AWS S3 or similar CDN
3. **Backup**: Keep original video files locally

---

## Troubleshooting Upload

**"Upload failed"**
- Check file size (max 500MB)
- Verify file is actually MP4
- Check backend logs

**"No space left on device"**
- Check server disk space: `df -h`
- Delete old videos from uploads folder
- Use AWS S3 instead

**"CORS error"**
- Add frontend URL to CORS policy
- Restart backend server

