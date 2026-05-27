import { useState } from 'react'
import { motion } from 'framer-motion'
import InVideoQuizDemo from '../../components/InVideoQuiz/InVideoQuizDemo'
import AdvancedCourseVideoPlayer from '../../components/InVideoQuiz/AdvancedCourseVideoPlayer'

export default function InVideoQuizPage() {
  const [activeDemo, setActiveDemo] = useState('basic')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-4"
      >
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold">In-Video Quiz Overlay</h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
            Premium LMS-style quiz experience embedded inside video players - Just like Udemy & Coursera
          </p>
        </div>
      </motion.div>

      {/* Demo Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="sticky top-0 z-40 bg-white shadow-lg border-b border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveDemo('basic')}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeDemo === 'basic'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📚 Basic Demo
          </button>
          <button
            onClick={() => setActiveDemo('advanced')}
            className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeDemo === 'advanced'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ⚡ Advanced Demo
          </button>
          <a
            href="https://github.com/yourusername/in-video-quiz"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all whitespace-nowrap"
          >
            💻 Documentation
          </a>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeDemo}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        {activeDemo === 'basic' ? (
          <InVideoQuizDemo />
        ) : (
          <AdvancedCourseVideoPlayer />
        )}
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white py-16 px-4"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-slate-900">Features</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Everything you need to create an engaging video learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🎬',
                title: 'Embedded in Video',
                description: 'Quiz overlay positioned inside the video player, not a separate popup',
              },
              {
                icon: '⏸️',
                title: 'Auto Pause/Resume',
                description: 'Video automatically pauses when quiz appears and resumes after completion',
              },
              {
                icon: '✨',
                title: 'Smooth Animations',
                description: 'Premium cinematic transitions with Framer Motion (300-450ms)',
              },
              {
                icon: '📱',
                title: 'Fully Responsive',
                description: 'Perfect on desktop, tablet, and mobile devices',
              },
              {
                icon: '⏱️',
                title: 'Timestamp-Based',
                description: 'Show quizzes at specific video timestamps automatically',
              },
              {
                icon: '📊',
                title: 'Progress Tracking',
                description: 'Animated progress bar with question counter and instant feedback',
              },
              {
                icon: '🎨',
                title: 'Customizable',
                description: 'Change colors, animations, sizes through config files',
              },
              {
                icon: '⌨️',
                title: 'Keyboard Support',
                description: 'Full keyboard accessibility for better user experience',
              },
              {
                icon: '🚀',
                title: 'High Performance',
                description: 'GPU-optimized with only opacity and transform animations',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="font-bold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Integration Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-50 py-16 px-4"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Quick Integration</h2>
            <p className="text-slate-600">Get started in 5 minutes</p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Import Component',
                code: "import { InVideoQuizOverlay } from '@/components/InVideoQuiz'",
              },
              {
                step: '2',
                title: 'Create Quiz Data',
                code: `const quiz = {
  id: 'quiz-1',
  question: 'What is...?',
  options: [
    { text: 'Option A', isCorrect: true },
    { text: 'Option B', isCorrect: false },
  ]
}`,
              },
              {
                step: '3',
                title: 'Render Overlay',
                code: `<InVideoQuizOverlay
  isOpen={isQuizOpen}
  quiz={quiz}
  onSubmit={handleSubmit}
  onSkip={handleSkip}
  videoRef={videoRef}
/>`,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl border-l-4 border-indigo-600 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                </div>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                  {item.code}
                </pre>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="bg-slate-900 text-white py-12 px-4 text-center space-y-4"
      >
        <h3 className="text-2xl font-bold">Ready to enhance your learning experience?</h3>
        <p className="text-slate-300 max-w-xl mx-auto">
          Start using In-Video Quiz Overlay today and create engaging checkpoint quizzes that feel like a premium LMS.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all">
            📖 Read Docs
          </button>
          <button className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">
            💬 Get Support
          </button>
        </div>
      </motion.div>
    </div>
  )
}
