import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { studentQuizApi } from '../../services/studentQuizApi'
import { tryEnterQuizFullscreenFromUserGesture } from '../../utils/quizFullscreen'
import './studentQuiz.css'

function rowStatus(row) {
  if (row.skipped) return 'skipped'
  if (row.isCorrect) return 'correct'
  return 'incorrect'
}

/** e.g. 0 pt, 1 pt, 1.5 pts — earned only, no "/ max" */
function earnedPointsLabel(earned) {
  const n = Number(earned)
  const safe = Number.isFinite(n) ? n : 0
  if (safe === 0) return '0 pt'
  if (safe === 1) return '1 pt'
  return `${safe} pts`
}

const STATUS_META = {
  correct: { label: 'Correct', icon: '\u2705', className: 'sqReviewStatus--correct' },
  incorrect: { label: 'Incorrect', icon: '\u274C', className: 'sqReviewStatus--incorrect' },
  skipped: { label: 'Skipped', icon: '\u23ED', className: 'sqReviewStatus--skipped' },
}

function buildPerformanceInsight({
  correct, wrong, skipped, total, scoreEarned, maxPoints,
}) {
  const lines = []
  lines.push(
    `You answered ${correct} of ${total} questions correctly and earned ${scoreEarned} of ${maxPoints} points.`,
  )
  if (total === 0) return lines.join(' ')
  if (skipped > 0 && skipped >= Math.ceil(total * 0.4) && wrong === 0) {
    lines.push(
      'Several questions were left blank — next time, try answering every item or flag harder ones for review so your score reflects what you know.',
    )
  } else if (skipped > 0 && wrong === 0 && correct < total) {
    lines.push(
      'You didn’t miss any questions you answered — completing more items on the next attempt can raise your score.',
    )
  } else if (wrong > 0) {
    lines.push(
      'Use the review below to spot gaps; filtering by “Incorrect” keeps the list focused before you retry.',
    )
  } else if (correct === total && skipped === 0) {
    lines.push('Strong work on this attempt — keep building on this with the next quiz or lesson.')
  } else if (correct === total && skipped > 0) {
    lines.push('Every question you answered was correct — filling in the rest could earn full points next time.')
  }
  return lines.join(' ')
}

export default function StudentQuizResults() {
  const { quizId, attemptId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [retryErr, setRetryErr] = useState('')
  const [retryBusy, setRetryBusy] = useState(false)
  const retryInFlightRef = useRef(false)
  const [filter, setFilter] = useState('all')

  const startFreshAttempt = useCallback(async () => {
    if (retryInFlightRef.current) return
    tryEnterQuizFullscreenFromUserGesture()
    retryInFlightRef.current = true
    setRetryBusy(true)
    setRetryErr('')
    try {
      try {
        await studentQuizApi.abandonInProgress(quizId)
      } catch {
        /* no stray in-progress attempt */
      }
      const res = await studentQuizApi.startOrResumeAttempt(quizId)
      const nextAttemptId = res?.attempt?.id
      if (!nextAttemptId) throw new Error('Failed to start attempt')
      navigate(`/student/quizzes/${quizId}/attempt/${nextAttemptId}`)
    } catch (e) {
      setRetryErr(e.message || 'Could not start quiz')
    } finally {
      retryInFlightRef.current = false
      setRetryBusy(false)
    }
  }, [quizId, navigate])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr('')
      try {
        const r = await studentQuizApi.getResults(attemptId)
        if (!cancelled) setData(r)
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load results')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [attemptId])

  const breakdown = data?.breakdown ?? []

  const counts = useMemo(() => {
    let c = 0
    let w = 0
    let s = 0
    for (const row of breakdown) {
      if (row.skipped) s += 1
      else if (row.isCorrect) c += 1
      else w += 1
    }
    return { correct: c, wrong: w, skipped: s, all: breakdown.length }
  }, [breakdown])

  const filteredRows = useMemo(() => {
    if (filter === 'all') return breakdown
    return breakdown.filter((row) => {
      const st = rowStatus(row)
      if (filter === 'correct') return st === 'correct'
      if (filter === 'incorrect') return st === 'incorrect'
      if (filter === 'skipped') return st === 'skipped'
      return true
    })
  }, [breakdown, filter])

  if (err && !data) {
    return (
      <div className="sqPage sqResultsPage sqResultsPage--full">
        <Link className="sqResultsBack" to="/student/quizzes">
          <span aria-hidden>←</span> All quizzes
        </Link>
        <p className="sqResultsErr">{err}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="sqPage sqResultsPage sqResultsPage--full">
        <p className="sqResultsLoading">Loading…</p>
      </div>
    )
  }

  const { correct, wrong, skipped } = counts
  const total = breakdown.length
  const ts = data.timeSpentSeconds
  const timeStr =
    ts != null
      ? `${Math.floor(ts / 60)}:${String(ts % 60).padStart(2, '0')}`
      : '—'

  const insight = buildPerformanceInsight({
    correct,
    wrong,
    skipped,
    total,
    scoreEarned: data.scoreEarned,
    maxPoints: data.maxPoints,
  })

  const passed = data.percent >= 70

  return (
    <div className="sqPage sqResultsPage sqResultsPage--full">
      <div className="sqResultsTop">
        <Link className="sqResultsBack" to="/student/quizzes">
          <span aria-hidden>←</span> All quizzes
        </Link>
      </div>

      <header className="sqResultsHero">
        <div className="sqResultsHeroInner">
          <div className="sqResultsHeroMain">
            <p className="sqResultsKicker"></p>
            <h1 className="sqResultsTitle">{data.quizTitle}</h1>
            <div className="sqResultsScoreBlock">
              <span className="sqResultsScoreNum">{data.percent}</span>
              <span className="sqResultsScorePct">%</span>
            </div>
            <p className="sqResultsPointsLine">
              <strong>
                {data.scoreEarned} / {data.maxPoints}
              </strong>
              <span className="sqResultsPointsSep">points earned</span>
            </p>
            <p className="sqResultsCoach">{insight}</p>
            {retryErr ? <p className="sqResultsRetryErr">{retryErr}</p> : null}
            <div className="sqResultsCtaRow">
              <button
                type="button"
                className="sqResultsPrimaryBtn"
                disabled={retryBusy}
                onClick={startFreshAttempt}
              >
                {retryBusy ? 'Opening…' : passed ? 'Next attempt' : 'Try again'}
              </button>
              <Link className="sqResultsSecondaryBtn" to="/student/quizzes">
                All quizzes
              </Link>
            </div>
          </div>

          <aside className="sqResultsHeroAside" aria-label="Attempt summary">
            <p className="sqResultsAsideLabel">This attempt</p>
            <div className="sqResultsStatChips sqResultsStatChips--aside">
              <div className="sqResultsChip sqResultsChip--ok sqResultsChip--hero">
                <span className="sqResultsChipLabel">Correct</span>
                <span className="sqResultsChipVal">{correct}</span>
              </div>
              <div className="sqResultsChip sqResultsChip--bad sqResultsChip--heroSecondary">
                <span className="sqResultsChipLabel">Incorrect</span>
                <span className="sqResultsChipVal">{wrong}</span>
              </div>
              <div className="sqResultsChip sqResultsChip--time sqResultsChip--heroTertiary">
                <span className="sqResultsChipLabel">Time</span>
                <span className="sqResultsChipVal sqResultsChipVal--mono">{timeStr}</span>
              </div>
              <div className="sqResultsChip sqResultsChip--skippedMuted">
                <span className="sqResultsChipLabel">Skipped</span>
                <span className="sqResultsChipVal">{skipped}</span>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <section className="sqResultsReview" aria-labelledby="sq-results-review-heading">
        <div className="sqResultsReviewToolbar">
          <div className="sqResultsReviewHead">
            <h2 id="sq-results-review-heading" className="sqResultsReviewTitle">
              Review by question
            </h2>
            <p className="sqResultsReviewHint">
              <strong>All</strong> shows your answer and the correct answer side by side. Other filters show your answers
              only.
            </p>
          </div>

          <div className="sqReviewFilters" role="tablist" aria-label="Filter questions">
          {(
            [
              ['all', 'All'],
              ['incorrect', 'Incorrect'],
              ['skipped', 'Skipped'],
              ['correct', 'Correct'],
            ]
          ).map(([key, label]) => {
            const n =
              key === 'all'
                ? counts.all
                : counts[key === 'incorrect' ? 'wrong' : key]
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={`sqReviewFilterBtn${filter === key ? ' is-active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="sqReviewFilterCount">{n}</span>
              </button>
            )
          })}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <p className="sqReviewEmpty">No questions in this filter.</p>
        ) : (
          <ul className="sqReviewCardList">
            {filteredRows.map((row) => {
              const st = rowStatus(row)
              const meta = STATUS_META[st]
              const yourAns = row.skipped ? 'Skipped' : row.studentAnswerLabel
              return (
                <li key={row.index}>
                  <article className={`sqReviewCard sqReviewCard--${st}`}>
                    <div className="sqReviewCardTop">
                      <div className="sqReviewCardMeta">
                        <span className="sqReviewCardNum">Q{row.index + 1}</span>
                        <span className={`sqReviewStatus ${meta.className}`}>
                          <span className="sqReviewStatusIcon" aria-hidden>
                            {meta.icon}
                          </span>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    <div className="sqReviewCardMain">
                      <div className="sqReviewCardLeft">
                        <p className="sqReviewCardPrompt">{row.prompt || '—'}</p>
                        <p className="sqReviewCardPoints">
                          {row.skipped ? (
                            <span className="sqReviewMuted">No points (skipped)</span>
                          ) : (
                            <strong>{earnedPointsLabel(row.earned)}</strong>
                          )}
                        </p>
                      </div>
                      <div className="sqReviewCardAnswers">
                        {filter === 'all' ? (
                          <div className="sqReviewCardCompare">
                            <div
                              className={`sqReviewDetailBlock sqReviewDetailBlock--yours sqReviewDetailBlock--status-${st}`}
                            >
                              <h3 className="sqReviewDetailHeading">Your answer</h3>
                              <p className="sqReviewDetailBody">
                                {typeof yourAns === 'string' && yourAns !== '' ? yourAns : '—'}
                              </p>
                            </div>
                            <div className="sqReviewDetailBlock sqReviewDetailBlock--key">
                              <h3 className="sqReviewDetailHeading">Correct answer</h3>
                              <p className="sqReviewDetailBody">{row.correctAnswerLabel || '—'}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="sqReviewCardSingle">
                            <div
                              className={`sqReviewDetailBlock sqReviewDetailBlock--yours sqReviewDetailBlock--status-${st}`}
                            >
                              <h3 className="sqReviewDetailHeading">Your answer</h3>
                              <p className="sqReviewDetailBody">
                                {typeof yourAns === 'string' && yourAns !== '' ? yourAns : '—'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
