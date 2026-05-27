import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, HelpCircle, Clock, Flame, Play, RotateCcw, ChevronRight } from 'lucide-react'

// ─── Course Data ──────────────────────────────────────────────────────────────

const COURSES = [
  {
    id: 1,
    title: 'C Programming Mastery',
    currentLesson: 'Pointers & Dynamic Memory Allocation',
    instructor: 'Kunal Kushwaha',
    progress: 65,
    resumeAt: '14:32',
    lessons: { done: 8, total: 12 },
    quizzes: { done: 2, total: 5 },
    timeLeft: '14 min',
    lastActive: '2 hrs ago',
    streak: 5,
    difficulty: 'Intermediate',
    status: 'in_progress',
    accent: { from: '#6366F1', to: '#818CF8', text: '#6366F1', soft: '#EEF2FF', muted: '#C7D2FE', chip: '#4338CA' },
  },
  {
    id: 2,
    title: 'Object-Oriented Programming',
    currentLesson: 'Inheritance & Polymorphism',
    instructor: 'Rachel Kim',
    progress: 45,
    resumeAt: '08:14',
    lessons: { done: 6, total: 15 },
    quizzes: { done: 1, total: 4 },
    timeLeft: '38 min',
    lastActive: 'Yesterday',
    streak: 2,
    difficulty: 'Beginner',
    status: 'in_progress',
    accent: { from: '#0EA5E9', to: '#38BDF8', text: '#0284C7', soft: '#F0F9FF', muted: '#BAE6FD', chip: '#0369A1' },
  },
  {
    id: 3,
    title: 'Data Structures Mastery',
    currentLesson: 'Graph Traversal Algorithms',
    instructor: 'John Smith',
    progress: 100,
    resumeAt: null,
    lessons: { done: 20, total: 20 },
    quizzes: { done: 5, total: 5 },
    timeLeft: null,
    lastActive: '3 days ago',
    streak: 0,
    difficulty: 'Advanced',
    status: 'completed',
    accent: { from: '#10B981', to: '#34D399', text: '#059669', soft: '#F0FDF4', muted: '#A7F3D0', chip: '#065F46' },
  },
]

// ─── Compact Ring ─────────────────────────────────────────────────────────────

function Ring({ percent, size, stroke, color, trackColor, delay = 0 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(percent, 100) / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: [0.34, 1.05, 0.64, 1], delay }}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Progress Avatar ──────────────────────────────────────────────────────────

function ProgressAvatar({ course, index }) {
  const { accent, progress, status } = course
  const isCompleted = status === 'completed'
  const size = 48

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Track + fill ring */}
      <Ring
        percent={progress}
        size={size}
        stroke={2.5}
        color={accent.from}
        trackColor={accent.muted + '55'}
        delay={0.15 + index * 0.07}
      />
      {/* Center gradient square */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '32px', height: '32px',
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 700,
          color: '#fff', letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {isCompleted ? '✓' : `${progress}%`}
        </span>
      </div>
    </div>
  )
}

// ─── Diff Tag ─────────────────────────────────────────────────────────────────

function DiffTag({ level }) {
  const map = {
    Beginner:     '#16A34A',
    Intermediate: '#CA8A04',
    Advanced:     '#DC2626',
  }
  return (
    <span style={{
      fontSize: '10px', fontWeight: 500,
      color: map[level] || '#6B7280',
      opacity: 0.75,
    }}>· {level}</span>
  )
}

// ─── Status Dot Chip ──────────────────────────────────────────────────────────

function StatusChip({ status, accent }) {
  if (status === 'completed') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '99px',
        fontSize: '10.5px', fontWeight: 600,
        color: '#065F46', background: '#DCFCE7',
        letterSpacing: '0.01em', flexShrink: 0,
      }}>
        <span style={{ fontSize: '8px' }}>✓</span> Completed
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '99px',
      fontSize: '10.5px', fontWeight: 600,
      color: accent.chip, background: accent.soft,
      letterSpacing: '0.01em', flexShrink: 0,
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: accent.from, display: 'inline-block', flexShrink: 0,
      }} />
      In Progress
    </span>
  )
}

// ─── Meta Item ────────────────────────────────────────────────────────────────

function Meta({ icon, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '11px', color: '#9CA3AF', fontWeight: 400,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'flex', opacity: 0.6 }}>{icon}</span>
      {label}
    </span>
  )
}

// ─── CTA Button ───────────────────────────────────────────────────────────────

function CTA({ isCompleted, accent }) {
  if (isCompleted) {
    return (
      <motion.button
        whileHover={{ backgroundColor: '#F3F4F6' }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '5px 11px',
          borderRadius: '7px',
          border: '1px solid #E5E7EB',
          background: '#FAFAFA',
          color: '#6B7280',
          fontSize: '11.5px', fontWeight: 500,
          cursor: 'pointer', letterSpacing: '0.01em',
          transition: 'background 0.15s',
        }}
      >
        <RotateCcw size={11} />
        Review
        <ArrowRight size={11} />
      </motion.button>
    )
  }
  return (
    <motion.button
      whileHover={{ opacity: 0.88, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '5px 12px',
        borderRadius: '7px',
        border: 'none',
        background: `linear-gradient(135deg, ${accent.from}ee, ${accent.to})`,
        color: '#fff',
        fontSize: '11.5px', fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.01em',
        boxShadow: `0 1px 6px ${accent.from}30`,
        transition: 'opacity 0.15s, box-shadow 0.15s',
      }}
    >
      <Play size={10} fill="#fff" color="#fff" />
      Resume Lesson
      <ChevronRight size={11} />
    </motion.button>
  )
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, index }) {
  const { accent, status } = course
  const isCompleted = status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.07 }}
      whileHover={{ y: -1.5, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F0F0F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.22s ease',
      }}
    >
      {/* Accent left edge */}
      <div style={{
        position: 'absolute', left: 0, top: '10px', bottom: '10px',
        width: '2.5px', borderRadius: '0 2px 2px 0',
        background: `linear-gradient(180deg, ${accent.from}, ${accent.to})`,
        opacity: 0.7,
      }} />

      {/* Progress Avatar */}
      <ProgressAvatar course={course} index={index} />

      {/* Content — main flex column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Row A: Title + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
            <h3 style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 650,
              fontSize: '13.5px',
              color: '#0F172A',
              letterSpacing: '-0.025em',
              margin: 0, lineHeight: 1.25,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{course.title}</h3>
            <DiffTag level={course.difficulty} />
          </div>
          <StatusChip status={status} accent={accent} />
        </div>

        {/* Row B: Instructor + current lesson inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{
            fontSize: '11px', color: '#94A3B8', fontWeight: 400,
            whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {course.instructor}
          </span>
          {!isCompleted && course.currentLesson && (
            <>
              <span style={{ fontSize: '11px', color: '#CBD5E1' }}>·</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '11px', fontWeight: 500,
                color: accent.chip,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                <Play size={9} fill={accent.chip} color={accent.chip} style={{ flexShrink: 0 }} />
                {course.currentLesson}
                {course.resumeAt && (
                  <span style={{ color: accent.chip, opacity: 0.5, flexShrink: 0 }}>
                    @ {course.resumeAt}
                  </span>
                )}
              </span>
            </>
          )}
        </div>

        {/* Row C: Meta + CTA on same row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Meta icon={<BookOpen size={10} />} label={`${course.lessons.done}/${course.lessons.total}`} />
            <Meta icon={<HelpCircle size={10} />} label={`${course.quizzes.done}/${course.quizzes.total}`} />
            {course.timeLeft && <Meta icon={<Clock size={10} />} label={course.timeLeft} />}
            {course.streak > 0 && (
              <Meta icon={<Flame size={10} color="#F97316" />} label={`${course.streak}d`} />
            )}
            <span style={{
              fontSize: '10.5px', color: '#CBD5E1',
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {course.lastActive}
            </span>
          </div>
          <CTA isCompleted={isCompleted} accent={accent} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function ContinueLearning({ data }) {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    setCourses(data?.courses || COURSES)
  }, [data])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: '780px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '16px', gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '4px',
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={9} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{
                fontSize: '10.5px', fontWeight: 700,
                color: '#6366F1', letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}>My Courses</span>
            </div>
            <h2 style={{
              fontSize: '20px', fontWeight: 800,
              color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>Continue Learning</h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '1px', fontWeight: 400 }}>
              Pick up where you left off
            </p>
          </div>

          <motion.button
            whileHover={{ boxShadow: '0 2px 10px rgba(0,0,0,0.09)' }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.15s',
            }}
          >
            All Courses <ArrowRight size={12} />
          </motion.button>
        </motion.div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {courses.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>

      </div>
    </>
  )
}
