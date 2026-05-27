# Video Playback - Quick Reference

## ✅ YouTube Videos - 5 Minute Fix

### Step 1: Get Video ID
From any YouTube URL, extract the video ID:
- `https://www.youtube.com/watch?v=**dQw4w9WgXcQ**` → ID: `dQw4w9WgXcQ`
- `https://youtu.be/**dQw4w9WgXcQ**` → ID: `dQw4w9WgXcQ`

### Step 2: Use in Admin Panel
1. Go to **Admin Dashboard** → **Courses** → **Edit Lesson**
2. Paste full URL in "Video URL" field:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
3. Click **Save**
4. Wait 2 seconds
5. Go to **Student View** → Video should play!

### Step 3: If Not Playing
1. Open browser **F12** → **Console**
2. Look for `[VideoPlayer]` logs
3. Check Network tab for `videoUrl` in API response
4. Verify YouTube allows embedding (check video settings)

---

## ❌ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Black box, nothing plays | URL not saved | Go back to admin, save again |
| "Video unavailable soon" | `videoUrl` is empty | Add URL in admin panel |
| "YouTube video failed to load" | Embedding disabled | Use different video or download |
| Console shows URL but no video | YouTube blocked embedding | Download as MP4 instead |

---

## 📋 Supported URL Formats

```
✅ https://www.youtube.com/watch?v=VIDEO_ID
✅ https://youtu.be/VIDEO_ID
✅ https://m.youtube.com/watch?v=VIDEO_ID
✅ https://www.youtube.com/embed/VIDEO_ID
✅ https://www.youtube.com/shorts/VIDEO_ID
✅ https://example.com/videos/file.mp4 (MP4 direct link)
```

---

## 🎬 Test URLs (Copy & Paste)

These always work - use for testing:

```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://www.youtube.com/watch?v=xAnjqt3K35E
https://youtu.be/dQw4w9WgXcQ
```

---

## 🔍 Quick Diagnostic

Run these commands:

```bash
# Check if URL saved in database
psql -U postgres -h localhost -d elearning_db \
  -c "SELECT id, title, primary_video_url FROM lessons LIMIT 5;"

# Should show YouTube URLs, not NULL/empty
```

---

## 📱 Frontend Debugging

```javascript
// Open browser console (F12) while viewing lesson
// Should see logs like:
// [VideoPlayer] Rendering: src="https://www.youtube.com/watch?v=...", isYoutube=true
// [VideoPlayer] Converted youtube.com/watch to embed: dQw4w9WgXcQ
```

---

## 🚀 Solution Priority

1. **First**: Use YouTube URLs (built-in, no setup needed)
2. **If blocked**: Download YouTube video as MP4, use direct link
3. **For many videos**: Set up AWS S3 video hosting
4. **For privacy**: Host videos locally or on private server

---

## 💾 Download YouTube Video to MP4

```bash
# Install yt-dlp
brew install yt-dlp

# Download video
yt-dlp -f "best[ext=mp4]" "https://www.youtube.com/watch?v=dQw4w9WgXcQ" -o "video.mp4"

# Then upload video.mp4 and use: https://your-server.com/videos/video.mp4
```

---

## 📄 Full Guides

- **Complete troubleshooting**: `VIDEO_TROUBLESHOOTING.md`
- **Setup guide**: `VIDEO_PLAYBACK_FIX.md`
- **Video upload**: `VIDEO_UPLOAD_BACKEND.md`
- **Test component**: Use `VideoTestDiagnostic` component in admin panel

---

## 🆘 If Still Not Working

1. Verify videoUrl in database (see Diagnostic above)
2. Check browser console for errors (F12)
3. Try test URLs from above
4. Restart backend and frontend servers
5. Hard refresh browser (Ctrl+Shift+R)

If issue persists, provide:
- Database query output (videoUrl value)
- Browser console logs (screenshot)
- API response showing videoUrl (Network tab)

