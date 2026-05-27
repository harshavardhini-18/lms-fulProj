# Premium In-Video Quiz Overlay System

## 📺 Overview

A premium LMS-style in-video quiz overlay experience built with React, Tailwind CSS, and Framer Motion. Designed to mimic high-end platforms like Udemy and Coursera.

### Key Features

✅ **Embedded Quiz Experience** - Quiz overlays INSIDE the video player, not as popup modals
✅ **Auto Video Pause** - Video automatically pauses when quiz appears
✅ **Smooth Animations** - Premium cinematic transitions (300-450ms, ease-out)
✅ **Responsive Design** - Desktop, tablet, and mobile optimized
✅ **Timestamp-Based** - Show quizzes at specific video timestamps
✅ **Progress Tracking** - Animated progress bar with question counter
✅ **Instant Feedback** - Show correct/incorrect with visual indicators
✅ **Keyboard Accessible** - Full keyboard support for interaction
✅ **GPU Optimized** - Only animates opacity and transform for performance

---

## 📁 Component Structure

```
src/components/InVideoQuiz/
├── InVideoQuizOverlay.jsx      # Main overlay with darkening & blur
├── InVideoQuizCard.jsx         # Quiz card container & logic
├── QuizOption.jsx              # Individual quiz option button
├── AnimatedProgressBar.jsx     # Question progress indicator
├── InVideoQuizDemo.jsx         # Complete working example
└── index.js                    # Export all components
```

---

## 🚀 Quick Start

### 1. Import Components

```jsx
import { InVideoQuizOverlay } from '@/components/InVideoQuiz'
import { useRef, useState } from 'react'

export default function CoursePlayer() {
  const videoRef = useRef(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  
  // ... rest of component
}
```

### 2. Define Quiz Data

```javascript
const quizzes = [
  {
    id: 'quiz-1',
    timestamp: 10, // Show at 10 seconds
    question: 'What is the correct answer?',
    options: [
      { 
        text: 'Option A', 
        isCorrect: true,
        explanation: 'Correct! This is why...'
      },
      { 
        text: 'Option B', 
        isCorrect: false,
        explanation: 'Incorrect. Actually...'
      },
      { 
        text: 'Option C', 
        isCorrect: false 
      },
    ]
  }
]
```

### 3. Detect Quiz Timestamps

```javascript
useEffect(() => {
  if (!videoRef.current) return

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current.currentTime
    
    // Find quiz at current timestamp
    const currentQuiz = quizzes.find(
      q => currentTime >= q.timestamp && 
           currentTime < q.timestamp + 2 &&
           !completedQuestions.includes(q.id)
    )

    if (currentQuiz && !isQuizOpen) {
      setIsQuizOpen(true)
    }
  }

  videoRef.current.addEventListener('timeupdate', handleTimeUpdate)
  return () => videoRef.current.removeEventListener('timeupdate', handleTimeUpdate)
}, [isQuizOpen, completedQuestions])
```

### 4. Render Overlay

```jsx
<div className="relative w-full bg-black rounded-lg">
  <video ref={videoRef} controls className="w-full" />
  
  <InVideoQuizOverlay
    isOpen={isQuizOpen}
    quiz={currentQuiz}
    onSubmit={handleQuizSubmit}
    onSkip={handleQuizSkip}
    videoRef={videoRef}
    currentQuestion={currentQuestion}
    totalQuestions={totalQuestions}
  />
</div>
```

---

## 🎨 Customization

### Modify Animations

Edit `InVideoQuizCard.jsx` to adjust animation timing:

```javascript
const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,  // Adjust duration (300-450ms recommended)
      ease: 'easeOut',
    },
  },
}
```

### Change Colors & Styling

All styling uses Tailwind classes. Modify colors in:
- `QuizOption.jsx` - Option button colors
- `InVideoQuizCard.jsx` - Card design and badges
- `AnimatedProgressBar.jsx` - Progress bar colors

Example: Change badge from indigo to blue:
```jsx
// InVideoQuizCard.jsx
<span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
  CHECKPOINT QUIZ
</span>
```

### Adjust Card Width

Edit `InVideoQuizCard.jsx` container class:

```jsx
<motion.div
  className="w-full max-w-2xl"  // Change max-w-2xl to desired width
>
```

Width options:
- `max-w-sm` → 384px (small)
- `max-w-md` → 448px (medium)
- `max-w-lg` → 512px (large)
- `max-w-2xl` → 672px (2xl) ← current
- `max-w-4xl` → 896px (4xl)

### Adjust Blur & Darkening

Edit `InVideoQuizOverlay.jsx`:

```jsx
<motion.div
  className="absolute inset-0 bg-black/35 backdrop-blur-md"
  //                          ^^^           ^^^^
  //                        opacity      blur level
>
```

Options:
- `bg-black/25` to `bg-black/50` for darkness
- `backdrop-blur-sm` to `backdrop-blur-xl` for blur

---

## 🔧 Backend Integration

### Fetch Quizzes from API

```javascript
useEffect(() => {
  const fetchQuizzes = async () => {
    const response = await fetch(
      `/api/courses/${courseId}/video-quizzes`
    )
    const data = await response.json()
    setQuizzes(data.quizzes)
  }

  fetchQuizzes()
}, [courseId])
```

### Save Quiz Responses

```javascript
const handleQuizSubmit = async (result) => {
  const response = await fetch('/api/quiz-attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quizId: result.questionId,
      selectedOption: result.selectedOption,
      isCorrect: result.isCorrect,
      timestamp: new Date(),
      userId: currentUser.id,
      courseId: courseId,
    })
  })

  const data = await response.json()
  setCompletedQuestions([...completedQuestions, result.questionId])
  setIsQuizOpen(false)
}
```

---

## 📱 Responsive Behavior

### Desktop (1024px+)
- Card: 70-75% of screen width
- Max width: 850px
- Large padding and spacing

### Tablet (768px-1023px)
- Card: 80% of screen width
- Adjusted padding

### Mobile (< 768px)
- Card: 95% of screen width with safe margins
- Reduced padding
- Larger touch targets

These are handled automatically by Tailwind's responsive classes in the components.

---

## ⌨️ Keyboard Accessibility

Supported keys:
- **Arrow Up/Down** - Select options (when implemented)
- **Enter** - Submit answer
- **Esc** - Skip quiz

Add keyboard handling to `InVideoQuizCard.jsx`:

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && selectedOption !== null) {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      handleSkip()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [selectedOption])
```

---

## 🎯 Trigger Quiz Manually (Alternative)

Instead of timestamp-based, manually control quiz:

```jsx
<button onClick={() => setIsQuizOpen(true)}>
  Show Quiz
</button>

<InVideoQuizOverlay
  isOpen={isQuizOpen}
  quiz={selectedQuiz}
  onSubmit={() => setIsQuizOpen(false)}
  onSkip={() => setIsQuizOpen(false)}
  videoRef={videoRef}
/>
```

---

## 🐛 Troubleshooting

### Quiz doesn't pause video
- Ensure `videoRef` is properly passed and connected to video element
- Check that `videoRef.current` is not null

### Animation feels laggy
- Check that only `opacity` and `transform` are animated
- Avoid animating `width`, `height`, or `position` properties
- Use `will-change: transform` if needed

### Quiz doesn't appear
- Check quiz timestamp against current video time
- Verify quiz is not already in `completedQuestions`
- Open browser console for errors

### Video controls disabled during quiz
- Add to video element: `disabled={isQuizOpen}`
- Or use: `videoRef.current.controls = !isQuizOpen`

---

## 📊 Analytics & Tracking

Track quiz performance:

```javascript
const analytics = {
  quizId: result.questionId,
  isCorrect: result.isCorrect,
  timeToComplete: Date.now() - quizStartTime,
  userSkipped: false,
  videoTimestamp: videoRef.current.currentTime,
}

// Send to analytics
trackEvent('quiz_completed', analytics)
```

---

## 🎬 Live Demo

View working example: `InVideoQuizDemo.jsx`
- Run the demo to see all features
- Seek to 10s, 30s, or 60s to trigger quizzes
- Test submit, skip, and animations

---

## 🚀 Performance Tips

1. **Lazy load quiz data** - Only fetch quizzes when video is played
2. **Memoize components** - Use `React.memo()` for options to prevent re-renders
3. **Debounce timeupdate** - Quiz detection doesn't need to run every frame
4. **Use CSS containment** - Add `contain: paint` to overlay for rendering optimization

---

## 📚 Additional Notes

- Works with any HTML5 video player
- Compatible with video streaming services (HLS, DASH)
- Uses Framer Motion v12+ for animations
- Fully responsive and mobile-friendly
- Premium, professional UI matching industry standards

---

## 🤝 Support

For issues or questions:
1. Check the demo implementation
2. Review component prop types
3. Verify quiz data structure
4. Check browser console for errors

---

**Created with ❤️ for premium learning experiences**
