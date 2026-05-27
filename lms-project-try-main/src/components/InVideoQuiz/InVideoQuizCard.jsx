import { motion } from 'framer-motion'
import { useState } from 'react'
import AnimatedProgressBar from './AnimatedProgressBar'
import QuizOption from './QuizOption'

export default function InVideoQuizCard({ quiz, onSubmit, onSkip, currentQuestion = 1, totalQuestions = 1 }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true)
      setTimeout(() => {
        onSubmit({
          questionId: quiz.id,
          selectedOption,
          isCorrect: quiz.options[selectedOption].isCorrect,
        })
      }, 800)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.94,
      y: 10,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  }

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.15,
        duration: 0.3,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-[92%] sm:w-[88%] md:w-[82%] lg:w-[75%] max-w-[850px]"
    >
      {/* Quiz Card */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-200">
          {/* Badge */}
          <motion.div
            variants={contentVariants}
            className="inline-block"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-wide">
              CHECKPOINT QUIZ
            </span>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            variants={contentVariants}
            className="mt-6"
          >
            <AnimatedProgressBar current={currentQuestion} total={totalQuestions} />
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Question Text */}
          <motion.div variants={contentVariants} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 leading-snug">
              {quiz.question}
            </h2>
          </motion.div>

          {/* Options */}
          <motion.div
            variants={contentVariants}
            className="space-y-3"
          >
            {quiz.options.map((option, index) => (
              <QuizOption
                key={index}
                label={option.text}
                isSelected={selectedOption === index}
                isCorrect={option.isCorrect}
                isSubmitted={isSubmitted}
                onClick={() => {
                  if (!isSubmitted) {
                    setSelectedOption(index)
                  }
                }}
              />
            ))}
          </motion.div>

          {/* Feedback Message */}
          {isSubmitted && selectedOption !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl ${
                quiz.options[selectedOption].isCorrect
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              <p className="font-medium text-sm">
                {quiz.options[selectedOption].isCorrect
                  ? '✓ Correct! Well done!'
                  : '✕ Not quite. ' + (quiz.options[selectedOption].explanation || 'Try again!')}
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer - Buttons */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex gap-3">
          {!isSubmitted ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSkip}
                className="px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
              >
                Skip
              </motion.button>
              <motion.button
                whileHover={{ scale: selectedOption !== null ? 1.02 : 1 }}
                whileTap={{ scale: selectedOption !== null ? 0.98 : 1 }}
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedOption !== null
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Submit Answer
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSubmit({ questionId: quiz.id, selectedOption, isCorrect: quiz.options[selectedOption].isCorrect })}
              className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-200"
            >
              Continue
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
