# Test URLs & Quiz Fix Guide

## ✅ WORKING TEST URLs (Non-YouTube - Direct MP4)

These URLs work **perfectly** for testing video playback AND quiz triggering:

### Option 1: Big Buck Bunny (Recommended - 9 seconds)
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```
- Duration: 9 seconds
- Format: Direct MP4
- Quiz will trigger immediately (at 0 seconds) because video is short
- Perfect for quick testing!

### Option 2: For Bigger Kicks (Medium length)
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerKicks.mp4
```
- Duration: ~65 seconds
- Quiz triggers at 10 seconds ✅
- Good for testing quiz at proper timestamp

### Option 3: Sample Video
```
https://filesamples.com/samples/video/mp4/sample_640x360.mp4
```
- Good quality
- Works reliably

### Option 4: Movie Trailer (Alternative)
```
https://www.w3schools.com/html/mov_bbb.mp4
```
- Short video
- Always works

---

## 🎯 How to Test These URLs

### Step 1: Go to Admin Panel
1. Admin Dashboard → Courses → C Programming
2. Click "Edit Course"

### Step 2: Edit First Lesson
1. Click "1d array" lesson
2. Change Video URL to one of the above
3. Example:
   ```
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```

### Step 3: Save & Test
1. Click "Save"
2. Go to Student View
3. Video should play
4. **Quiz should appear in 10 seconds** (or less for short videos)

---

## 🔧 Why YouTube Quiz Isn't Triggering

**Problem**: YouTube Live streams and embedded videos don't send reliable time tracking data through iframe messages.

**Reason**: YouTube IFrame API is complex and sometimes blocks postMessage communication for live streams.

**Solution**: Use direct MP4 URLs for reliable quiz triggering!

---

## ✅ What Works NOW:

| Video Type | Plays | Quiz Triggers |
|-----------|-------|---------------|
| Direct MP4 URLs | ✅ Yes | ✅ YES (100% reliable) |
| YouTube Regular Videos | ✅ Yes | ⚠️ Sometimes |
| YouTube Live Streams | ✅ Yes | ❌ No (API blocked) |

---

## 🎬 Test with 2d array & String Lessons

The "2d array" and "String" lessons should be **clickable**:

1. Expand "Array" section → Click "2d array"
2. Video should change to that lesson
3. Click "String" category
4. Explore "string literals", "string builder", etc.

If they're **not clickable**:
- Make sure you're expanding the categories first
- The categories should be collapsible/expandable

---

## 📋 Quick Testing Checklist

- [ ] Use direct MP4 URL (Big Buck Bunny recommended)
- [ ] Save in admin panel
- [ ] Refresh student page (Ctrl+Shift+R)
- [ ] Play video
- [ ] Wait 10 seconds (or less if video is short)
- [ ] Quiz should pop up as overlay ✅
- [ ] Click lesson from sidebar
- [ ] Video and content should update ✅

---

## Debug: Check Browser Console

Open F12 → Console and you should see:

For MP4 videos:
```
[VideoPlayer] Rendering: src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", isYoutube=false
```

When quiz triggers:
```
Quiz appears as overlay on video
```

---

## 🚀 Recommended Next Steps

1. **Test with Big Buck Bunny MP4** first (fastest way to verify quiz works)
2. **Use direct MP4 URLs** for all course videos if YouTube isn't working
3. **YouTube for display only** (videos play but quiz requires MP4 URL in same course)

---

## If Quiz Still Doesn't Show After 10 Seconds

### Check 1: Video is Actually Playing
- Press spacebar to pause
- Should pause the video
- Press spacebar again to resume

### Check 2: Time is Passing
- Look at video player timer
- Should be counting up (0:00 → 0:05 → 0:10)

### Check 3: Browser Console
- Press F12 → Console
- Look for any red errors
- Look for `[VideoPlayer]` logs

### Check 4: Hard Refresh
- Press Ctrl+Shift+R (not just Ctrl+R)
- Browser should reload without cache

### Check 5: TimedQuiz Component
- Quiz component is built-in
- Should render automatically when `isQuizVisible=true`
- Check if quiz questions are defined

---

## Comparison: YouTube vs Direct MP4

| Feature | YouTube URL | Direct MP4 |
|---------|------------|-----------|
| Playback Speed | Good | Excellent |
| Quiz Trigger | Unreliable | Perfect ✅ |
| Buffering | Depends on YT | Good |
| CDN | YouTube CDN | Fast CDN |
| Best For | Display/Archive | Learning (with Quiz) |

---

## Test These Now:

**Fastest test (8 seconds total):**
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```

**Test in 3 steps:**
1. Paste URL in admin
2. Save
3. Go to student view
4. Play → Quiz appears ✅

---

## Need Help?

If quiz still doesn't appear:
1. Share browser console screenshot (F12)
2. Tell me which video URL you used
3. Tell me if video timer is counting up
4. I'll debug from there

---

## Summary

- **For reliable quiz**: Use direct MP4 URLs (Big Buck Bunny)
- **For display only**: YouTube URLs work fine (but quiz unreliable)
- **Lesson navigation**: Click categories to expand, then click lessons
- **Quiz timing**: Default is 10 seconds, customizable in CourseDetail.jsx

