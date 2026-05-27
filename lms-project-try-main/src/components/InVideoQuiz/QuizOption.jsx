import { motion } from 'framer-motion'

export default function QuizOption({ label, isSelected, isCorrect, isSubmitted, onClick }) {
  const isDisabled = isSubmitted && !isSelected

  return (
    <motion.button
      onClick={onClick}
      disabled={isSubmitted || isDisabled}
      whileHover={!isSubmitted ? { scale: 1.02 } : {}}
      whileTap={!isSubmitted ? { scale: 0.98 } : {}}
      className={`
        w-full px-5 py-4 rounded-xl border-2 transition-all duration-200
        font-medium text-left flex items-center space-x-3
        ${
          isSelected
            ? isSubmitted
              ? isCorrect
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                : 'border-red-500 bg-red-50 text-red-900'
              : 'border-indigo-500 bg-indigo-50 text-indigo-900'
            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
        }
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Radio button indicator */}
      <motion.div
        className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${
            isSelected
              ? isSubmitted
                ? isCorrect
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-red-500 bg-red-500'
                : 'border-indigo-500 bg-indigo-500'
              : 'border-slate-300 bg-white'
          }
        `}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        {isSelected && (
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Checkmark or X for submitted answers */}
        {isSubmitted && isSelected && (
          <motion.div
            className="w-2 h-2 text-white flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {isCorrect ? '✓' : '✕'}
          </motion.div>
        )}
      </motion.div>

      {/* Label */}
      <span className="flex-1">{label}</span>

      {/* Icon indicator for correct/incorrect */}
      {isSubmitted && isSelected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex-shrink-0 text-lg font-bold ${
            isCorrect ? 'text-emerald-500' : 'text-red-500'
          }`}
        >
          {isCorrect ? '✓' : '✕'}
        </motion.span>
      )}
    </motion.button>
  )
}
