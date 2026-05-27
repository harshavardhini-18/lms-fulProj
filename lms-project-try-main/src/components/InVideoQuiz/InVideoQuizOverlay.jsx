import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import InVideoQuizCard from './InVideoQuizCard'

export default function InVideoQuizOverlay({
  isOpen,
  quiz,
  onSubmit,
  onSkip,
  videoRef,
  currentQuestion = 1,
  totalQuestions = 1,
}) {
  const overlayRef = useRef(null)

  // Pause video when overlay opens
  useEffect(() => {
    if (isOpen && videoRef?.current) {
      videoRef.current.pause()
    }
  }, [isOpen, videoRef])

  // Resume video after submission/skip
  const handleQuizComplete = (result) => {
    if (videoRef?.current) {
      // Small delay for smooth transition
      setTimeout(() => {
        videoRef.current.play()
      }, 200)
    }
    onSubmit(result)
  }

  const handleSkip = () => {
    if (videoRef?.current) {
      setTimeout(() => {
        videoRef.current.play()
      }, 200)
    }
    onSkip()
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={overlayRef}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
        >
          {/* Video Background with Darkening and Blur */}
          <motion.div
            className="absolute inset-0 bg-black/35 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />

          {/* Content Container */}
          <motion.div
            className="relative z-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {quiz && (
              <InVideoQuizCard
                quiz={quiz}
                onSubmit={handleQuizComplete}
                onSkip={handleSkip}
                currentQuestion={currentQuestion}
                totalQuestions={totalQuestions}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
