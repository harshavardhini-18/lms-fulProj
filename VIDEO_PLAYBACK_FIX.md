# Video Playback Fix Guide

## Issues & Solutions

### Problem: YouTube Videos Not Playing

The VideoPlayer component already supports YouTube videos! But there are common issues:

#### **Issue 1: Incorrect YouTube URL Format**

Your VideoPlayer expects:
- ✅ `https://www.youtube.com/watch?v=VIDEO_ID`
- ✅ `https://youtu.be/VIDEO_ID`
- ✅ `https://www.youtube.com/embed/VIDEO_ID`
- ✅ `https://m.youtube.com/watch?v=VIDEO_ID`
- ✅ `https://www.youtube.com/shorts/VIDEO_ID`

But often receives:
- ❌ `youtube.com/watch?v=VIDEO_ID` (missing https://)
- ❌ `https://www.youtube.com/watch?v=VIDEO_ID&list=...` (with playlist params)
- ❌ `https://youtu.be/VIDEO_ID?t=30s` (with timestamp - should work but may fail)

#### **Issue 2: YouTube Embedding Restrictions**

Some YouTube videos have embedding disabled:
- Go to YouTube video → Settings → Advanced Settings → Check "Allow embedding"

#### **Issue 3: CORS/Security Issues**

If you see errors in console:
```
Refused to display 'https://www.youtube.com/embed/...' in a frame 
because an ancestor violates the following Content Security Policy directive
```

Add to your `vite.config.js`:
```javascript
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
}
```

---

## How to Add YouTube Videos Correctly

### Step 1: Get the Video ID

From YouTube URL: `https://www.youtube.com/watch?v=**dQw4w9WgXcQ**`
- Video ID = `dQw4w9WgXcQ`

Or from short URL: `https://youtu.be/**dQw4w9WgXcQ**`

### Step 2: Admin Panel - Add Lesson with YouTube Video

1. Go to Admin Dashboard → Course Management → Edit Course
2. Click on a Lesson to edit
3. In "Video URL" field, paste the FULL YouTube URL:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
   OR
   ```
   https://youtu.be/dQw4w9WgXcQ
   ```
4. Set video duration (YouTube videos: check video length and enter in seconds)
5. Click Save

The VideoPlayer will automatically convert it to:
```
https://www.youtube.com/embed/dQw4w9WgXcQ
```

---

## Verification Steps

### Check 1: Verify URL in Database

```bash
# SSH into your backend
psql -U postgres -h localhost -d elearning_db

# Check if videoUrl is stored correctly
SELECT id, title, primary_video_url FROM lessons LIMIT 5;
```

Expected output:
```
 id  |    title     |              primary_video_url
-----+--------------+----------------------------------------
  1  | React Hooks  | https://www.youtube.com/watch?v=...
```

### Check 2: Check Frontend Network Tab

1. Open Student Course in browser
2. Press F12 → Network Tab
3. Look for `/api/course/...` requests
4. Check response → lesson → videoUrl field
5. Should see the full YouTube URL

### Check 3: Browser Console

If videoUrl exists but not showing in iframe:
```javascript
// Open browser console and run:
console.log('Testing YouTube URL conversion...')
const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
// Should show embed URL if VideoPlayer logic works
```

---

## Quick Test URLs

Copy these test URLs and add them to a lesson:

1. **Rick Roll (Famous test video)**
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

2. **NASA Apollo 11**
   ```
   https://www.youtube.com/watch?v=xAnjqt3K35E
   ```

3. **Short format (youtu.be)**
   ```
   https://youtu.be/dQw4w9WgXcQ
   ```

---

## If YouTube Videos Still Don't Work

### Solution 1: Use Direct MP4 URLs (Most Reliable)

Instead of YouTube, host MP4 files directly:

```
https://example.com/videos/lesson-1.mp4
```

### Solution 2: Download YouTube Video as MP4

Use a service like `yt-dlp`:

```bash
# Install (macOS)
brew install yt-dlp

# Download video as MP4
yt-dlp -f "best[ext=mp4]" "https://www.youtube.com/watch?v=dQw4w9WgXcQ" -o "video.mp4"

# Upload to your storage
# Then use: https://your-server.com/videos/video.mp4
```

---

## Complete Video Upload System (Alternative)

If you want your own video hosting, see `VIDEO_UPLOAD_IMPLEMENTATION.md`

---

## Debugging Checklist

- [ ] YouTube URL is in correct format (starts with https://)
- [ ] Video ID is valid (copy directly from YouTube URL)
- [ ] YouTube video allows embedding (check video settings)
- [ ] Admin panel shows saved URL in database
- [ ] Network tab shows videoUrl in API response
- [ ] Browser console shows no CSP/CORS errors
- [ ] videoUrl field is NOT empty (check for null/undefined)

---

## Current VideoPlayer URL Formats (Already Supported)

```javascript
// These all work:
"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
"https://youtu.be/dQw4w9WgXcQ"  
"https://m.youtube.com/watch?v=dQw4w9WgXcQ"
"https://www.youtube.com/embed/dQw4w9WgXcQ"
"https://www.youtube.com/shorts/dQw4w9WgXcQ"

// Regular MP4 URLs also work:
"https://example.com/videos/lesson.mp4"
"https://www.w3schools.com/html/mov_bbb.mp4"
```

---

## Next Steps

1. **Test with YouTube URL** from the test URLs above
2. **Check browser console** (F12) for any errors
3. **Verify database** has the videoUrl saved
4. **If still fails**: Run the diagnostic test below

