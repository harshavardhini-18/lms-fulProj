import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentQuizApi } from '../../services/studentQuizApi'
import { tryEnterQuizFullscreenFromUserGesture } from '../../utils/quizFullscreen'
import './studentQuiz.css'

const FALLBACK_COURSE_KEY = 'Practice library'

/** Skip meaningless single-character descriptions from showing in cards */
function displayDescription(raw) {
  const t = String(raw ?? '').trim()
  if (t.length < 2) return null
  return t
}

function isPracticeModuleName(moduleTitle) {
  return String(moduleTitle || '').trim().toLowerCase() === 'practice'
}

function cardKindLabel(moduleTitle) {
  const m = String(moduleTitle || '').trim()
  if (!m) return 'Quiz'
  if (/quiz$/i.test(m)) return m
  return `${m} quiz`
}

function deriveListQuizState(quiz, bestPct, lastPct) {
  if (quiz.inProgressAttemptId) return 'in_progress'
  if (quiz.submittedCount === 0) return 'not_started'
  if (bestPct != null && bestPct >= 90) return 'mastered'
  if (lastPct != null && lastPct < 60 && quiz.submittedCount >= 1) return 'retry_recommended'
  return 'completed'
}

/** List card badge from last attempt % only: 100% → Mastered, under 50% → Needs Retry, else none. */
function listBadgeFromLastAttempt(attempted, lastPct) {
  if (!attempted || lastPct == null || Number.isNaN(Number(lastPct))) return null
  const p = Number(lastPct)
  if (p >= 100) return { label: 'Mastered', mod: 'mastered' }
  if (p < 50) return { label: 'Needs Retry', mod: 'retry' }
  return null
}

function formatMetaLine(parts) {
  if (!parts.length) return ''
  return parts.join(' \u2022 ')
}

function listQuizCta() {
  return 'Try quiz'
}

export default function StudentQuizList() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [startingQuizId, setStartingQuizId] = useState(null)
  const startInFlightRef = useRef(false)

  const openQuizPlayer = useCallback(
    async (quiz, listState) => {
      if (startInFlightRef.current) return
      tryEnterQuizFullscreenFromUserGesture()
      if (listState === 'in_progress' && quiz.inProgressAttemptId) {
        navigate(`/student/quizzes/${quiz.id}/attempt/${quiz.inProgressAttemptId}`)
        return
      }
      startInFlightRef.current = true
      setStartingQuizId(quiz.id)
      setErr('')
      try {
        const res = await studentQuizApi.startOrResumeAttempt(quiz.id)
        const attemptId = res?.attempt?.id
        if (!attemptId) throw new Error('Failed to start attempt')
        navigate(`/student/quizzes/${quiz.id}/attempt/${attemptId}`)
      } catch (e) {
        setErr(e.message || 'Could not open quiz')
      } finally {
        startInFlightRef.current = false
        setStartingQuizId(null)
      }
    },
    [navigate]
  )

  const grouped = useMemo(() => {
    const out = new Map()
    data.forEach((quiz) => {
      const courseKey = quiz.courseTitle || FALLBACK_COURSE_KEY
      const moduleKey = quiz.moduleTitle || 'Practice'
      if (!out.has(courseKey)) out.set(courseKey, new Map())
      const modules = out.get(courseKey)
      if (!modules.has(moduleKey)) modules.set(moduleKey, [])
      modules.get(moduleKey).push(quiz)
    })
    return out
  }, [data])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      setErr('')
      try {
        const res = await studentQuizApi.list({ q: q.trim() || undefined, page: 1, pageSize: 50 })
        if (!cancelled) setData(res.data)
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, q ? 280 : 0)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q])

  return (
    <div className="sqPage sqListPage">
      <header className="sqListHeader sqListHeader--compact">
        <div className="sqListHeaderMain">
          <h1 className="sqListTitle">Quizzes</h1>
          <p className="sqListLead">Track progress and continue when you&apos;re ready — answers stay hidden until you submit.</p>
        </div>
        <div className="sqListSearchInline">
          <label className="sqVisuallyHidden" htmlFor="sq-quiz-search">
            Search quizzes
          </label>
          <div className="sqSearchField sqSearchField--header">
            <span className="sqSearchFieldIcon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              id="sq-quiz-search"
              className="sqSearch sqSearch--header"
              placeholder="Search by title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      </header>

      {err ? <p className="sqErr">{err}</p> : null}
      {loading ? (
        <div className="sqListLoading" aria-live="polite">
          <span className="sqListLoadingDot" />
          <span className="sqListLoadingDot" />
          <span className="sqListLoadingDot" />
          <span>Loading quizzes…</span>
        </div>
      ) : null}
      {!loading && !data.length ? (
        <div className="sqEmpty">No published quizzes available yet.</div>
      ) : null}
      {[...grouped.entries()].map(([courseTitle, modules]) => {
        const isPracticeShelf = courseTitle === FALLBACK_COURSE_KEY
        return (
          <section key={courseTitle} className="sqSection">
            {!isPracticeShelf ? (() => {
              const flatCount = Array.from(modules.values()).flat().length
              return (
              <div className="sqSectionHeader sqSectionHeader--quiet">
                <div>
                  <h2 className="sqSectionTitle">{courseTitle}</h2>
                  <p className="sqSectionSub">Quizzes linked to this course.</p>
                </div>
                <span className="sqSectionCount">
                  {flatCount} quiz{flatCount === 1 ? '' : 'zes'}
                </span>
              </div>
              )
            })() : null}

            {[...modules.entries()].map(([moduleTitle, quizzes]) => {
              const practiceModule = isPracticeModuleName(moduleTitle)
              return (
                <div key={moduleTitle} className="sqModuleBlock">
                  {!practiceModule ? <h3 className="sqModuleSubtitle">{moduleTitle}</h3> : null}
                  <div className="sqGrid">
                    {quizzes.map((quiz) => {
                      const attempted = quiz.submittedCount > 0
                      const lastPct =
                        quiz.lastMaxPoints > 0 && quiz.lastScoreEarned != null
                          ? Math.round((quiz.lastScoreEarned / quiz.lastMaxPoints) * 100)
                          : null
                      const bestPct =
                        quiz.totalPoints > 0 && quiz.bestScoreEarned != null
                          ? Math.round((quiz.bestScoreEarned / quiz.totalPoints) * 100)
                          : null
                      const barPct =
                        attempted && lastPct != null
                          ? lastPct
                          : attempted && bestPct != null
                            ? bestPct
                            : 0
                      const desc = displayDescription(quiz.description)
                      const qc = Number(quiz.questionCount) || 0
                      const tp = Number(quiz.totalPoints) || 0

                      const metaParts = [
                        `${qc} question${qc === 1 ? '' : 's'}`,
                        `${tp} point${tp === 1 ? '' : 's'}`,
                      ]
                      if (quiz.categoryName) metaParts.unshift(String(quiz.categoryName).trim())

                      const listState = deriveListQuizState(quiz, bestPct, lastPct)
                      const statusBadge = listBadgeFromLastAttempt(attempted, lastPct)
                      const cta = listQuizCta()
                      const isStartingThis = startingQuizId === quiz.id

                      const showModuleHint = !practiceModule && !attempted

                      return (
                        <button
                          type="button"
                          key={quiz.id}
                          className={`sqCard sqCard--workflow${statusBadge ? ' sqCard--hasBadge' : ''}`}
                          disabled={startingQuizId != null}
                          aria-busy={isStartingThis}
                          onClick={() => openQuizPlayer(quiz, listState)}
                          aria-label={`${cta}: ${quiz.title}`}
                        >
                          {statusBadge ? (
                            <span className={`sqCardStatusBadge sqCardStatusBadge--${statusBadge.mod}`}>
                              {statusBadge.label}
                            </span>
                          ) : null}
                          <div className="sqCardBody">
                            {showModuleHint ? (
                              <div className="sqCardModuleRow">
                                <span className="sqCardModuleHint">{cardKindLabel(moduleTitle)}</span>
                              </div>
                            ) : null}

                            <h3 className="sqCardTitle">{quiz.title}</h3>

                            <div className="sqCardDescSlot" aria-hidden={desc ? undefined : true}>
                              {desc ? <p className="sqCardDesc">{desc}</p> : null}
                            </div>

                            <p className="sqCardMetaLine">{formatMetaLine(metaParts)}</p>

                            <div className={`sqCardMid${attempted ? '' : ' sqCardMid--idle'}`}>
                              {attempted ? (
                                <>
                                  <div className="sqCardProgressWrap">
                                    <span className="sqCardProgressLabel" id={`sq-progress-lab-${quiz.id}`}>
                                      Progress
                                    </span>
                                    <div
                                      className="sqCardProgressTrack sqCardProgressTrack--inline"
                                      role="progressbar"
                                      aria-valuemin={0}
                                      aria-valuemax={100}
                                      aria-valuenow={barPct}
                                      aria-labelledby={`sq-progress-lab-${quiz.id}`}
                                      aria-label={
                                        lastPct != null
                                          ? `Last attempt ${lastPct}%`
                                          : bestPct != null
                                            ? `Best score ${bestPct}%`
                                            : 'Quiz progress'
                                      }
                                    >
                                      <div className="sqCardProgressFill sqCardProgressFill--accent" style={{ width: `${barPct}%` }} />
                                    </div>
                                  </div>
                                  <div className="sqCardStatGrid" role="group" aria-label="Attempt summary">
                                    <div className="sqCardStatCell">
                                      <span className="sqCardStatLab">Best score</span>
                                      <span className="sqCardStatVal">{bestPct != null ? `${bestPct}%` : '—'}</span>
                                    </div>
                                    <div className="sqCardStatCell">
                                      <span className="sqCardStatLab">Last attempt</span>
                                      <span className="sqCardStatVal">{lastPct != null ? `${lastPct}%` : '—'}</span>
                                    </div>
                                    <div className="sqCardStatCell">
                                      <span className="sqCardStatLab">Attempts</span>
                                      <span className="sqCardStatVal">{quiz.submittedCount}</span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <p className="sqCardSnapshot sqCardSnapshot--idle">No attempts yet.</p>
                              )}
                            </div>

                            <div className="sqCardCtaRow">
                              <span className="sqCardCtaText">{cta}</span>
                              <span className="sqCardCtaIcon" aria-hidden>
                                →
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
