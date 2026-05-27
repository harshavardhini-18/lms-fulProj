/**
 * In-Video Quiz Configuration
 * 
 * Customize animation timings, colors, sizes, and behavior
 * without modifying component files
 */

export const QUIZ_CONFIG = {
  // Animation Timings (milliseconds)
  ANIMATION: {
    OVERLAY_ENTER: 400,      // Overlay fade in duration
    CARD_ENTER: 400,         // Card scale + fade duration
    PROGRESS_UPDATE: 600,    // Progress bar animation
    OPTION_HOVER: 200,       // Option hover effect
    FEEDBACK_DELAY: 800,     // Delay before continuing after answer
    EXIT_DURATION: 300,      // Exit animation duration
  },

  // Layout & Sizing
  LAYOUT: {
    CARD_MAX_WIDTH: '672px', // max-w-2xl equivalent
    CARD_BORDER_RADIUS: '1.5rem', // 24px
    OPTION_PADDING: 'px-5 py-4',
    OPTION_BORDER_RADIUS: 'rounded-xl',
    CARD_PADDING_X: 'px-8',
    CARD_PADDING_Y: 'py-8',
  },

  // Overlay Styling
  OVERLAY: {
    BACKGROUND_OPACITY: 0.35,    // 35% black
    BLUR_LEVEL: 'backdrop-blur-md',
    BACKDROP_FILTER: 'blur(12px)', // CSS value
  },

  // Colors (Tailwind classes)
  COLORS: {
    PRIMARY: 'indigo',
    SUCCESS: 'emerald',
    ERROR: 'red',
    BADGE_BG: 'bg-indigo-100',
    BADGE_TEXT: 'text-indigo-700',
    BUTTON_PRIMARY: 'bg-indigo-600 hover:bg-indigo-700',
    BUTTON_SECONDARY: 'bg-slate-300 text-slate-500',
    PROGRESS_BAR: 'from-indigo-500 to-indigo-600',
  },

  // Typography
  TYPOGRAPHY: {
    BADGE_TEXT: 'text-xs font-bold tracking-wide',
    QUESTION_TEXT: 'text-2xl font-bold text-slate-900',
    OPTION_TEXT: 'font-medium',
    PROGRESS_LABEL: 'text-xs font-semibold',
  },

  // Responsive Breakpoints (Tailwind)
  RESPONSIVE: {
    DESKTOP_WIDTH: '70%',
    TABLET_WIDTH: '80%',
    MOBILE_WIDTH: '95%',
    MOBILE_SAFE_MARGIN: 'p-4',
  },

  // Behavior
  BEHAVIOR: {
    AUTO_PAUSE_VIDEO: true,      // Pause video when quiz opens
    AUTO_RESUME_VIDEO: true,     // Resume video after quiz completes
    DISABLE_VIDEO_CONTROLS: false, // Disable controls during quiz
    SKIP_ALLOWED: true,          // Allow skipping quizzes
    SHOW_EXPLANATIONS: true,     // Show option explanations
    REQUIRE_ANSWER: true,        // Require selecting answer before submit
  },

  // Accessibility
  ACCESSIBILITY: {
    KEYBOARD_SHORTCUTS: true,
    FOCUS_TRAP: true,
    SCREEN_READER_ANNOUNCEMENTS: true,
  },

  // Analytics Tracking
  ANALYTICS: {
    TRACK_IMPRESSIONS: true,
    TRACK_INTERACTIONS: true,
    TRACK_COMPLETIONS: true,
    SEND_TO_BACKEND: true,
  },
}

/**
 * Animation Easing Functions
 * Used in Framer Motion animations
 */
export const EASING = {
  ENTER: 'easeOut',
  EXIT: 'easeIn',
  SMOOTH: 'easeInOut',
}

/**
 * Animation Variants for Framer Motion
 */
export const ANIMATION_VARIANTS = {
  // Overlay entrance/exit
  overlay: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: QUIZ_CONFIG.ANIMATION.OVERLAY_ENTER / 1000, ease: EASING.ENTER },
    },
    exit: {
      opacity: 0,
      transition: { duration: QUIZ_CONFIG.ANIMATION.EXIT_DURATION / 1000, ease: EASING.EXIT },
    },
  },

  // Card entrance/exit
  card: {
    hidden: { opacity: 0, scale: 0.96, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: QUIZ_CONFIG.ANIMATION.CARD_ENTER / 1000,
        ease: EASING.ENTER,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.94,
      y: 10,
      transition: { duration: QUIZ_CONFIG.ANIMATION.EXIT_DURATION / 1000, ease: EASING.EXIT },
    },
  },

  // Content fade in (staggered)
  content: {
    hidden: { opacity: 0 },
    visible: (custom) => ({
      opacity: 1,
      transition: {
        delay: (custom || 0) * 0.1,
        duration: 0.3,
      },
    }),
  },

  // Option hover
  option: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },
}

/**
 * Color Palettes (for easy switching)
 */
export const COLOR_SCHEMES = {
  INDIGO: {
    primary: 'indigo',
    badge: 'bg-indigo-100 text-indigo-700',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    progress: 'from-indigo-500 to-indigo-600',
  },
  BLUE: {
    primary: 'blue',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    progress: 'from-blue-500 to-blue-600',
  },
  PURPLE: {
    primary: 'purple',
    badge: 'bg-purple-100 text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700',
    progress: 'from-purple-500 to-purple-600',
  },
  EMERALD: {
    primary: 'emerald',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    progress: 'from-emerald-500 to-emerald-600',
  },
}

/**
 * Quiz Difficulty Levels
 */
export const DIFFICULTY_LEVELS = {
  EASY: {
    name: 'easy',
    label: 'Easy',
    color: 'bg-emerald-200 text-emerald-800',
    points: 5,
  },
  MEDIUM: {
    name: 'medium',
    label: 'Medium',
    color: 'bg-amber-200 text-amber-800',
    points: 10,
  },
  HARD: {
    name: 'hard',
    label: 'Hard',
    color: 'bg-red-200 text-red-800',
    points: 15,
  },
}

/**
 * Quiz Type Configuration
 */
export const QUIZ_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  FILL_BLANK: 'fill-blank',
  MULTIPLE_SELECT: 'multiple-select',
}

/**
 * Toast/Notification Messages
 */
export const MESSAGES = {
  CORRECT: '✓ Correct! Well done!',
  INCORRECT: '✕ Not quite. ',
  QUIZ_SKIPPED: 'Quiz skipped. Video will resume now.',
  QUIZ_COMPLETED: 'Great! Moving to the next part.',
  ERROR: 'Something went wrong. Please try again.',
  LOADING: 'Loading quiz...',
}

/**
 * Helper function to apply custom color scheme
 */
export const applyColorScheme = (schemeName) => {
  const scheme = COLOR_SCHEMES[schemeName.toUpperCase()]
  if (!scheme) {
    console.warn(`Color scheme "${schemeName}" not found. Using default.`)
    return COLOR_SCHEMES.INDIGO
  }
  return scheme
}

/**
 * Helper function to get animation variant
 */
export const getAnimationVariant = (variantName) => {
  return ANIMATION_VARIANTS[variantName] || ANIMATION_VARIANTS.card
}

/**
 * Default Quiz Data Template
 */
export const QUIZ_TEMPLATE = {
  id: 'quiz-id',
  timestamp: 0,
  type: QUIZ_TYPES.MULTIPLE_CHOICE,
  difficulty: 'medium',
  question: 'What is the question?',
  explanation: 'Detailed explanation (optional)',
  options: [
    {
      text: 'Option A',
      isCorrect: true,
      explanation: 'Why this is correct',
    },
    {
      text: 'Option B',
      isCorrect: false,
      explanation: 'Why this is incorrect',
    },
  ],
  points: 10,
  timeLimit: null, // null = no time limit
  retryable: true,
}

export default QUIZ_CONFIG
