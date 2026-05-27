import { useState, useRef, useEffect } from 'react'
import { InVideoQuizOverlay } from '../InVideoQuiz'

export default function InVideoQuizDemo() {
  const videoRef = useRef(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [completedQuestions, setCompletedQuestions] = useState([])

  // Mock quiz data - Replace with real data from your backend
  const quizzes = [
    {
      id: 'quiz-1',
      timestamp: 10, // appears at 10 seconds
      question: 'What is the correct syntax for declaring a variable in JavaScript?',
      options: [
        { text: 'var x = 5;', isCorrect: true, explanation: 'Correct! This is the traditional way.' },
        { text: 'variable x = 5;', isCorrect: false, explanation: 'Incorrect. "variable" is not a keyword.' },
        { text: 'declare x = 5;', isCorrect: false, explanation: 'Incorrect. Use "var", "let", or "const".' },
        { text: 'x: 5;', isCorrect: false, explanation: 'Incorrect. This is object syntax, not variable declaration.' },
      ],
    },
    {
      id: 'quiz-2',
      timestamp: 30,
      question: 'Which data type is used to store a series of characters?',
      options: [
        { text: 'int', isCorrect: false, explanation: 'Incorrect. "int" stores numbers.' },
        { text: 'string', isCorrect: true, explanation: 'Correct! Strings store text characters.' },
        { text: 'float', isCorrect: false, explanation: 'Incorrect. "float" stores decimal numbers.' },
        { text: 'array', isCorrect: false, explanation: 'Incorrect. Arrays store collections of values.' },
      ],
    },
    {
      id: 'quiz-3',
      timestamp: 60,
      question: 'What is the purpose of the "console.log()" function?',
      options: [
        { text: 'To store data in a variable', isCorrect: false },
        { text: 'To output messages to the browser console', isCorrect: true, explanation: 'Correct! console.log() prints to the console.' },
        { text: 'To create a new function', isCorrect: false },
        { text: 'To manipulate the DOM', isCorrect: false },
      ],
    },
  ]

  // Check if quiz should appear at current time
  useEffect(() => {
    if (!videoRef.current) return

    const handleTimeUpdate = () => {
      const currentTime = videoRef.current.currentTime

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
    setCompletedQuestions([...completedQuestions, result.questionId])
    setIsQuizOpen(false)
  }

  const handleQuizSkip = () => {
    setIsQuizOpen(false)
  }

  const currentQuiz = quizzes[currentQuestion - 1]

  return (
    <div className="w-full bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Video Player Container */}
        <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
          {/* Video */}
          <video
            ref={videoRef}
            className="w-full h-auto"
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
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
          <div className="space-y-3 text-slate-700">
            <p className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Video automatically pauses when a quiz appears at specific timestamps</span>
            </p>
            <p className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                Quiz timestamps in demo: 10s, 30s, and 60s - Seek to those points to trigger quizzes
              </span>
            </p>
            <p className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>Answer questions or skip to resume playback</span>
            </p>
            <p className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>Smooth animations and premium feel like Udemy/Coursera</span>
            </p>
          </div>

          {/* Quiz Status */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Quiz Progress</h3>
            <div className="grid grid-cols-3 gap-3">
              {quizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className={`p-3 rounded-lg text-center ${
                    completedQuestions.includes(quiz.id)
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">Quiz {index + 1}</div>
                  <div className="text-xs mt-1">@{quiz.timestamp}s</div>
                  {completedQuestions.includes(quiz.id) && (
                    <div className="text-lg mt-1">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-3">
          <h3 className="text-white font-bold text-lg">Implementation</h3>
          <pre className="text-slate-300 text-sm overflow-x-auto bg-slate-900 p-4 rounded-lg">
{`import { InVideoQuizOverlay } from '@/components/InVideoQuiz'
import { useRef, useState } from 'react'

export default function CoursePlayer() {
  const videoRef = useRef(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  const quiz = {
    id: 'quiz-1',
    question: 'What is...?',
    options: [
      { text: 'Option A', isCorrect: true },
      { text: 'Option B', isCorrect: false },
    ]
  }

  return (
    <div className="relative w-full bg-black rounded-lg">
      <video ref={videoRef} controls className="w-full" />
      
      <InVideoQuizOverlay
        isOpen={isQuizOpen}
        quiz={quiz}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        videoRef={videoRef}
        currentQuestion={1}
        totalQuestions={3}
      />
    </div>
  )
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
