import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, TrendingUp } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKS = 6
const TODAY_COL = 3  // Thursday column (0-indexed)
const TODAY_ROW = WEEKS - 1

// Soft indigo/purple palette — 5 intensity levels
const PALETTE_LIGHT = ['#F1EFE8', '#EEEDFE', '#AFA9EC', '#7F77DD', '#534AB7']
const PALETTE_DARK  = ['#2a2a2a', '#3C3489', '#534AB7', '#7F77DD', '#AFA9EC']

// Generate mock weekly heatmap data
function generateHeatmap() {
  const baseActivity = [1.5, 2.2, 0.8, 3.4, 2.9, 1.2, 1.1]
  return Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      if (w === TODAY_ROW && d > TODAY_COL) return 0
      if (w === 0 && d > 4) return 0
      const noise = (Math.sin(w * 7 + d) * 0.5 + 0.5) * 0.8
      return Math.round((baseActivity[d] + noise) * 10) / 10
    })
  )
}

const HEATMAP = generateHeatmap()

// Daily hourly breakdown
const DAILY_SLOTS = [
  { label: '6am',  val: 0.3 },
  { label: '8am',  val: 0.8 },
  { label: '10am', val: 1.4 },
  { label: '12pm', val: 0.4 },
  { label: '2pm',  val: 0.7 },
  { label: '4pm',  val: 0.6 },
  { label: '6pm',  val: 0.0 },
  { label: '8pm',  val: 0.0 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function intensityIdx(val) {
  if (val === 0) return 0
  if (val < 1)  return 1
  if (val < 2)  return 2
  if (val < 3)  return 3
  return 4
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ text, x, y }) {
  if (!text) return null
  return (
    <div style={{
      position: 'fixed',
      left: x + 12,
      top: y - 28,
      background: '#fff',
      border: '0.5px solid #E5E7EB',
      borderRadius: '6px',
      padding: '4px 9px',
      fontSize: '11px',
      color: '#374151',
      pointerEvents: 'none',
      zIndex: 999,
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
    }}>{text}</div>
  )
}

// ─── Heatmap Cell ─────────────────────────────────────────────────────────────

function HeatCell({ val, isToday, dayLabel, onHover, onLeave }) {
  const idx = intensityIdx(val)
  const bg = PALETTE_LIGHT[idx]

  return (
    <motion.div
      whileHover={{ scale: 1.2, zIndex: 2 }}
      transition={{ duration: 0.12 }}
      onMouseEnter={(e) => onHover(val === 0 ? 'No activity' : `${val}h · ${dayLabel}`, e)}
      onMouseMove={(e) => onHover(null, e, true)}
      onMouseLeave={onLeave}
      style={{
        aspectRatio: '1',
        borderRadius: '4px',
        background: bg,
        cursor: 'default',
        position: 'relative',
        outline: isToday ? '1.5px solid #6366F1' : 'none',
        outlineOffset: '1px',
      }}
    />
  )
}

// ─── Weekly Heatmap View ──────────────────────────────────────────────────────

function WeeklyView() {
  const [tooltip, setTooltip] = useState({ text: null, x: 0, y: 0 })

  const handleHover = useCallback((text, e, moveOnly = false) => {
    setTooltip(prev => ({
      text: moveOnly ? prev.text : text,
      x: e.clientX,
      y: e.clientY,
    }))
  }, [])

  const handleLeave = useCallback(() => {
    setTooltip({ text: null, x: 0, y: 0 })
  }, [])

  return (
    <>
      <Tooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />

      {/* Day labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '4px',
      }}>
        {DAYS.map(d => (
          <div key={d} style={{
            fontSize: '10px',
            color: '#9CA3AF',
            textAlign: 'center',
            paddingBottom: '2px',
          }}>{d[0]}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '8px',
      }}>
        {HEATMAP.map((week, wi) =>
          week.map((val, di) => (
            <HeatCell
              key={`${wi}-${di}`}
              val={val}
              isToday={wi === TODAY_ROW && di === TODAY_COL}
              dayLabel={DAYS[di]}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Less</span>
        {PALETTE_LIGHT.map((c, i) => (
          <span key={i} style={{
            width: '10px', height: '10px',
            borderRadius: '3px',
            background: c,
            display: 'inline-block',
            border: i === 0 ? '0.5px solid #E5E7EB' : 'none',
          }} />
        ))}
        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>More</span>
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', background: '#F0F0F0', margin: '14px 0' }} />

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div>
          <div style={{
            fontSize: '24px', fontWeight: 600,
            color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1,
          }}>19.5h</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>focused this week</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '12px', fontWeight: 500, color: '#16A34A',
            display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end',
          }}>
            <TrendingUp size={12} />
            12% more consistent
          </div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>than last week</div>
        </div>
      </div>

      {/* Insights */}
      <InsightPill color="#F97316" text="5-day streak · Thursday was your peak day" />
      <InsightPill color="#6366F1" text="3 lessons completed today · keep it up" style={{ marginTop: '6px' }} />
    </>
  )
}

// ─── Insight Pill ─────────────────────────────────────────────────────────────

function InsightPill({ color, text, style: extraStyle = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 11px',
      background: '#F8F9FA',
      borderRadius: '8px',
      ...extraStyle,
    }}>
      <div style={{
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: '12px', color: '#4B5563', lineHeight: 1.4,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>{text}</span>
    </div>
  )
}

// ─── Daily View ───────────────────────────────────────────────────────────────

function DailyView() {
  const maxVal = Math.max(...DAILY_SLOTS.map(s => s.val))
  const BAR_COLOR = '#7F77DD'

  return (
    <>
      <div style={{ marginBottom: '14px' }}>
        <div style={{
          fontSize: '24px', fontWeight: 600,
          color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1,
        }}>4.2h</div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>studied today</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
        {DAILY_SLOTS.map((slot, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#9CA3AF', width: '28px', flexShrink: 0 }}>
              {slot.label}
            </span>
            <div style={{
              flex: 1, height: '5px',
              background: '#F3F4F6',
              borderRadius: '99px',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: slot.val === 0 ? 0 : `${Math.round((slot.val / maxVal) * 100)}%` }}
                transition={{ duration: 0.7, ease: [0.34, 1.1, 0.64, 1], delay: i * 0.04 }}
                style={{
                  height: '100%',
                  background: slot.val >= 1.2 ? '#534AB7' : BAR_COLOR,
                  borderRadius: '99px',
                }}
              />
            </div>
            <span style={{
              fontSize: '10.5px', color: '#9CA3AF',
              width: '28px', textAlign: 'right', flexShrink: 0,
            }}>
              {slot.val > 0 ? `${slot.val}h` : '—'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: '0.5px', background: '#F0F0F0', margin: '12px 0' }} />
      <InsightPill color="#6366F1" text="Most focused 9–11am · morning peak" />
    </>
  )
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function LearningActivity({ data }) {
  const [tab, setTab] = useState('weekly')

  return (
    <>
      <style>{`\n        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');\n        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n      `}</style>

      <div style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        maxWidth: '300px',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            marginBottom: '3px',
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '4px',
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={9} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: '10.5px', fontWeight: 600,
              color: '#6366F1', letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Learning Activity</span>
          </div>
          <h2 style={{
            fontSize: '18px', fontWeight: 600,
            color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.2,
          }}>Weekly Consistency</h2>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px', fontWeight: 400 }}>
            Track your study habits
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #F0F0F0',
          padding: '16px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>

          {/* Segmented tabs */}
          <div style={{
            display: 'flex',
            background: '#F3F4F6',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px',
            width: 'fit-content',
            marginBottom: '16px',
          }}>
            {['weekly', 'daily'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: tab === t ? '0.5px solid #E5E7EB' : 'none',
                  cursor: 'pointer',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#111827' : '#6B7280',
                  transition: 'all 0.15s ease',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab views */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {tab === 'weekly' ? <WeeklyView /> : <DailyView />}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </>
  )
}
