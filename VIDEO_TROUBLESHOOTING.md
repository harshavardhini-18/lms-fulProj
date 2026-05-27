# YouTube Video Playback - Complete Troubleshooting Guide

## Quick Fixes (Try These First!)

### Fix 1: Verify VideoUrl is Saved
```bash
# Connect to database
psql -U postgres -h localhost -d elearning_db

# Check lesson has videoUrl
SELECT id, title, primary_video_url FROM lessons WHERE primary_video_url IS NOT NULL LIMIT 5;
```

**Expected:** Should show YouTube URLs like `https://www.youtube.com/watch?v=...`

**If empty:** The video URL wasn't saved. Go to Admin Panel → Edit Lesson → Add video URL again.

---

### Fix 2: Check YouTube URL Format

These formats work:
```
✅ https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ https://youtu.be/dQw4w9WgXcQ
✅ https://m.youtube.com/watch?v=dQw4w9WgXcQ
✅ https://www.youtube.com/embed/dQw4w9WgXcQ
```

These DON'T work:
```
❌ youtube.com/watch?v=... (missing https://)
❌ www.youtube.com/watch?v=... (missing protocol)
❌ https://www.youtube.com/watch?v=...&list=... (with playlist - may fail)
❌ https://youtu.be/...?t=30s (with timestamp - risky)
```

---

### Fix 3: Check YouTube Video Settings

Not all YouTube videos allow embedding!

1. Go to your YouTube video
2. Click **Share** → **Embed**
3. Look for message: **"This video isn't available for embedding"**
   - If this appears, that video cannot be embedded
   - Solution: Use a different video or download + host yourself

---

## Step-by-Step Fix Process

### Step 1: Test in Browser Console

Open your student course page:
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for `[VideoPlayer]` logs showing URL processing
4. Expected output:
   ```
   [VideoPlayer] Rendering: src="https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
   isYoutube=true, embedUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
   ```

**If you see:**
- `[VideoPlayer] Could not identify YouTube URL format:` → URL format is wrong
- `[VideoPlayer] Rendering: src="...", isYoutube=false` → Not recognized as YouTube
- Nothing logged → VideoPlayer component not rendering

---

### Step 2: Check Network Request

1. Keep Developer Tools open (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for API call like `/api/courses/...` or `/api/lessons/...`
5. Click on it → **Response** tab
6. Check if `videoUrl` field has a value:

```json
{
  "lesson": {
    "id": "123",
    "title": "Lesson Name",
    "videoUrl": "https://www.youtube.com/watch?v=...",
    "contentJson": {...}
  }
}
```

**If videoUrl is null/empty:**
- Video was not saved to database
- Go back to Admin Panel and save the video URL again

**If videoUrl exists but is wrong format:**
- Admin saved wrong URL
- Edit it to proper format in Admin Panel

---

### Step 3: Check Browser Errors

1. Developer Tools → **Console** tab
2. Look for red errors like:
   ```
   Uncaught TypeError: Cannot read property 'videoUrl' of undefined
   ```
3. Look for iframe errors:
   ```
   Refused to display 'https://www.youtube.com/embed/...' in a frame
   because an ancestor violates the following Content Security Policy directive
   ```

**CSP Error Solution:**
Add to `vite.config.js`:
```javascript
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
}
```

---

### Step 4: Admin Panel - Verify Save

1. Go to Admin Dashboard
2. Click on Course → Module → Lesson
3. Check the **Video URL** field:
   - Should have the full YouTube URL
   - Should NOT be empty
   - Should start with `https://`

4. Click **Save** again to ensure it's persisted
5. Wait 2 seconds, then go to student view to test

---

## If Videos Still Don't Play

### Option A: Use Direct MP4 URLs (Most Reliable)

Instead of YouTube, host MP4 files directly:
```
https://www.example.com/videos/lesson-1.mp4
https://storage.googleapis.com/my-videos/lesson-1.mp4
```

The video player automatically detects MP4 and plays it with HTML5 `<video>` tag.

### Option B: Download YouTube Video as MP4

Use `yt-dlp` to download:

```bash
# Install yt-dlp
brew install yt-dlp

# Download video as MP4
yt-dlp -f "best[ext=mp4]" "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  -o "video.mp4"

# Then upload video.mp4 to your server
# Use URL: https://your-server.com/videos/video.mp4
```

### Option C: Use Google Drive

1. Upload video to Google Drive
2. Make it shareable (Anyone with link can view)
3. Get share link: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
4. Convert to direct link:
   ```
   https://drive.google.com/uc?export=download&id=FILE_ID
   ```
5. Use this URL in lesson

---

## Video Player Debug Mode

To enable verbose logging, add this to `VideoPlayer.jsx`:

```javascript
// Add at top of component
const DEBUG = true;

// Replace console.log calls:
if (DEBUG) console.log(`[VideoPlayer] ...message...`)
```

Then check browser console for detailed logs.

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Video will be available soon" | `videoUrl` is empty/null | Add URL in Admin Panel |
| "YouTube video failed to load" | Embedding disabled on YouTube | Check video settings in YouTube |
| Blank black box | IFrame loads but no video | Wait 5 seconds, refresh page |
| "Cannot read property 'videoUrl'" | API response doesn't include videoUrl | Check API endpoint returns correct data |
| Sound but no picture | Wrong video format | Use MP4 or download YouTube video |

---

## Test Videos That Always Work

Copy these URLs into a lesson and test:

1. **Rick Roll (famous test)**
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

2. **Sample MP4 (always plays)**
   ```
   https://www.w3schools.com/html/mov_bbb.mp4
   ```

3. **Big Buck Bunny**
   ```
   https://www.youtube.com/watch?v=xAnjqt3K35E
   ```

---

## Video Upload System (Optional)

See `VIDEO_UPLOAD_BACKEND.md` for implementing your own video hosting.

---

## Quick Checklist

Before reporting an issue, verify:

- [ ] VideoUrl in database (`SELECT ... FROM lessons WHERE id=...`)
- [ ] VideoUrl has full YouTube URL (not just ID)
- [ ] VideoUrl starts with `https://`
- [ ] YouTube video allows embedding (check video settings)
- [ ] Browser console shows `[VideoPlayer]` logs
- [ ] Network tab shows `videoUrl` in API response
- [ ] No CSP errors in console
- [ ] Tried with test URLs above
- [ ] Tried refreshing page (Ctrl+Shift+R for hard refresh)

---

## If All Else Fails

**Run this diagnostic:**

```bash
# 1. Check database connection
psql -U postgres -h localhost -d elearning_db -c "SELECT COUNT(*) FROM lessons;"

# 2. Check a specific lesson
psql -U postgres -h localhost -d elearning_db \
  -c "SELECT id, title, primary_video_url FROM lessons LIMIT 1;"

# 3. Test API endpoint
curl http://localhost:5000/api/courses/1

# 4. Check backend logs for errors
# Look at server output for [VideoPlayer] errors
```

Then share the output and we can debug further!

---

## Need Custom Video Upload?

See: `VIDEO_UPLOAD_BACKEND.md`

