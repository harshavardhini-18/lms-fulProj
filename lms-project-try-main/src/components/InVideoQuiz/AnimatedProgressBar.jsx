import { motion } from 'framer-motion'

export default function AnimatedProgressBar({ current, total }) {
  const percentage = (current / total) * 100

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">
          Question {current} of {total}
        </span>
        <span className="text-xs font-medium text-indigo-600">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress bar container */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        {/* Animated progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
        />
      </div>
    </div>
  )
}
