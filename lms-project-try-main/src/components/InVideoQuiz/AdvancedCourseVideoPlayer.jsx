import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { InVideoQuizOverlay } from '../InVideoQuiz'

/**
 * Advanced Example: Full Course Video Player with In-Video Quizzes
 * 
 * Features:
 * - Quiz data from API
 * - Progress tracking and analytics
 * - Multiple quiz types
 * - Conditional quiz display
 * - Video quality selection
 * - Quiz statistics
 */
export default function AdvancedCourseVideoPlayer() {
  const videoRef = useRef(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [completedQuestions, setCompletedQuestions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [videoProgress, setVideoProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [videoQuality, setVideoQuality] = useState('1080p')
  const [stats, setStats] = useState({
    correctAnswers: 0,
    totalAnswers: 0,
    accuracy: 0,
  })

  // Mock: Fetch quizzes from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setQuizzes([
        {
          id: 'quiz-1',
          timestamp: 15,
          type: 'multiple-choice',
          difficulty: 'easy',
          question: 'Which of the following is a valid React Hook?',
          options: [
            { text: 'useState', isCorrect: true, explanation: 'Correct! useState is a fundamental React Hook.' },
            { text: 'useStore', isCorrect: false },
            { text: 'useDOM', isCorrect: false },
            { text: 'useComponent', isCorrect: false },
          ],
        },
        {
          id: 'quiz-2',
          timestamp: 45,
          type: 'multiple-choice',
          difficulty: 'medium',
          question: 'What is the purpose of useEffect in React?',
          options: [
            { text: 'To manage component state', isCorrect: false },
            { text: 'To perform side effects and manage lifecycle', isCorrect: true, explanation: 'Correct! useEffect handles side effects and lifecycle events.' },
            { text: 'To create new components', isCorrect: false },
            { text: 'To handle routing', isCorrect: false },
          ],
        },
        {
          id: 'quiz-3',
          timestamp: 90,
          type: 'multiple-choice',
          difficulty: 'hard',
          question: 'How do you optimize performance in React?',
          options: [
            { text: 'By rendering on every state change', isCorrect: false },
            { text: 'By using React.memo, useMemo, and useCallback', isCorrect: true, explanation: 'Correct! These hooks help prevent unnecessary re-renders.' },
            { text: 'By increasing component complexity', isCorrect: false },
            { text: 'By using more state variables', isCorrect: false },
          ],
        },
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  // Video time tracking
  useEffect(() => {
    if (!videoRef.current) return

    const handleTimeUpdate = () => {
      const currentTime = videoRef.current.currentTime
      const duration = videoRef.current.duration

      // Update progress
      setVideoProgress((currentTime / duration) * 100)

      // Find quiz at current timestamp
      const currentQuiz = quizzes.find(
        (q) =>
          currentTime >= q.timestamp &&
          currentTime < q.timestamp + 2 &&
          !completedQuestions.includes(q.id)
      )

      if (currentQuiz && !isQuizOpen) {
        setIsQuizOpen(true)
        const questionIndex = quizzes.findIndex((q) => q.id === currentQuiz.id)
        setCurrentQuestion(questionIndex + 1)
      }
    }

    const videoElement = videoRef.current
    videoElement.addEventListener('timeupdate', handleTimeUpdate)

    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate)
  }, [isQuizOpen, completedQuestions, quizzes])

  const handleQuizSubmit = (result) => {
    // Update stats
    if (result.isCorrect) {
      setStats((prev) => ({
        correctAnswers: prev.correctAnswers + 1,
        totalAnswers: prev.totalAnswers + 1,
        accuracy: ((prev.correctAnswers + 1) / (prev.totalAnswers + 1)) * 100,
      }))
    } else {
      setStats((prev) => ({
        ...prev,
        totalAnswers: prev.totalAnswers + 1,
        accuracy: (prev.correctAnswers / (prev.totalAnswers + 1)) * 100,
      }))
    }

    setCompletedQuestions([...completedQuestions, result.questionId])
    setIsQuizOpen(false)
  }

  const handleQuizSkip = () => {
    setStats((prev) => ({
      ...prev,
      totalAnswers: prev.totalAnswers + 1,
    }))
    setIsQuizOpen(false)
  }

  const currentQuiz = quizzes[currentQuestion - 1]
  const completionPercentage = (completedQuestions.length / quizzes.length) * 100

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 space-y-8 p-4 lg:p-8">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Video Player Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Video */}
          <video
            ref={videoRef}
            className="w-full h-auto max-h-screen"
            controls
            controlsList="nodownload"
          >
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>

          {/* In-Video Quiz Overlay */}
          {currentQuiz && (
            <InVideoQuizOverlay
              isOpen={isQuizOpen}
              quiz={currentQuiz}
              onSubmit={handleQuizSubmit}
              onSkip={handleQuizSkip}
              videoRef={videoRef}
              currentQuestion={currentQuestion}
              totalQuestions={quizzes.length}
            />
          )}
        </motion.div>

        {/* Course Info & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 space-y-4"
          >
            <h1 className="text-2xl font-bold text-slate-900">React Hooks Fundamentals</h1>
            <p className="text-slate-600 text-sm">
              Learn the essential React Hooks to build modern, functional components with state and lifecycle management.
            </p>

            {/* Video Quality Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">Video Quality</label>
              <div className="flex gap-2">
                {['480p', '720p', '1080p'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setVideoQuality(quality)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      videoQuality === quality
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Performance Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 space-y-4 text-white"
          >
            <h2 className="text-xl font-bold">Quiz Performance</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold">{stats.correctAnswers}</div>
                <div className="text-sm text-indigo-200">Correct</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{stats.totalAnswers}</div>
                <div className="text-sm text-indigo-200">Total</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{Math.round(stats.accuracy)}%</div>
                <div className="text-sm text-indigo-200">Accuracy</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-4 border-t border-indigo-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quiz Completion</span>
                <span className="text-sm">{Math.round(completionPercentage)}%</span>
              </div>
              <motion.div
                className="w-full h-2 bg-indigo-500/30 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Quizzes List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 space-y-4"
        >
          <h2 className="text-xl font-bold text-slate-900">Checkpoint Quizzes</h2>

          <div className="space-y-3">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                whileHover={{ scale: 1.01 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  completedQuestions.includes(quiz.id)
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">
                      Quiz {index + 1} @ {quiz.timestamp}s
                    </div>
                    <div className="text-sm text-slate-600">
                      {quiz.question.substring(0, 60)}...
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        quiz.difficulty === 'easy' ? 'bg-emerald-200 text-emerald-800' :
                        quiz.difficulty === 'medium' ? 'bg-amber-200 text-amber-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                      </span>
                    </div>
                  </div>

                  {completedQuestions.includes(quiz.id) ? (
                    <div className="text-center space-y-1">
                      <div className="text-3xl">✓</div>
                      <div className="text-xs font-semibold text-emerald-700">Completed</div>
                    </div>
                  ) : (
                    <div className="text-slate-400">Pending</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded"
        >
          <p className="text-indigo-900 text-sm">
            💡 <strong>Tip:</strong> Quizzes appear automatically at 15s, 45s, and 90s. You can also seek to any timestamp to trigger quizzes. Skip quizzes to continue watching, or submit answers to see immediate feedback.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
