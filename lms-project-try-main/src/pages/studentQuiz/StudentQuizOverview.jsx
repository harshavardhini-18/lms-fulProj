import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { studentQuizApi } from '../../services/studentQuizApi'
import { tryEnterQuizFullscreenFromUserGesture } from '../../utils/quizFullscreen'
import './studentQuiz.css'

function formatQuizTitle(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return 'Quiz'
  return s
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
}

function formatAttemptWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function truncate(s, n) {
  const t = String(s ?? '').trim()
  if (t.length <= n) return t
  return `${t.slice(0, n - 1)}…`
}

function deriveQuizState(data, bestPct, lastPct) {
  if (data.inProgressAttemptId) return 'in_progress'
  if (data.submittedCount === 0) return 'not_started'
  if (bestPct != null && bestPct >= 90) return 'mastered'
  if (lastPct != null && lastPct < 60 && data.submittedCount >= 1) return 'retry_recommended'
  return 'completed'
}

const STATE_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  retry_recommended: 'Retry recommended',
  mastered: 'Strong score',
}

function ProgressRing({ pct, label, compact }) {
  const p = Math.max(0, Math.min(100, pct ?? 0))
  const r = compact ? 32 : 38
  const size = compact ? 92 : 108
  const stroke = compact ? 8 : 9
  const c = 2 * Math.PI * r
  const off = c - (p / 100) * c
  const cx = size / 2
  return (
    <div className={`sqOvRingWrap${compact ? ' sqOvRingWrap--compact' : ''}`}>
      <svg className="sqOvRingSvg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="sqOvRingTrack" cx={cx} cy={cx} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="sqOvRingArc"
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <div className="sqOvRingCenter">
        <span className="sqOvRingPct">{p}%</span>
        {label ? <span className="sqOvRingLbl">{label}</span> : null}
      </div>
    </div>
  )
}

function buildLearningOutcomes(categoryName, title) {
  const cat = categoryName ? formatQuizTitle(categoryName) : null
  const name = formatQuizTitle(title)
  if (cat) {
    return [
      `${cat}: concepts and patterns you’ll apply in the questions.`,
      `See where you stand on this topic—not during the attempt, but right after you submit.`,
      `Pause anytime; your work is restored when you return.`,
    ]
  }
  return [
    `${name}: focused checks on what matters for this quiz.`,
    `Feedback and scores unlock after submit so the attempt stays exam-realistic.`,
    `Draft answers save automatically until you’re done.`,
  ]
}

export default function StudentQuizOverview() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    const o = await studentQuizApi.getOverview(quizId)
    setData(o)
  }, [quizId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await load()
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  async function handleStartOrResume() {
    tryEnterQuizFullscreenFromUserGesture()
    setBusy(true)
    setErr('')
    try {
      const res = await studentQuizApi.startOrResumeAttempt(quizId)
      const aid = res.attempt?.id
      if (!aid) throw new Error('No attempt id')
      navigate(`/student/quizzes/${quizId}/attempt/${aid}`)
    } catch (e) {
      setErr(e.message || 'Could not start')
    } finally {
      setBusy(false)
    }
  }

  async function handleAbandon() {
    if (
      !window.confirm(
        'Discard this in-progress attempt and start fresh? Answers that are not submitted will be lost.',
      )
    )
      return
    setBusy(true)
    setErr('')
    try {
      await studentQuizApi.abandonInProgress(quizId)
      await load()
    } catch (e) {
      setErr(e.message || 'Could not reset attempt')
    } finally {
      setBusy(false)
    }
  }

  if (err && !data) {
    return (
      <div className="sqPage sqOverviewPage sqOvPage">
        <Link className="sqResultsBack sqOvBack" to="/student/quizzes">
          <span aria-hidden>←</span> All quizzes
        </Link>
        <p className="sqOverviewErr">{err}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="sqPage sqOverviewPage sqOvPage">
        <p className="sqOverviewLoading">Loading…</p>
      </div>
    )
  }

  const lastPct =
    data.lastMaxPoints > 0 && data.lastScoreEarned != null
      ? Math.round((data.lastScoreEarned / data.lastMaxPoints) * 100)
      : null
  const bestPct =
    data.totalPoints > 0 && data.bestScoreEarned != null
      ? Math.round((data.bestScoreEarned / data.totalPoints) * 100)
      : null

  const quizState = deriveQuizState(data, bestPct, lastPct)
  const attemptHistory = Array.isArray(data.attemptHistory) ? data.attemptHistory : []

  const improvementDelta =
    attemptHistory.length >= 2 &&
    attemptHistory[0]?.percent != null &&
    attemptHistory[1]?.percent != null
      ? attemptHistory[0].percent - attemptHistory[1].percent
      : null

  const estMinutes = Math.max(2, Math.round((Number(data.questionCount) || 0) * 1.5))

  const emotionalLead = data.description?.trim()
    ? truncate(data.description.trim(), 220)
    : data.categoryName
      ? `Check your grasp of ${formatQuizTitle(data.categoryName)} with focused questions—then review what stuck.`
      : `Work through ${formatQuizTitle(data.title)} at your own pace; results unlock when you submit.`

  const metaChips = []
  if (data.categoryName) metaChips.push(formatQuizTitle(data.categoryName))
  metaChips.push(`${data.questionCount} question${data.questionCount === 1 ? '' : 's'}`)
  metaChips.push(`~${estMinutes} min`)

  const skillTags = [
    data.categoryName ? formatQuizTitle(data.categoryName) : null,
    `${data.questionCount} item${data.questionCount === 1 ? '' : 's'}`,
    'Mixed question types',
  ].filter(Boolean)

  const learningOutcomes = buildLearningOutcomes(data.categoryName, data.title)

  const resumeLine =
    data.inProgressAttemptId && data.questionCount > 0
      ? `You’re on question ${Math.min((data.inProgressCurrentIndex ?? 0) + 1, data.questionCount)} of ${data.questionCount}.`
      : null

  const primaryCtaLabel = data.inProgressAttemptId
    ? 'Continue quiz'
    : data.submittedCount > 0
      ? 'Try again'
      : 'Start quiz'

  const primaryHint = data.inProgressAttemptId
    ? 'Answers stay saved until you submit.'
    : data.submittedCount > 0
      ? 'Each try opens in the quiz player.'
      : 'Untimed—you can pause and return.'

  return (
    <div className="sqPage sqOverviewPage sqOvPage">
      <div className="sqOvTop">
        <Link className="sqResultsBack sqOvBack" to="/student/quizzes">
          <span aria-hidden>←</span> All quizzes
        </Link>
      </div>

      <header className="sqOvHero">
        <div className="sqOvHeroMain">
          <div className="sqOvHeroTop">
            <span className={`sqOvState sqOvState--${quizState}`}>{STATE_LABELS[quizState]}</span>
          </div>
          <h1 className="sqOvTitle">{formatQuizTitle(data.title)}</h1>
          <p className="sqOvSubtitle">{emotionalLead}</p>

          {data.submittedCount > 0 && (bestPct != null || lastPct != null) ? (
            <div className="sqOvHeroPerf" aria-label="Your scores on this quiz">
              {bestPct != null ? (
                <div className="sqOvHeroPerfItem">
                  <span className="sqOvHeroPerfLab">Best score</span>
                  <span className="sqOvHeroPerfVal">{bestPct}%</span>
                </div>
              ) : null}
              {lastPct != null ? (
                <div className="sqOvHeroPerfItem">
                  <span className="sqOvHeroPerfLab">Last attempt</span>
                  <span className="sqOvHeroPerfVal sqOvHeroPerfVal--secondary">{lastPct}%</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="sqOvMetaRow" aria-label="Quiz metadata">
            {metaChips.map((c) => (
              <span key={c} className="sqOvMetaChip">
                {c}
              </span>
            ))}
            <span className="sqOvMetaChip sqOvMetaChip--quiet">Untimed</span>
            <span className="sqOvMetaChip sqOvMetaChip--quiet">Attempts open</span>
          </div>

          {skillTags.length ? (
            <div className="sqOvHeroSkills">
              <span className="sqOvHeroSkillsLab">Skills you&apos;ll practice</span>
              <div className="sqOvHeroSkillTags">
                {skillTags.map((t) => (
                  <span key={t} className="sqOvHeroSkillTag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="sqOvHeroActions">
            <div className="sqOvPrimaryBlock">
              <button
                type="button"
                className="sqBtn sqBtnPrimary sqBtnPrimary--overview"
                disabled={busy || data.questionCount === 0}
                onClick={handleStartOrResume}
              >
                {busy ? 'Opening…' : primaryCtaLabel}
              </button>
              <p className="sqOvCtaHint">{primaryHint}</p>
            </div>
            <div className="sqOvSecondaryActions">
              {data.inProgressAttemptId ? (
                <button type="button" className="sqOvBtnGhost" disabled={busy} onClick={handleAbandon}>
                  Start over
                </button>
              ) : null}
              {data.lastSubmittedAttemptId ? (
                <Link className="sqOvBtnGhost" to={`/student/quizzes/${quizId}/results/${data.lastSubmittedAttemptId}`}>
                  Review last results
                </Link>
              ) : null}
              <Link className="sqOvBtnGhost" to="/student/quizzes">
                More quizzes
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="sqOvBody">
        <div className="sqOvMain">
          <article className="sqOvPanel" aria-label="Quiz details">
            <section className="sqOvPanelSection">
              <h2 className="sqOvPanelHeading">What this quiz checks</h2>
              <ul className="sqOvOutcomes sqOvOutcomes--tight">
                {learningOutcomes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>

            <section className="sqOvPanelSection">
              <h2 className="sqOvPanelHeading">At a glance</h2>
              <p className="sqOvGlance">
                <span className="sqOvGlanceItem">
                  {data.questionCount} questions
                </span>
                <span className="sqOvGlanceSep">·</span>
                <span className="sqOvGlanceItem">{data.totalPoints} points</span>
                <span className="sqOvGlanceSep">·</span>
                <span className="sqOvGlanceItem">No time limit</span>
                <span className="sqOvGlanceSep">·</span>
                <span className="sqOvGlanceItem">Progress saves until submit</span>
                <span className="sqOvGlanceSep">·</span>
                <span className="sqOvGlanceItem">Feedback after submission</span>
              </p>
            </section>

            <section className="sqOvPanelSection">
              <h2 className="sqOvPanelHeading">Before you start</h2>
              <ul className="sqOvRulesBrief">
                <li>Correct answers stay hidden until you submit the attempt.</li>
                <li>You can leave and come back—your draft is restored.</li>
                <li>Use the navigator to jump or flag questions for review.</li>
              </ul>
              {quizState === 'retry_recommended' ? (
                <p className="sqOvInlineNote">
                  Last run looked tough—open your results, skim what missed, then try another full pass.
                </p>
              ) : null}
            </section>
          </article>

          {err ? <p className="sqErr sqErr--compact">{err}</p> : null}
          {data.questionCount === 0 ? (
            <p className="sqErr sqErr--compact">
              This quiz has no questions yet. It cannot be started until your instructor adds at least one.
            </p>
          ) : null}
        </div>

        <aside className="sqOvAside" aria-label="Your progress">
          <div className="sqOvAsideHead">
            <h2 className="sqOvAsideTitle">Your progress</h2>
            <ProgressRing pct={bestPct ?? 0} label="Best score" compact />
          </div>

          {resumeLine ? <p className="sqOvResumeLine">{resumeLine}</p> : null}

          <dl className="sqOvStatStack">
            {data.submittedCount > 0 && bestPct != null ? (
              <div className="sqOvStatRow">
                <dt>Best score</dt>
                <dd className={bestPct <= 0 ? 'sqOvStatVal--muted' : ''}>{bestPct}%</dd>
              </div>
            ) : null}
            {data.submittedCount > 0 && lastPct != null ? (
              <div className="sqOvStatRow">
                <dt>Last attempt</dt>
                <dd className={lastPct <= 0 ? 'sqOvStatVal--muted' : ''}>{lastPct}%</dd>
              </div>
            ) : null}
            <div className="sqOvStatRow">
              <dt>Attempts</dt>
              <dd>{data.submittedCount}</dd>
            </div>
            {lastPct != null && bestPct != null && improvementDelta != null ? (
              <div className="sqOvStatRow sqOvStatRow--trend">
                <dt>vs previous</dt>
                <dd
                  className={
                    improvementDelta >= 0 ? 'sqOvTrendUp' : 'sqOvTrendDown'
                  }
                >
                  {improvementDelta >= 0 ? '↑' : '↓'} {Math.abs(improvementDelta)} pp
                </dd>
              </div>
            ) : null}
          </dl>

          {attemptHistory.length > 0 ? (
            <div className="sqOvHistory">
              <h3 className="sqOvHistoryTitle">Recent attempts</h3>
              <ul className="sqOvHistoryList sqOvHistoryList--plain">
                {attemptHistory.slice(0, 5).map((row, i) => (
                  <li key={row.attemptId || i} className="sqOvHistoryItem">
                    <Link className="sqOvHistoryLink" to={`/student/quizzes/${quizId}/results/${row.attemptId}`}>
                      <span className="sqOvHistoryLabel">
                        {i === 0 ? 'Latest' : formatAttemptWhen(row.submittedAt) || `Prior`}
                      </span>
                      <span className="sqOvHistoryVal">
                        {row.percent != null ? `${row.percent}%` : '—'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="sqOvFootNote">Pass mark, attempt limits, and due dates show up when your instructor sets them.</p>

          <div className="sqOvStickyCta">
            <button
              type="button"
              className="sqBtn sqBtnPrimary sqBtnPrimary--overview"
              disabled={busy || data.questionCount === 0}
              onClick={handleStartOrResume}
            >
              {busy ? 'Opening…' : primaryCtaLabel}
            </button>
            <p className="sqOvCtaHint sqOvCtaHint--sticky">{primaryHint}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
