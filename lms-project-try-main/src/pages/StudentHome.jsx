import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './StudentHome.module.css'

function pad2(value) {
  return String(value).padStart(2, '0')
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function formatTimeLabel(date) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function monthTitle(date) {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date)
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const STORAGE_KEY = 'lmsStudentReminders:v1'
const SETTINGS_KEY = 'lmsStudentReminderSettings:v1'

function StudentHome() {
  const navigate = useNavigate()
  const now = new Date()
  const [activeMonth, setActiveMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(now))

  const [items, setItems] = useState(() => loadJson(STORAGE_KEY, []))
  const [settings, setSettings] = useState(() =>
    loadJson(SETTINGS_KEY, {
      dailyStudyEnabled: false,
      dailyStudyTime: '19:30',
      notificationsEnabled: false,
      lastDailyStudyNotified: null,
    }),
  )

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('study')
  const [dateValue, setDateValue] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  })
  const [timeValue, setTimeValue] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000)
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  })
  const [details, setDetails] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [undoState, setUndoState] = useState(null) // { item, expiresAt }

  const nextTickRef = useRef(null)
  const undoTimerRef = useRef(null)
  const formCardRef = useRef(null)

  useEffect(() => saveJson(STORAGE_KEY, items), [items])
  useEffect(() => saveJson(SETTINGS_KEY, settings), [settings])

  // Check if student needs to complete onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const userId = localStorage.getItem('lmsUserId')
        const role = String(localStorage.getItem('lmsUserRole') || '').toLowerCase()
        
        if (role !== 'student' || !userId) return

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'x-user-id': userId },
        })

        if (res.ok) {
          const data = await res.json()
          const user = data?.data
          if (user?.isFirstTime !== false) {
            navigate('/student/onboarding', { replace: true })
          }
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err)
      }
    }

    checkOnboarding()
  }, [navigate])

  const normalizedItems = useMemo(() => {
    const parsed = Array.isArray(items) ? items : []
    return parsed
      .map((it) => {
        const when = new Date(it?.datetimeISO || '')
        return {
          id: it?.id,
          title: String(it?.title || '').trim(),
          category: String(it?.category || 'study'),
          details: String(it?.details || ''),
          datetimeISO: it?.datetimeISO,
          when,
        }
      })
      .filter((it) => it.id && it.title && !Number.isNaN(it.when.getTime()))
      .sort((a, b) => a.when.getTime() - b.when.getTime())
  }, [items])

  const upcoming = useMemo(() => {
    const t = Date.now()
    return normalizedItems.filter((it) => it.when.getTime() >= t).slice(0, 8)
  }, [normalizedItems])

  const overdue = useMemo(() => {
    const t = Date.now()
    return normalizedItems.filter((it) => it.when.getTime() < t).slice(0, 6)
  }, [normalizedItems])

  const todayItems = useMemo(() => {
    const today = startOfDay(new Date())
    return normalizedItems.filter((it) => sameDay(it.when, today))
  }, [normalizedItems])

  const selectedDayItems = useMemo(() => {
    return normalizedItems.filter((it) => sameDay(it.when, selectedDay))
  }, [normalizedItems, selectedDay])

  const daysWithItemsKey = useMemo(() => {
    const map = new Map()
    for (const it of normalizedItems) {
      const key = `${it.when.getFullYear()}-${it.when.getMonth()}-${it.when.getDate()}`
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [normalizedItems])

  const calendarCells = useMemo(() => {
    const first = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1)
    const last = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0)
    const startWeekday = (first.getDay() + 6) % 7 // Monday=0
    const totalDays = last.getDate()

    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) {
      cells.push(new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [activeMonth])

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setMessage('Notifications are not supported in this browser.')
      return
    }
    const result = await Notification.requestPermission()
    if (result !== 'granted') {
      setSettings((s) => ({ ...s, notificationsEnabled: false }))
      setMessage('Notifications permission denied.')
      return
    }
    setSettings((s) => ({ ...s, notificationsEnabled: true }))
    setMessage('Notifications enabled.')
  }

  // In-app reminder tick (works while page is open).
  useEffect(() => {
    if (nextTickRef.current) clearInterval(nextTickRef.current)

    nextTickRef.current = setInterval(() => {
      const t = Date.now()
      const soon = normalizedItems.filter((it) => {
        const diff = it.when.getTime() - t
        return diff >= 0 && diff <= 60 * 1000
      })

      if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        if (soon.length > 0) {
        for (const it of soon) {
          new Notification(it.title, { body: `${formatDateLabel(it.when)} • ${formatTimeLabel(it.when)}` })
        }
        }

        if (settings.dailyStudyEnabled && settings.dailyStudyTime) {
          const nowLocal = new Date()
          const todayKey = `${nowLocal.getFullYear()}-${nowLocal.getMonth()}-${nowLocal.getDate()}`
          const [hh, mm] = String(settings.dailyStudyTime).split(':')
          const target = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), Number(hh), Number(mm), 0)
          const diff = target.getTime() - nowLocal.getTime()
          const already = settings.lastDailyStudyNotified === todayKey
          if (!already && diff >= 0 && diff <= 60 * 1000) {
            new Notification('Daily study reminder', { body: 'Take 20 minutes to learn something new today.' })
            setSettings((s) => ({ ...s, lastDailyStudyNotified: todayKey }))
          }
        }
      }
    }, 15 * 1000)

    return () => {
      if (nextTickRef.current) clearInterval(nextTickRef.current)
    }
  }, [normalizedItems, settings.notificationsEnabled])

  const addReminder = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setMessage('Please enter a reminder title.')
      return
    }

    const iso = new Date(`${dateValue}T${timeValue}:00`).toISOString()
    const when = new Date(iso)
    if (Number.isNaN(when.getTime())) {
      setMessage('Please select a valid date and time.')
      return
    }

    if (editingId) {
      setItems((prev) =>
        (Array.isArray(prev) ? prev : []).map((x) =>
          x?.id === editingId
            ? {
                ...x,
                title: trimmed,
                category,
                details: details.trim(),
                datetimeISO: iso,
                updatedAt: new Date().toISOString(),
              }
            : x,
        ),
      )
      setMessage('Reminder updated.')
      setEditingId(null)
    } else {
      const newItem = {
        id: `rem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: trimmed,
        category,
        details: details.trim(),
        datetimeISO: iso,
        createdAt: new Date().toISOString(),
      }
      setItems((prev) => [newItem, ...(Array.isArray(prev) ? prev : [])])
      setMessage('Reminder added.')
    }
    setTitle('')
    setDetails('')
    setSelectedDay(startOfDay(when))
    setActiveMonth(new Date(when.getFullYear(), when.getMonth(), 1))
  }

  const startEdit = (reminder) => {
    const when = reminder?.when
    if (!when || Number.isNaN(when.getTime())) return

    const dateStr = `${when.getFullYear()}-${pad2(when.getMonth() + 1)}-${pad2(when.getDate())}`
    const timeStr = `${pad2(when.getHours())}:${pad2(when.getMinutes())}`

    setEditingId(reminder.id)
    setTitle(reminder.title || '')
    setCategory(reminder.category || 'study')
    setDateValue(dateStr)
    setTimeValue(timeStr)
    setDetails(reminder.details || '')
    setMessage('')

    setSelectedDay(startOfDay(when))
    setActiveMonth(new Date(when.getFullYear(), when.getMonth(), 1))

    window.requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setDetails('')
    setMessage('')
  }

  const deleteReminder = (id) => {
    const found = normalizedItems.find((x) => x.id === id)
    if (!found) return

    setItems((prev) => (Array.isArray(prev) ? prev.filter((x) => x?.id !== id) : []))

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    const expiresAt = Date.now() + 5000
    setUndoState({ item: found, expiresAt })
    undoTimerRef.current = setTimeout(() => setUndoState(null), 5000)
  }

  const undoDelete = () => {
    if (!undoState?.item) return
    setItems((prev) => [undoState.item, ...(Array.isArray(prev) ? prev : [])])
    setUndoState(null)
  }

  const moveMonth = (delta) => {
    setActiveMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  const jumpToToday = () => {
    const d = new Date()
    setSelectedDay(startOfDay(d))
    setActiveMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  const badgeClass = (cat) => {
    const v = String(cat || '').toLowerCase()
    if (v === 'exam') return `${styles.badge} ${styles.badgeExam}`
    if (v === 'assignment') return `${styles.badge} ${styles.badgeAssignment}`
    if (v === 'deadline') return `${styles.badge} ${styles.badgeDeadline}`
    return `${styles.badge} ${styles.badgeStudy}`
  }

  /*
  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Student Dashboard</p>
          <h1 className={styles.title}>Reminders & Calendar</h1>
          <p className={styles.subtitle}>
            Plan assignments, exams, and study sessions in one place. You’ll see upcoming reminders and a calendar view of your schedule.
          </p>
        </header>

        <div className={styles.grid}>
          <div className={styles.leftStack}>
            <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>Calendar</h2>
              <div className={styles.monthControls}>
                <button type="button" className={styles.ghostBtn} onClick={jumpToToday}>
                  Today
                </button>
                <button type="button" className={styles.ghostBtn} onClick={() => moveMonth(-1)} aria-label="Previous month">
                  ←
                </button>
                <p className={styles.monthTitle}>{monthTitle(activeMonth)}</p>
                <button type="button" className={styles.ghostBtn} onClick={() => moveMonth(1)} aria-label="Next month">
                  →
                </button>
              </div>
            </div>

            <div className={styles.weekdays}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d} className={styles.weekday}>
                  {d}
                </span>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {calendarCells.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className={styles.dayCellEmpty} />
                const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`
                const count = daysWithItemsKey.get(key) || 0
                const isSelected = sameDay(cell, selectedDay)
                const isToday = sameDay(cell, new Date())
                return (
                  <button
                    key={cell.toISOString()}
                    type="button"
                    className={`${styles.dayCell} ${isSelected ? styles.dayCellSelected : ''} ${isToday ? styles.dayCellToday : ''}`}
                    onClick={() => setSelectedDay(startOfDay(cell))}
                  >
                    <span className={styles.dayNumber}>{cell.getDate()}</span>
                    {count > 0 ? <span className={styles.dayDot} aria-label={`${count} reminders`} /> : null}
                  </button>
                )
              })}
            </div>

            <div className={styles.selectedSummary}>
              <p className={styles.selectedLabel}>Selected day</p>
              <p className={styles.selectedValue}>{formatDateLabel(selectedDay)}</p>
              {selectedDayItems.length > 0 ? (
                <div className={styles.selectedList}>
                  {selectedDayItems.slice(0, 4).map((it) => (
                    <button key={it.id} type="button" className={styles.selectedItem} onClick={() => startEdit(it)}>
                      <span className={badgeClass(it.category)}>{it.category}</span>
                      <span className={styles.selectedText}>
                        <span className={styles.selectedItemTitle}>{it.title}</span>
                        <span className={styles.selectedItemMeta}>{formatTimeLabel(it.when)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>No reminders for this day.</p>
              )}
            </div>
          </section>

            <section className={styles.card}>
              <div className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>Agenda</h2>
                <div className={styles.chips}>
                  <span className={styles.chip}>{todayItems.length} today</span>
                  <span className={styles.chip}>{overdue.length} overdue</span>
                  <span className={styles.chip}>{upcoming.length} next</span>
                </div>
              </div>

              <div className={styles.agendaGrid}>
                <div className={styles.agendaCol}>
                  <div className={styles.agendaHeaderRow}>
                    <p className={styles.agendaTitle}>Today</p>
                    <span className={styles.agendaCount}>{todayItems.length}</span>
                  </div>
                  {todayItems.length === 0 ? (
                    <p className={styles.muted}>Nothing scheduled for today.</p>
                  ) : (
                    <div className={styles.upcomingList}>
                      {todayItems.slice(0, 6).map((it) => (
                        <button key={it.id} type="button" className={styles.rowBtn} onClick={() => startEdit(it)}>
                          <span className={badgeClass(it.category)}>{it.category}</span>
                          <span className={styles.rowBtnText}>
                            <span className={styles.rowBtnTitle}>{it.title}</span>
                            <span className={styles.rowBtnMeta}>{formatTimeLabel(it.when)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.agendaCol}>
                  <div className={styles.agendaHeaderRow}>
                    <p className={styles.agendaTitle}>Overdue</p>
                    <span className={styles.agendaCount}>{overdue.length}</span>
                  </div>
                  {overdue.length === 0 ? (
                    <p className={styles.muted}>No overdue reminders.</p>
                  ) : (
                    <div className={styles.upcomingList}>
                      {overdue.slice(0, 6).map((it) => (
                        <div key={it.id} className={styles.upcomingItem}>
                          <button type="button" className={styles.upcomingLeftBtn} onClick={() => startEdit(it)}>
                            <span className={badgeClass(it.category)}>{it.category}</span>
                            <div className={styles.upcomingText}>
                              <p className={styles.upcomingTitle}>{it.title}</p>
                              <p className={styles.upcomingMeta}>
                                {formatDateLabel(it.when)} • {formatTimeLabel(it.when)}
                              </p>
                            </div>
                          </button>
                          <button type="button" className={styles.iconBtn} onClick={() => deleteReminder(it.id)} aria-label="Delete reminder" title="Delete">
                            🗑
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.agendaFooter}>
                <div className={styles.agendaHeaderRow}>
                  <p className={styles.agendaTitle}>Upcoming</p>
                  <span className={styles.agendaCount}>{upcoming.length}</span>
                </div>
                {upcoming.length === 0 ? (
                  <p className={styles.muted}>No upcoming reminders yet.</p>
                ) : (
                  <div className={styles.upcomingList}>
                    {upcoming.slice(0, 8).map((it) => (
                      <div key={it.id} className={styles.upcomingItem}>
                        <button type="button" className={styles.upcomingLeftBtn} onClick={() => startEdit(it)}>
                          <span className={badgeClass(it.category)}>{it.category}</span>
                          <div className={styles.upcomingText}>
                            <p className={styles.upcomingTitle}>{it.title}</p>
                            <p className={styles.upcomingMeta}>
                              {formatDateLabel(it.when)} • {formatTimeLabel(it.when)}
                            </p>
                          </div>
                        </button>
                        <button type="button" className={styles.iconBtn} onClick={() => deleteReminder(it.id)} aria-label="Delete reminder" title="Delete">
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className={styles.stack}>
            <section ref={formCardRef} className={styles.card}>
              <div className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>{editingId ? 'Edit reminder' : 'Add reminder'}</h2>
                {editingId ? (
                  <button type="button" className={styles.ghostBtn} onClick={cancelEdit}>
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <div className={styles.form}>
                <label className={styles.label}>
                  Title
                  <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment submission, exam, study session…" />
                </label>

                <div className={styles.formGrid}>
                  <label className={styles.label}>
                    Date
                    <input className={styles.input} type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
                  </label>
                  <label className={styles.label}>
                    Time
                    <input className={styles.input} type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
                  </label>
                </div>

                <label className={styles.label}>
                  Category
                  <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="study">Study</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Notes (optional)
                  <textarea className={styles.textarea} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add extra details…" rows={3} />
                </label>

                <div className={styles.actions}>
                  <button type="button" className={styles.primaryBtn} onClick={addReminder}>
                    {editingId ? 'Update reminder' : 'Add reminder'}
                  </button>
                </div>

                {message ? <p className={styles.message}>{message}</p> : null}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>Daily study reminder</h2>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={settings.notificationsEnabled ? () => setSettings((s) => ({ ...s, notificationsEnabled: false })) : requestNotifications}
                >
                  {settings.notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                </button>
              </div>

              <div className={styles.dailyRow}>
                <label className={styles.switchRow}>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.dailyStudyEnabled)}
                    onChange={(e) => setSettings((s) => ({ ...s, dailyStudyEnabled: e.target.checked }))}
                  />
                  <span className={styles.switchText}>Remind me to study daily</span>
                </label>

                <label className={styles.labelInline}>
                  Time
                  <input
                    className={styles.input}
                    type="time"
                    value={settings.dailyStudyTime}
                    onChange={(e) => setSettings((s) => ({ ...s, dailyStudyTime: e.target.value }))}
                    disabled={!settings.dailyStudyEnabled}
                  />
                </label>
              </div>

              <p className={styles.muted}>
                This sends notifications while you have the LMS open. (Browser notifications require permission.)
              </p>
            </section>
          </aside>
        </div>
      </div>

      {undoState?.item ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <span className={styles.toastText}>Reminder deleted.</span>
          <button type="button" className={styles.toastBtn} onClick={undoDelete}>
            Undo
          </button>
        </div>
      ) : null}
    </section>
  )
  */
}

export default StudentHome

