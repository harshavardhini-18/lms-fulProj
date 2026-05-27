import { Target, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

// Toggle to hide this widget without removing code (returns null when true)
const HIDE_QUIZ_PERFORMANCE_WIDGET = true

const subjectPerformance = [
  { subject: 'Java', score: 88, passed: true },
  { subject: 'C language', score: 92, passed: true },
  { subject: 'React', score: 78, passed: true },
  { subject: 'Python', score: 65, passed: false },
]

function DonutRing({ passRate }) {
  const size = 120
  const stroke = 9
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const filled = (passRate / 100) * circ

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        {/* Failed arc */}
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="#FCA5A5" strokeWidth={stroke}
          strokeDasharray={`${circ - filled} ${filled}`}
          strokeDashoffset={-filled}
          strokeLinecap="round"
        />
        {/* Passed arc */}
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#passGrad)" strokeWidth={stroke}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="passGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 800, fontSize: '22px',
          color: '#0F172A', lineHeight: 1,
        }}>{passRate}%</span>
        <span style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '10px', color: '#94A3B8',
          fontWeight: 600, letterSpacing: '0.06em',
          marginTop: '2px',
        }}>PASS RATE</span>
      </div>
    </div>
  )
}

function SubjectBar({ subject, score, passed, isTop, isBottom }) {
  const barColor = score >= 85 ? '#10B981' : score >= 75 ? '#6366F1' : score >= 65 ? '#F59E0B' : '#F87171'

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '5px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: barColor, flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600, fontSize: '13px', color: '#334155',
          }}>{subject}</span>
          {isTop && (
            <span style={{
              background: '#D1FAE5', color: '#065F46',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '10px', fontWeight: 700,
              padding: '1px 7px', borderRadius: '20px',
              letterSpacing: '0.04em',
            }}>TOP</span>
          )}
          {isBottom && (
            <span style={{
              background: '#FEE2E2', color: '#991B1B',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '10px', fontWeight: 700,
              padding: '1px 7px', borderRadius: '20px',
              letterSpacing: '0.04em',
            }}>WEAK</span>
          )}
        </div>
        <span style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700, fontSize: '14px',
          color: barColor,
        }}>{score}%</span>
      </div>
      <div style={{
        width: '100%', height: '5px',
        background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${score}%`,
          background: barColor,
          borderRadius: '99px',
          transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 6px ${barColor}66`,
        }} />
      </div>
    </div>
  )
}

export default function QuizPerformanceWidget({ data }) {
  if (HIDE_QUIZ_PERFORMANCE_WIDGET) return null
  const totalQuizzes = data?.quizzes_total || 8
  const passedQuizzes = data?.quizzes_passed || 6
  const failedQuizzes = totalQuizzes - passedQuizzes
  const passRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0

  const topIdx = subjectPerformance.reduce((bi, s, i) => s.score > subjectPerformance[bi].score ? i : bi, 0)
  const botIdx = subjectPerformance.reduce((bi, s, i) => s.score < subjectPerformance[bi].score ? i : bi, 0)

  const statusConfig =
    passRate >= 80
      ? { label: 'Excellent', bg: '#ECFDF5', color: '#065F46', dot: '#10B981' }
      : passRate >= 60
      ? { label: 'Focus on weak areas', bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' }
      : { label: 'Needs improvement', bg: '#FEF2F2', color: '#991B1B', dot: '#F87171' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        .qpw-btn:hover { opacity: 0.85; transform: scale(1.02); }
      `}</style>

      <div style={{
        background: '#fff',
        borderRadius: '22px',
        border: '1.5px solid #F1F5F9',
        boxShadow: '0 4px 24px 0 #0000000D',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
            <Target size={14} color="#6366F1" />
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '11px', fontWeight: 700,
              color: '#6366F1', letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Quiz Performance</p>
          </div>
          <h3 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800, fontSize: '20px',
            color: '#0F172A', lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}>Your Progress</h3>
        </div>

        {/* Donut + Stats */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px',
        }}>
          <DonutRing passRate={passRate} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Passed */}
            <div style={{
              background: '#F0FDF4',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <TrendingUp size={14} color="#10B981" />
                <span style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '12px', fontWeight: 600, color: '#065F46',
                }}>Passed</span>
              </div>
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800, fontSize: '18px', color: '#10B981',
              }}>{passedQuizzes}<span style={{ fontSize: '12px', color: '#86EFAC' }}>/{totalQuizzes}</span></span>
            </div>
            {/* Failed */}
            <div style={{
              background: '#FFF1F2',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <TrendingDown size={14} color="#F87171" />
                <span style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '12px', fontWeight: 600, color: '#991B1B',
                }}>Failed</span>
              </div>
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800, fontSize: '18px', color: '#F87171',
              }}>{failedQuizzes}<span style={{ fontSize: '12px', color: '#FECACA' }}>/{totalQuizzes}</span></span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          background: statusConfig.bg,
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: statusConfig.dot, flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '12.5px', fontWeight: 700, color: statusConfig.color,
          }}>{statusConfig.label}</span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '20px' }} />

        {/* Subject Performance */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '11px', fontWeight: 700,
            color: '#94A3B8', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: '14px',
          }}>Subject Breakdown</p>
          {subjectPerformance.map((s, i) => (
            <SubjectBar
              key={s.subject}
              {...s}
              isTop={i === topIdx}
              isBottom={i === botIdx}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          className="qpw-btn"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '11px 16px',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            transition: 'opacity 0.15s, transform 0.15s',
            boxShadow: '0 4px 14px 0 #6366F155',
            letterSpacing: '0.01em',
          }}
        >
          View Detailed Results <ArrowRight size={14} />
        </button>
      </div>
    </>
  )
}