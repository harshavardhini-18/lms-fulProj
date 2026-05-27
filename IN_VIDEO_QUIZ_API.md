# In-Video Quiz API Reference

## Components

### InVideoQuizOverlay

Main overlay component that manages the quiz display with darkening and blur effects.

```jsx
<InVideoQuizOverlay
  isOpen={boolean}
  quiz={QuizObject}
  onSubmit={(result) => void}
  onSkip={() => void}
  videoRef={React.RefObject}
  currentQuestion={number}
  totalQuestions={number}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✓ | Show/hide the quiz overlay |
| `quiz` | `QuizObject` | ✓ | Quiz data object |
| `onSubmit` | `function` | ✓ | Called when answer is submitted |
| `onSkip` | `function` | ✓ | Called when quiz is skipped |
| `videoRef` | `React.RefObject` | ✓ | Reference to video element |
| `currentQuestion` | `number` | ✗ | Current question number (default: 1) |
| `totalQuestions` | `number` | ✗ | Total number of questions (default: 1) |

**Returns:** `ReactNode`

**Example:**

```jsx
const videoRef = useRef(null)
const [isQuizOpen, setIsQuizOpen] = useState(false)

<InVideoQuizOverlay
  isOpen={isQuizOpen}
  quiz={currentQuiz}
  onSubmit={(result) => {
    console.log('Submitted:', result)
    setIsQuizOpen(false)
  }}
  onSkip={() => setIsQuizOpen(false)}
  videoRef={videoRef}
  currentQuestion={1}
  totalQuestions={3}
/>
```

---

### InVideoQuizCard

Quiz content card component with question, options, and controls.

```jsx
<InVideoQuizCard
  quiz={QuizObject}
  onSubmit={(result) => void}
  onSkip={() => void}
  currentQuestion={number}
  totalQuestions={number}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `quiz` | `QuizObject` | ✓ | Quiz data |
| `onSubmit` | `function` | ✓ | Submission handler |
| `onSkip` | `function` | ✓ | Skip handler |
| `currentQuestion` | `number` | ✗ | Question number |
| `totalQuestions` | `number` | ✗ | Total questions |

---

### QuizOption

Individual quiz option button component.

```jsx
<QuizOption
  label={string}
  isSelected={boolean}
  isCorrect={boolean}
  isSubmitted={boolean}
  onClick={() => void}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Option text |
| `isSelected` | `boolean` | Is this option selected? |
| `isCorrect` | `boolean` | Is this the correct answer? |
| `isSubmitted` | `boolean` | Has the quiz been submitted? |
| `onClick` | `function` | Option click handler |

---

### AnimatedProgressBar

Animated progress bar showing question progress.

```jsx
<AnimatedProgressBar
  current={number}
  total={number}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `current` | `number` | Current question number |
| `total` | `number` | Total number of questions |

---

## Data Structures

### QuizObject

```typescript
interface QuizObject {
  id: string
  timestamp: number
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'multiple-select'
  difficulty?: 'easy' | 'medium' | 'hard'
  question: string
  explanation?: string
  options: QuizOption[]
  points?: number
  timeLimit?: number | null
  retryable?: boolean
}
```

### QuizOption

```typescript
interface QuizOption {
  text: string
  isCorrect: boolean
  explanation?: string
}
```

### QuizResult

Returned from `onSubmit` callback:

```typescript
interface QuizResult {
  questionId: string
  selectedOption: number
  isCorrect: boolean
  timeSpent?: number
  timestamp?: Date
}
```

---

## Usage Patterns

### Pattern 1: Timestamp-Based (Automatic)

```jsx
import { InVideoQuizOverlay } from '@/components/InVideoQuiz'
import { useRef, useState, useEffect } from 'react'

export default function CourseVideo() {
  const videoRef = useRef(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [quizzes] = useState([
    {
      id: 'q1',
      timestamp: 30,
      question: 'What is...?',
      options: [
        { text: 'A', isCorrect: true },
        { text: 'B', isCorrect: false },
      ]
    }
  ])

  useEffect(() => {
    const handleTimeUpdate = () => {
      const quiz = quizzes.find(
        q => videoRef.current.currentTime >= q.timestamp &&
             videoRef.current.currentTime < q.timestamp + 2
      )
      if (quiz) setIsQuizOpen(true)
    }

    videoRef.current?.addEventListener('timeupdate', handleTimeUpdate)
    return () => videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate)
  }, [])

  return (
    <div className="relative bg-black rounded-lg">
      <video ref={videoRef} controls className="w-full" />
      <InVideoQuizOverlay
        isOpen={isQuizOpen}
        quiz={quizzes[0]}
        onSubmit={() => setIsQuizOpen(false)}
        onSkip={() => setIsQuizOpen(false)}
        videoRef={videoRef}
      />
    </div>
  )
}
```

### Pattern 2: Manual Trigger

```jsx
import { InVideoQuizOverlay } from '@/components/InVideoQuiz'
import { useState, useRef } from 'react'

export default function ManualQuiz() {
  const videoRef = useRef(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  return (
    <>
      <video ref={videoRef} controls className="w-full rounded-lg" />
      
      <button onClick={() => setIsQuizOpen(true)}>
        Show Quiz
      </button>

      <InVideoQuizOverlay
        isOpen={isQuizOpen}
        quiz={{
          id: 'q1',
          question: 'Test question?',
          options: [
            { text: 'Option A', isCorrect: true },
            { text: 'Option B', isCorrect: false },
          ]
        }}
        onSubmit={() => setIsQuizOpen(false)}
        onSkip={() => setIsQuizOpen(false)}
        videoRef={videoRef}
      />
    </>
  )
}
```

### Pattern 3: With Analytics

```jsx
const handleSubmit = async (result) => {
  // Save to backend
  await fetch('/api/quiz-attempts', {
    method: 'POST',
    body: JSON.stringify({
      quizId: result.questionId,
      isCorrect: result.isCorrect,
      timeSpent: Date.now() - quizStartTime,
      videoTimestamp: videoRef.current.currentTime,
    })
  })

  setIsQuizOpen(false)
}
```

---

## Customization

### Change Colors

Edit `src/components/InVideoQuiz/config.js`:

```javascript
export const QUIZ_CONFIG = {
  COLORS: {
    PRIMARY: 'blue',          // Change from 'indigo'
    SUCCESS: 'green',         // Change from 'emerald'
    BADGE_BG: 'bg-blue-100',
    BADGE_TEXT: 'text-blue-700',
    BUTTON_PRIMARY: 'bg-blue-600 hover:bg-blue-700',
  }
}
```

### Change Animation Speed

```javascript
export const QUIZ_CONFIG = {
  ANIMATION: {
    CARD_ENTER: 300,  // Faster (was 400ms)
    OVERLAY_ENTER: 250,
  }
}
```

### Change Card Width

Edit `InVideoQuizCard.jsx`:

```jsx
<motion.div className="w-full max-w-4xl">  {/* Change max-w-2xl to max-w-4xl */}
```

---

## Callbacks

### onSubmit

Called when user submits their answer.

```javascript
onSubmit={(result) => {
  console.log('Result:', {
    questionId: result.questionId,
    selectedOption: result.selectedOption,
    isCorrect: result.isCorrect
  })
})
```

### onSkip

Called when user skips the quiz.

```javascript
onSkip={() => {
  console.log('Quiz skipped')
})
```

---

## Performance Optimization

### Use React.memo for Options

```jsx
const MemoizedOption = React.memo(QuizOption)
```

### Debounce timeupdate

```javascript
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const handleTimeUpdate = debounce(() => {
  // Check for quiz
}, 100)
```

### Lazy Load Quiz Data

```javascript
const [quizzes, setQuizzes] = useState([])

useEffect(() => {
  fetch(`/api/quizzes/${videoId}`)
    .then(r => r.json())
    .then(data => setQuizzes(data.quizzes))
}, [videoId])
```

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Troubleshooting

### Quiz not showing

1. Check `isOpen` prop is `true`
2. Verify `quiz` object has required fields
3. Check `videoRef` is connected to video element

### Video not pausing

1. Ensure `videoRef.current` is not null
2. Check browser console for errors
3. Verify video is not in fullscreen

### Animations laggy

1. Use only `opacity` and `transform` animations
2. Enable GPU acceleration with `will-change`
3. Reduce blur effects on lower-end devices

---

## License

MIT

---

**For more examples, see:**
- `InVideoQuizDemo.jsx` - Basic demo
- `AdvancedCourseVideoPlayer.jsx` - Advanced implementation
- `IN_VIDEO_QUIZ_GUIDE.md` - Complete guide
