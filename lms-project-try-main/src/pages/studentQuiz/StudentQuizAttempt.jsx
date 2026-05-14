import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { studentQuizApi } from '../../services/studentQuizApi'
import {
  exitDocumentFullscreen,
  getFullscreenElement,
  isLikelyQuizFullscreenTarget,
  requestElFullscreen,
} from '../../utils/quizFullscreen'
import './studentQuiz.css'

/** Chromium-only: trap Esc so the browser does not exit Element fullscreen first. */
function escapeLockSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.keyboard?.lock === 'function'
}

/** Returns whether Esc was registered with the Keyboard Lock API (in fullscreen). */
async function tryLockEscapeForFullscreen() {
  const kb = typeof navigator !== 'undefined' ? navigator.keyboard : null
  if (!kb?.lock) return false
  try {
    await kb.lock(['Escape'])
    await kb.lock(['Escape'])
    return true
  } catch {
    return false
  }
}

function unlockFullscreenKeyboardCapture() {
  try {
    navigator.keyboard?.unlock?.()
  } catch {
    /* noop */
  }
}

function isAnswered(q, raw) {
  if (raw === undefined || raw === null) return false
  if (q.type === 'fill_blank') return String(raw).trim() !== ''
  if (q.type === 'multi_choice') return Array.isArray(raw) && raw.length > 0
  return true
}

function isPickThenSubmitType(q) {
  return q && (q.type === 'mcq' || q.type === 'true_false' || q.type === 'code_image')
}

function parseAttemptStartedAtMs(att) {
  if (!att || typeof att !== 'object') return null
  const raw = att.startedAt ?? att.started_at
  if (raw == null) return null
  const ms = typeof raw === 'number' ? raw : Date.parse(String(raw))
  return Number.isFinite(ms) ? ms : null
}

function formatElapsedClock(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export default function StudentQuizAttempt() {
  const { quizId, attemptId } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState({})
  const [visited, setVisited] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [attemptReady, setAttemptReady] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [completion, setCompletion] = useState(null)
  const [needManualFullscreen, setNeedManualFullscreen] = useState(false)
  const [attemptStartedAtMs, setAttemptStartedAtMs] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pickFillingId, setPickFillingId] = useState(null)
  const gameShellRef = useRef(null)
  const intentionalFullscreenExitRef = useRef(false)
  const leaveConfirmOpenRef = useRef(false)
  const submitConfirmOpenRef = useRef(false)
  const mountedRef = useRef(true)
  const uid = useId().replace(/:/g, '')
  const fillBlankInputId = `sq-fill-${uid}`

  const saveTimer = useRef(null)
  const pickAdvanceTimerRef = useRef(null)
  const answersRef = useRef(answers)
  const flaggedRef = useRef(flagged)
  const visitedRef = useRef(visited)
  const currentRef = useRef(currentIndex)
  const quizInProgressRef = useRef(false)
  answersRef.current = answers
  flaggedRef.current = flagged
  visitedRef.current = visited
  currentRef.current = currentIndex

  const quizInProgress =
    attemptReady &&
    !!attemptId &&
    questions.length > 0 &&
    !completion
  quizInProgressRef.current = quizInProgress

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    leaveConfirmOpenRef.current = leaveConfirmOpen
  }, [leaveConfirmOpen])

  useEffect(() => {
    submitConfirmOpenRef.current = submitConfirmOpen
  }, [submitConfirmOpen])

  const flushSave = useCallback(async () => {
    if (!attemptId) return
    try {
      await studentQuizApi.patchAttempt(attemptId, {
        answers: answersRef.current,
        flagged: flaggedRef.current,
        currentIndex: currentRef.current,
        visited: visitedRef.current,
      })
    } catch {
      /* offline — next edit may retry */
    }
  }, [attemptId])

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flushSave(), 450)
  }, [flushSave])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  useEffect(
    () => () => {
      if (pickAdvanceTimerRef.current) {
        clearTimeout(pickAdvanceTimerRef.current)
        pickAdvanceTimerRef.current = null
      }
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    setAttemptReady(false)
    setQuestions([])
    setAttempt(null)
    setAttemptStartedAtMs(null)
    setElapsedSeconds(0)
    setPickFillingId(null)
    if (pickAdvanceTimerRef.current) {
      clearTimeout(pickAdvanceTimerRef.current)
      pickAdvanceTimerRef.current = null
    }
    if (!attemptId) { setErr('Missing attempt'); setAttemptReady(true); return undefined }
    ;(async () => {
      setErr('')
      try {
        const res = await studentQuizApi.getAttempt(attemptId)
        if (cancelled) return
        const qs = res.questions || []
        setQuestions(qs)
        const att = res.attempt
        setAttempt(att)
        const startedMs = parseAttemptStartedAtMs(att) ?? Date.now()
        setAttemptStartedAtMs(startedMs)
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedMs) / 1000)))
        setAnswers(typeof att.answers === 'object' && att.answers ? { ...att.answers } : {})
        setFlagged(typeof att.flagged === 'object' && att.flagged ? { ...att.flagged } : {})
        const idxRaw = Number(att.currentIndex || 0)
        const idx = qs.length > 0
          ? Math.max(0, Math.min(Number.isFinite(idxRaw) ? idxRaw : 0, qs.length - 1))
          : 0
        const baseVisited = typeof att.visited === 'object' && att.visited ? { ...att.visited } : {}
        setVisited({ ...baseVisited, [String(idx)]: true })
        setCurrentIndex(idx)
        currentRef.current = idx
      } catch (e) {
        if (!cancelled) {
          const msg = String(e.message || '')
          if (/already submitted/i.test(msg) && quizId && attemptId) {
            navigate(`/student/quizzes/${quizId}/results/${attemptId}`, { replace: true })
            return
          }
          setErr(msg || 'Failed to load attempt')
        }
      } finally {
        if (!cancelled) setAttemptReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [attemptId, quizId, navigate])

  useEffect(() => {
    let cancelled = false
    if (!quizId) return undefined
    ;(async () => {
      try {
        const o = await studentQuizApi.getOverview(quizId)
        if (!cancelled && o?.title) setQuizTitle(o.title)
      } catch { /* optional */ }
    })()
    return () => { cancelled = true }
  }, [quizId])

  useEffect(() => {
    if (!quizInProgress || attemptStartedAtMs == null) return undefined
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - attemptStartedAtMs) / 1000)))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [quizInProgress, attemptStartedAtMs])

  useEffect(() => {
    setPickFillingId(null)
    if (pickAdvanceTimerRef.current) {
      clearTimeout(pickAdvanceTimerRef.current)
      pickAdvanceTimerRef.current = null
    }
  }, [currentIndex])

  useEffect(() => {
    setVisited((v) => ({ ...(v || {}), [String(currentIndex)]: true }))
  }, [currentIndex])

  useEffect(() => {
    const onBeforeUnload = (e) => {
      flushSave()
      if (quizInProgressRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [flushSave])

  useEffect(() => {
    if (!submitConfirmOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setSubmitConfirmOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submitConfirmOpen])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      quizInProgress &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search)
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeaveConfirmOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    if (!quizInProgress || typeof document === 'undefined') return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [quizInProgress])

  /* CSS immersive + optional real fullscreen. List/overview fire requestFullscreen on the
   * document from the same click as navigation (user gesture). Ribbon remains if blocked. */

  useEffect(() => {
    if (!quizInProgress || completion) {
      setNeedManualFullscreen(false)
      return undefined
    }
    setNeedManualFullscreen(false)
    return () => {
      intentionalFullscreenExitRef.current = true
      unlockFullscreenKeyboardCapture()
      void exitDocumentFullscreen()
    }
  }, [quizInProgress, completion, attemptId])

  useEffect(() => {
    if (!quizInProgress || completion) return undefined
    const el = gameShellRef.current
    if (!el) return undefined
    const quizFsActive = () => {
      const fs = getFullscreenElement()
      if (!fs) return false
      if (el && fs === el) return true
      return isLikelyQuizFullscreenTarget(fs)
    }
    const onFsChange = () => {
      if (quizFsActive()) {
        setNeedManualFullscreen(false)
        void tryLockEscapeForFullscreen()
        return
      }
      unlockFullscreenKeyboardCapture()
      const fs = getFullscreenElement()
      if (!fs) {
        const wasIntentional = intentionalFullscreenExitRef.current
        if (wasIntentional) {
          intentionalFullscreenExitRef.current = false
        } else if (
          mountedRef.current &&
          quizInProgressRef.current &&
          !leaveConfirmOpenRef.current &&
          !submitConfirmOpenRef.current
        ) {
          setLeaveConfirmOpen(true)
        }
        if (mountedRef.current && !wasIntentional) {
          setNeedManualFullscreen(true)
        }
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [quizInProgress, completion])

  /* If we landed already in document fullscreen (e.g. from list click), sync ribbon + Esc lock. */
  useLayoutEffect(() => {
    if (!quizInProgress || completion) return
    const el = gameShellRef.current
    if (!el) return
    const fs = getFullscreenElement()
    if (!fs) return
    if (fs === el || isLikelyQuizFullscreenTarget(fs)) {
      setNeedManualFullscreen(false)
      void tryLockEscapeForFullscreen()
    }
  }, [quizInProgress, completion, attemptId, questions.length])

  /* Re-apply Esc trap after a real user gesture — covers rare cases where lock races auto-enter. */
  useEffect(() => {
    if (!quizInProgress || completion || !escapeLockSupported()) return undefined
    const el = gameShellRef.current
    if (!el) return undefined
    const onPointerDown = () => {
      const fs = getFullscreenElement()
      if (fs !== el && !isLikelyQuizFullscreenTarget(fs)) return
      void tryLockEscapeForFullscreen()
    }
    el.addEventListener('pointerdown', onPointerDown, true)
    return () => el.removeEventListener('pointerdown', onPointerDown, true)
  }, [quizInProgress, completion, attemptId])

  const enterFullscreenFromUserGesture = useCallback(async () => {
    const el = gameShellRef.current
    if (!el) return
    if (!escapeLockSupported()) {
      setNeedManualFullscreen(false)
      return
    }
    try {
      await requestElFullscreen(el)
      const locked = await tryLockEscapeForFullscreen()
      if (!locked) {
        intentionalFullscreenExitRef.current = true
        await exitDocumentFullscreen()
        setNeedManualFullscreen(true)
        return
      }
      setNeedManualFullscreen(false)
    } catch {
      setNeedManualFullscreen(true)
    }
  }, [])

  useEffect(() => {
    if (!quizInProgress || leaveConfirmOpen || submitConfirmOpen) return undefined
    const isEsc = (e) => e.key === 'Escape' || e.code === 'Escape'
    const onEscIntent = (e) => {
      if (!isEsc(e)) return
      e.preventDefault()
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation()
      } else {
        e.stopPropagation()
      }
      setLeaveConfirmOpen(true)
    }
    const opts = { capture: true }
    document.addEventListener('keydown', onEscIntent, opts)
    return () => {
      document.removeEventListener('keydown', onEscIntent, opts)
    }
  }, [quizInProgress, leaveConfirmOpen, submitConfirmOpen])

  useEffect(() => {
    if (!leaveConfirmOpen) return undefined
    setSubmitConfirmOpen(false)
  }, [leaveConfirmOpen])

  useEffect(() => {
    if (!leaveConfirmOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setLeaveConfirmOpen(false)
        if (blocker.state === 'blocked') {
          blocker.reset()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leaveConfirmOpen, blocker])

  const n = questions.length
  const raw = answers[String(currentIndex)]

  function setAnswerForCurrent(val) {
    const idx = currentIndex
    setAnswers((prev) => ({ ...prev, [String(idx)]: val }))
    scheduleSave()
  }

  function canNavigateToQuestion(i) {
    const a = answersRef.current
    const cur = currentRef.current
    if (i < 0 || i >= n) return false
    if (i === cur) return true
    if (i < cur) return true
    for (let k = cur; k < i; k += 1) {
      const qi = questions[k]
      if (!qi || !isAnswered(qi, a[String(k)])) return false
    }
    return true
  }

  function goTo(i) {
    if (!canNavigateToQuestion(i)) return
    setCurrentIndex(i)
    setAttempt((a) => (a ? { ...a, currentIndex: i } : a))
    currentRef.current = i
    scheduleSave()
  }

  function goNextOrSubmit() {
    if (submitting) return
    const idx = currentRef.current
    if (idx >= n - 1) {
      setSubmitConfirmOpen(true)
      return
    }
    goTo(idx + 1)
  }

  async function finalizeSubmit() {
    setSubmitting(true)
    setErr('')
    try {
      await flushSave()
      const data = await studentQuizApi.submit(attemptId)
      setCompletion(data)
    } catch (e) {
      setErr(e.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Loading state ── */
  if (!attemptReady) {
    return (
      <div className="sqGamePage">
        <div className="sqGameBody">
          <p className="sqGameLoadingText">Loading…</p>
        </div>
      </div>
    )
  }

  if (err && questions.length === 0) {
    return (
      <div className="sqGamePage">
        <div className="sqGameBody">
          <Link className="sqGameExit" to={`/student/quizzes/${quizId}`}>← Back to overview</Link>
          <p className="sqGameErr">{err}</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="sqGamePage">
        <div className="sqGameBody">
          <Link className="sqGameExit" to={`/student/quizzes/${quizId}`}>← Back to overview</Link>
          <p className="sqGameBodyMessage" style={{ marginTop: 24 }}>
            This quiz has no questions yet. Ask your instructor to add questions, then try again.
          </p>
        </div>
      </div>
    )
  }

  const q = questions[currentIndex]
  if (!q) {
    return (
      <div className="sqGamePage">
        <div className="sqGameBody">
          <Link className="sqGameExit" to={`/student/quizzes/${quizId}`}>← Back to overview</Link>
          <p className="sqGameErr">Something went wrong loading this question. Go back and re-open the quiz.</p>
        </div>
      </div>
    )
  }

  const autoChoiceAdvance = isPickThenSubmitType(q) || q.type === 'multi_choice'

  function handleChoiceAdvanceClick(optId) {
    if (submitting || !autoChoiceAdvance || pickAdvanceTimerRef.current) return
    setPickFillingId(String(optId))
    if (q.type === 'multi_choice') {
      setAnswerForCurrent([optId])
    } else {
      setAnswerForCurrent(optId)
    }
    pickAdvanceTimerRef.current = window.setTimeout(() => {
      pickAdvanceTimerRef.current = null
      setPickFillingId(null)
      goNextOrSubmit()
    }, 700)
  }

  async function confirmSubmitQuiz() {
    setSubmitConfirmOpen(false)
    await finalizeSubmit()
  }

  function dismissLeaveAttempt() {
    setLeaveConfirmOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }

  async function confirmLeaveSubmitFromBlocker() {
    setLeaveConfirmOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
    await finalizeSubmit()
  }

  const opts = q.options || []
  const optsGridCols = opts.length > 0 && opts.length <= 4 ? opts.length : 2
  const showChoiceGrid = autoChoiceAdvance && opts.length > 0
  /** Purple full-bleed row + numbered badges (same as 4-opt MCQ) for 2–4 options, e.g. true/false */
  const optsPurpleFullBleed = showChoiceGrid && opts.length >= 2 && opts.length <= 4
  const choiceGridClassName = `sqGameOpts sqGameOpts--grid sqGameOpts--cols-${optsGridCols}${
    optsPurpleFullBleed ? ' sqGameOpts--fullBleed' : ''
  }`

  const questionOutsideBody = showChoiceGrid && optsPurpleFullBleed
  const questionStageEnd = showChoiceGrid && !optsPurpleFullBleed
  const questionStageStart = !showChoiceGrid
  const choiceBusy = autoChoiceAdvance && pickFillingId != null

  const questionShellClass = 'sqGameCardShell sqGameCardShell--question'

  const questionBlock = (
    <div className={questionShellClass}>
      <div className="sqGameCard sqGameCard--questionBox">
        {questions.length > 0 ? (
          <div className="sqGameQCountPill" aria-label={`Question ${currentIndex + 1} of ${questions.length}`}>
            <span className="sqGameQCountPillCur">{currentIndex + 1}</span>
            <span className="sqGameQCountPillRest"> / {questions.length}</span>
          </div>
        ) : null}
        {q.type === 'code_image' && q.codeImageUrl ? (
          <div className="sqGameCodeImg">
            <img src={q.codeImageUrl} alt="" />
          </div>
        ) : null}
        {String(q.prompt || '').trim() ? (
          <div className="sqGameQPromptPanel">
            {q.type === 'code_image' ? (
              <pre className="sqGameCodeSnippet" tabIndex={0}>{q.prompt}</pre>
            ) : (
              <p className="sqGameQText sqGameQText--boxed">{q.prompt}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )

  const renderChoiceButtons = () =>
    opts.map((opt, idx) => {
      const selected =
        q.type === 'multi_choice'
          ? Array.isArray(raw) && raw.some((x) => String(x) === String(opt.id))
          : String(raw) === String(opt.id)
      const fillClass =
        autoChoiceAdvance && String(opt.id) === pickFillingId ? ' sqGameOpt--fillProgress' : ''
      return (
        <button
          key={opt.id || idx}
          type="button"
          className={`sqGameOpt sqGameOpt--tile${selected ? ' sqGameOpt--selected' : ''}${fillClass}`}
          disabled={autoChoiceAdvance && pickFillingId != null}
          onClick={() => handleChoiceAdvanceClick(opt.id)}
        >
          <span className="sqGameOptText sqGameOptText--tile">{opt.label}</span>
        </button>
      )
    })

  return (
    <div ref={gameShellRef} className="sqGamePage sqGamePage--immersive">
      {needManualFullscreen && quizInProgress ? (
        <div className="sqFsRibbon" role="status">
          <p className="sqFsRibbonText">
            Can&apos;t hide browser bars and keep Escape on this quiz. Continue in focused mode, or try again.
          </p>
          <button type="button" className="sqFsRibbonBtn" onClick={enterFullscreenFromUserGesture}>
            Try hiding browser UI
          </button>
        </div>
      ) : null}
      <div className="sqGameBody">
        <header className="sqGameQuizTop">
          <div className="sqGameCardShell sqGameCardShell--top">
            <div className="sqGameCard sqGameCard--top">
              <div className="sqGameHeader">
                {quizInProgress && attemptStartedAtMs != null ? (
                  <div
                    className="sqGameTimer sqGameTimer--compact"
                    role="timer"
                    aria-live="polite"
                    aria-label={`Elapsed time ${formatElapsedClock(elapsedSeconds)}`}
                  >
                    <span className="sqGameTimerIconWrap" aria-hidden>
                      <span className="sqGameTimerIcon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v6l3.5 2" />
                        </svg>
                      </span>
                    </span>
                    <div className="sqGameTimerTexts">
                      <span className="sqGameTimerLabel">Elapsed</span>
                      <span className="sqGameTimerValue">{formatElapsedClock(elapsedSeconds)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div
          className={`sqGameStage${questionStageEnd ? ' sqGameStage--choiceStack' : ''}`}
        >
          {questionStageStart ? questionBlock : null}

          {questionStageEnd ? questionBlock : null}

          {showChoiceGrid && !optsPurpleFullBleed ? (
            <div className={choiceGridClassName} aria-busy={choiceBusy}>
              {renderChoiceButtons()}
            </div>
          ) : null}

        {/* ── Fill blank ── */}
        {q.type === 'fill_blank' ? (
          <form
            className="sqGameFillForm"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault()
              if (submitting || !isAnswered(q, raw)) return
              goNextOrSubmit()
            }}
          >
            <div className="sqGameFillBlock">
              <label className="sqGameFillLabel" htmlFor={fillBlankInputId}>
                Your answer
              </label>
              <input
                id={fillBlankInputId}
                className="sqGameFill"
                type="text"
                name={`sq-fill-${uid}`}
                value={raw != null ? String(raw) : ''}
                placeholder="Type here…"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setAnswerForCurrent(e.target.value)}
              />
            </div>
          </form>
        ) : null}

        {err ? <p className="sqGameErr">{err}</p> : null}
        </div>
      </div>

      {questionOutsideBody ? <div className="sqGameQuestionDock">{questionBlock}</div> : null}

      {showChoiceGrid && optsPurpleFullBleed ? (
        <div className={choiceGridClassName} aria-busy={choiceBusy}>
          {renderChoiceButtons()}
        </div>
      ) : null}

      {/* ── Nav sheet (full viewport width; outside centered sqGameBody) ── */}
      <div className="sqGameNavSheet sqGameNavSheet--fullBleed">
        <div className="sqGameNavHeaderRow">
          <span className="sqGameNavTitle">Questions</span>
          <div className="sqGameLegend sqGameLegend--compact">
            <span><i className="sqGameLegendDot sqGameLegendDot--cur" />Now</span>
            <span><i className="sqGameLegendDot sqGameLegendDot--ok" />Done</span>
          </div>
        </div>
        <div className="sqGameNavTrack">
          {questions.map((qi, i) => {
            const r = answers[String(i)]
            const answered = isAnswered(qi, r)
            const flag = !!flagged[String(i)]
            const wasVisited = !!visited[String(i)]
            const skipped = wasVisited && !answered && !flag
            let cls = 'sqGameNavDot'
            if (i === currentIndex) cls += ' sqGameNavDot--cur'
            if (answered) cls += ' sqGameNavDot--ok'
            if (skipped) cls += ' sqGameNavDot--skip'
            if (flag) cls += ' sqGameNavDot--flag'
            return (
              <button
                type="button"
                key={qi.id || i}
                className={cls}
                disabled={!canNavigateToQuestion(i)}
                onClick={() => goTo(i)}
                title={
                  canNavigateToQuestion(i)
                    ? `Question ${i + 1}`
                    : `Answer questions before this one first`
                }
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {submitConfirmOpen ? (
        <div
          className="sqSubmitConfirmOverlay"
          role="presentation"
          onClick={() => setSubmitConfirmOpen(false)}
        >
          <div
            className="sqSubmitConfirmCard"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sqSubmitConfirmTitle"
            aria-describedby="sqSubmitConfirmDesc"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="sqSubmitConfirmClose"
              onClick={() => setSubmitConfirmOpen(false)}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="sqSubmitConfirmIcon" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
            </div>
            <h2 id="sqSubmitConfirmTitle" className="sqSubmitConfirmTitle">
              Submit this quiz?
            </h2>
            <p id="sqSubmitConfirmDesc" className="sqSubmitConfirmText">
              {"You can't change your answers after submitting. Make sure you've reviewed each question."}
            </p>
            <div className="sqSubmitConfirmActions">
              <button
                type="button"
                className="sqDoneBtn sqDoneBtn--ghost sqSubmitConfirmBtn"
                onClick={() => setSubmitConfirmOpen(false)}
              >
                Keep working
              </button>
              <button
                type="button"
                className="sqDoneBtn sqDoneBtn--primary sqSubmitConfirmBtn"
                onClick={confirmSubmitQuiz}
              >
                Submit quiz
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {leaveConfirmOpen ? (
        <div
          className="sqSubmitConfirmOverlay"
          role="presentation"
          onClick={dismissLeaveAttempt}
        >
          <div
            className="sqSubmitConfirmCard"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sqLeaveConfirmTitle"
            aria-describedby="sqLeaveConfirmDesc"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="sqSubmitConfirmClose"
              onClick={dismissLeaveAttempt}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="sqSubmitConfirmIcon" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
            </div>
            <h2 id="sqLeaveConfirmTitle" className="sqSubmitConfirmTitle">
              Do you want to submit the quiz?
            </h2>
            <p id="sqLeaveConfirmDesc" className="sqSubmitConfirmText">
              Submit to finish and see results, or stay to keep working in fullscreen.
            </p>
            <div className="sqSubmitConfirmActions">
              <button
                type="button"
                className="sqDoneBtn sqDoneBtn--ghost sqSubmitConfirmBtn"
                onClick={dismissLeaveAttempt}
              >
                Stay
              </button>
              <button
                type="button"
                className="sqDoneBtn sqDoneBtn--primary sqSubmitConfirmBtn"
                disabled={submitting}
                onClick={confirmLeaveSubmitFromBlocker}
              >
                Submit quiz
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Completion overlay ── */}
      {completion ? (
        <CompletionOverlay
          quizTitle={quizTitle}
          data={completion}
          flagged={flagged}
          quizId={quizId}
          attemptId={attemptId}
          navigate={navigate}
        />
      ) : null}
    </div>
  )
}

/* ============================================================
   COMPLETION OVERLAY
   ============================================================ */
function CompletionOverlay({ quizTitle, data, quizId, attemptId, navigate, flagged }) {
  const breakdown = Array.isArray(data.breakdown) ? data.breakdown : []
  const correct   = breakdown.filter((r) => r.isCorrect).length
  const incorrect = breakdown.filter((r) => !r.skipped && !r.isCorrect).length
  const skipped   = breakdown.filter((r) => r.skipped).length
  const flaggedMap   = flagged && typeof flagged === 'object' ? flagged : {}
  const reviewCount  = Object.values(flaggedMap).filter(Boolean).length
  const pct    = data.percent ?? 0
  const timeSec = data.timeSpentSeconds
  const timeStr = timeSec != null
    ? `${Math.floor(timeSec / 60)}m ${String(timeSec % 60).padStart(2, '0')}s`
    : null

  const grade =
    pct >= 90 ? { emoji: '🏆', label: 'Outstanding' } :
    pct >= 75 ? { emoji: '🎉', label: 'Great job!' } :
    pct >= 50 ? { emoji: '👍', label: 'Good effort' } :
                { emoji: '📚', label: 'Keep practising' }

  return (
    <div className="sqDoneOverlay" role="dialog" aria-modal="true" aria-labelledby="sqDoneTitle">
      <div className="sqDoneCard">

        {/* Head */}
        <div className="sqDoneCardHead">
          <div className="sqDoneHeadVisual">
            <div className="sqDoneBadge">
              <span className="sqDoneEmoji">{grade.emoji}</span>
            </div>
          </div>

          <h2 id="sqDoneTitle" className="sqDoneTitle">Quiz Complete!</h2>
          {quizTitle ? <p className="sqDoneQuizName">{quizTitle}</p> : null}
          <p className="sqDoneSub">{grade.label} — here's your summary.</p>

          {/* Big score */}
          <div className="sqDoneScoreBig">
            <span className="sqDoneScoreNum">{pct}%</span>
            <div className="sqDoneScoreLabel">Overall score</div>
          </div>

          {/* Stat grid */}
          <div className="sqDoneStatGrid">
            <div className="sqDoneStat">
              <span className="sqDoneStatLabel">Points</span>
              <span className="sqDoneStatValue">
                {data.scoreEarned}<span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font)' }}>/{data.maxPoints}</span>
              </span>
            </div>
            <div className="sqDoneStat">
              <span className="sqDoneStatLabel">Correct</span>
              <span className="sqDoneStatValue sqDoneStatValue--ok">{correct}</span>
            </div>
            <div className="sqDoneStat">
              <span className="sqDoneStatLabel">Incorrect</span>
              <span className="sqDoneStatValue sqDoneStatValue--bad">{incorrect}</span>
            </div>
            <div className="sqDoneStat">
              <span className="sqDoneStatLabel">Skipped</span>
              <span className="sqDoneStatValue">{skipped}</span>
            </div>
            <div className="sqDoneStat">
              <span className="sqDoneStatLabel">For review</span>
              <span className="sqDoneStatValue" style={{ color: 'var(--amber)' }}>{reviewCount}</span>
            </div>
            {timeStr ? (
              <div className="sqDoneStat">
                <span className="sqDoneStatLabel">Time spent</span>
                <span className="sqDoneStatValue" style={{ fontSize: 14 }}>{timeStr}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer actions */}
        <div className="sqDoneCardFoot">
          <button
            type="button"
            className="sqDoneBtn sqDoneBtn--primary"
            onClick={() => navigate(`/student/quizzes/${quizId}/results/${attemptId}`)}
          >
            Review answers →
          </button>
        </div>
      </div>
    </div>
  )
}