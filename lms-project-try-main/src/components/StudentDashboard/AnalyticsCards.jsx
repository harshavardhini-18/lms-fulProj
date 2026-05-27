import { useState, useEffect } from 'react'

// Minimal icon matching Image 2 - simple clipboard/list icon
function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="14" height="13" rx="2" stroke="#6B7280" strokeWidth="1.4" fill="none"/>
      <path d="M6 3V2a1 1 0 011-1h4a1 1 0 011 1v1" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M5 8h8M5 11h5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GreenDot() {
  return (
    <span style={{
      display: 'inline-block',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: '#22C55E',
      marginRight: '4px',
      flexShrink: 0,
    }} />
  )
}

// Card 1: With progress bar (Enrolled Courses style)
function ProgressCard({ icon, title, badge, value, progressLabel, progressPct }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      border: '1px solid #E5E7EB',
      padding: '20px 20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06)',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      minWidth: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px',
          background: '#F3F4F6',
          borderRadius: '8px',
          flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#374151', letterSpacing: '-0.01em' }}>
          {title}
        </span>
        {badge && (
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 500, color: '#22C55E', marginLeft: '2px' }}>
            <GreenDot />{badge}
          </span>
        )}
      </div>

      {/* Value */}
      <p style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#111827',
        lineHeight: 1,
        marginBottom: '14px',
        letterSpacing: '-0.03em',
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}>{value}</p>

      {/* Progress bar section */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Progress</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{progressLabel}</span>
        </div>
        <div style={{
          width: '100%', height: '5px',
          background: '#E5E7EB',
          borderRadius: '99px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: '#3B82F6',
            borderRadius: '99px',
          }} />
        </div>
      </div>
    </div>
  )
}

// Card 2: Simple with action button (no progress bar)
function SimpleCard({ icon, title, value, actionLabel, actionLink }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      border: '1px solid #E5E7EB',
      padding: '20px 20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06)',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      minWidth: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px',
          background: '#F3F4F6',
          borderRadius: '8px',
          flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#374151', letterSpacing: '-0.01em' }}>
          {title}
        </span>
      </div>

      {/* Value */}
      <p style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#111827',
        lineHeight: 1,
        marginBottom: '20px',
        letterSpacing: '-0.03em',
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}>{value}</p>

      {/* Action button */}
      <button
        onClick={() => actionLink && actionLink()}
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '9px 13px',
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
          fontSize: '12.5px',
          fontWeight: 500,
          color: '#374151',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
      >
        {actionLabel}
        <ArrowRight />
      </button>
    </div>
  )
}

export default function AnalyticsCards({ data }) {
  const enrolled = data?.enrolled_courses_count ?? 22
  const assignments = data?.total_assignments ?? 32
  const completedCourses = data?.completed_courses ?? 11
  const upcomingQuiz = data?.upcoming_quiz_days ?? '7 Days'
  const progressPct = data?.progress_percent ?? 55

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}>
        <ProgressCard
          icon={<ClipboardIcon />}
          title="Enrolled Courses"
          badge="Active"
          value={enrolled}
          progressLabel={`${progressPct}%`}
          progressPct={progressPct}
        />
        <SimpleCard
          icon={<ClipboardIcon />}
          title="Total Assignments"
          value={assignments}
          actionLabel="View All"
        />
        <SimpleCard
          icon={<ClipboardIcon />}
          title="Completed Courses"
          value={completedCourses}
          actionLabel="View Courses"
        />
        <SimpleCard
          icon={<ClipboardIcon />}
          title="Upcoming Quiz"
          value={upcomingQuiz}
          actionLabel="View Schedule"
        />
      </div>
    </>
  )
}