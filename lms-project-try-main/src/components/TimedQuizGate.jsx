import { useEffect, useMemo, useState } from 'react'
import styles from './TimedQuizGate.module.css'

function normalizeFillBlank(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function splitPromptAndCode(raw) {
  const text = String(raw || '')
  const fence = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/)
  if (fence) {
    const before = text.slice(0, fence.index).trim()
    const after = text.slice(fence.index + fence[0].length).trim()
    const prompt = [before, after].filter(Boolean).join('\n\n')
    return { prompt, code: fence[1] || '' }
  }
  const hasNewlines = /\n/.test(text)
  const hasCodeSignals = /[{}();]/.test(text)
  if (hasNewlines && hasCodeSignals) {
    return { prompt: 'Review the code and answer:', code: text }
  }
  return { prompt: text, code: '' }
}

function TimedQuizGate({ quiz, loading = false, error = '', onRetry, onSuccess }) {
  const questions = useMemo(() => {
    if (Array.isArray(quiz?.questions) && quiz.questions.length > 0) {
      return quiz.questions
    }

    if (quiz && quiz.question) {
      return [
        {
          id: 'q-1',
          type: 'mcq',
          question: quiz.question,
          options: quiz.options || [],
          correctOptionId: quiz.correctOptionId,
        },
      ]
    }

    return []
  }, [quiz])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [selectedOptions, setSelectedOptions] = useState([])
  const [fillAnswer, setFillAnswer] = useState('')
  const [answers, setAnswers] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const [status, setStatus] = useState('idle')

  const currentQuestion = questions[currentQuestionIndex]
  const currentOptions = Array.isArray(currentQuestion?.options) ? currentQuestion.options : []
  const currentType = currentQuestion?.type || 'mcq'
  const { prompt, code } = splitPromptAndCode(currentQuestion?.question)

  const progressPct = questions.length
    ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
    : 0

  useEffect(() => {
    setSelectedOption('')
    setSelectedOptions([])
    setFillAnswer('')
    setStatus('idle')
  }, [currentQuestionIndex])

  const optionMap = useMemo(() => {
    return currentOptions.reduce((map, option) => {
      map[String(option.id)] = option
      return map
    }, {})
  }, [currentOptions])

  const score = useMemo(() => {
    return answers.reduce((total, answer) => (answer.isCorrect ? total + 1 : total), 0)
  }, [answers])

  const getCorrectOptionIds = (q) =>
    (q.options || []).filter((o) => o.isCorrect).map((o) => String(o.id))

  const getCorrectAnswerLabel = (q) => {
    if (q.type === 'fill_blank') {
      const raw = Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers[0] : ''
      return raw || '—'
    }
    const correct = getCorrectOptionIds(q)
    if (!correct.length) return '—'
    const map = (q.options || []).reduce((acc, opt) => {
      acc[String(opt.id)] = opt
      return acc
    }, {})
    return correct.map((id) => map[String(id)]?.label || id).join(', ')
  }

  const getAnswerLabel = (q, answer) => {
    if (!answer) return '—'
    if (q.type === 'fill_blank') return answer.fillAnswer || '—'
    if (q.type === 'multi_choice') {
      const map = (q.options || []).reduce((acc, opt) => {
        acc[String(opt.id)] = opt
        return acc
      }, {})
      return (answer.selectedOptionIds || [])
        .map((id) => map[String(id)]?.label || id)
        .join(', ')
    }
    const map = (q.options || []).reduce((acc, opt) => {
      acc[String(opt.id)] = opt
      return acc
    }, {})
    return map[String(answer.selectedOptionId)]?.label || '—'
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!currentQuestion) return

    if (currentType === 'fill_blank' && !fillAnswer.trim()) {
      setStatus('no-selection')
      return
    }

    if (currentType === 'multi_choice' && selectedOptions.length === 0) {
      setStatus('no-selection')
      return
    }

    if (currentType !== 'multi_choice' && currentType !== 'fill_blank' && !selectedOption) {
      setStatus('no-selection')
      return
    }

    let isCorrect = false
    const correctIds = getCorrectOptionIds(currentQuestion)
    if (currentType === 'fill_blank') {
      const correct = Array.isArray(currentQuestion.acceptedAnswers)
        ? currentQuestion.acceptedAnswers[0]
        : ''
      isCorrect = normalizeFillBlank(fillAnswer) === normalizeFillBlank(correct)
    } else if (currentType === 'multi_choice') {
      const normalized = selectedOptions.map(String).sort()
      const correctSorted = correctIds.map(String).sort()
      isCorrect = normalized.length === correctSorted.length &&
        normalized.every((v, idx) => v === correctSorted[idx])
    } else {
      const correctId = correctIds[0] || currentQuestion.correctOptionId
      isCorrect = String(selectedOption) === String(correctId)
    }

    const nextAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
        selectedOptionIds: selectedOptions,
        fillAnswer,
        isCorrect,
      },
    ]

    setAnswers(nextAnswers)

    if (currentQuestionIndex === questions.length - 1) {
      setIsComplete(true)
      setStatus('idle')
      return
    }

    setCurrentQuestionIndex((previousIndex) => previousIndex + 1)
    setStatus('idle')
  }

  if (loading) {
    return (
      <aside className={styles.quizCard} aria-live="polite">
        <p className={styles.badge}>Checkpoint Quiz</p>
        <h3 className={styles.title}>Loading quiz…</h3>
        <p className={styles.helperText}>Please wait while we load the questions.</p>
      </aside>
    )
  }

  if (error) {
    return (
      <aside className={styles.quizCard} aria-live="polite">
        <p className={styles.badge}>Checkpoint Quiz</p>
        <h3 className={styles.title}>Quiz unavailable</h3>
        <p className={styles.errorText}>{error}</p>
        {onRetry ? (
          <button className={styles.submitButton} type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </aside>
    )
  }

  if (!questions.length) {
    return (
      <aside className={styles.quizCard} aria-live="polite">
        <p className={styles.badge}>Checkpoint Quiz</p>
        <h3 className={styles.title}>No quiz questions found</h3>
      </aside>
    )
  }

  if (isComplete) {
    const correctCount = answers.filter((a) => a?.isCorrect).length
    const wrongCount = Math.max(0, questions.length - correctCount)
    const percent = questions.length ? Math.round((correctCount / questions.length) * 100) : 0
    return (
      <aside className={styles.quizCard} aria-live="polite">
        <div className={styles.quizHeader}>
          <p className={styles.badge}>Quiz Complete</p>
          <h3 className={styles.title}>Results summary</h3>
        </div>

        <div className={styles.quizBody}>
          <div className={styles.resultSummary}>
            <div className={styles.resultMetric}>
              <span className={styles.resultMetricLabel}>Correct</span>
              <span className={styles.resultMetricValue}>{correctCount}</span>
            </div>
            <div className={styles.resultMetric}>
              <span className={styles.resultMetricLabel}>Wrong</span>
              <span className={styles.resultMetricValue}>{wrongCount}</span>
            </div>
            <div className={styles.resultMetric}>
              <span className={styles.resultMetricLabel}>Score</span>
              <span className={styles.resultMetricValue}>{percent}%</span>
            </div>
          </div>
          <div className={styles.progressBar} aria-hidden>
            <span className={styles.progressFill} style={{ width: `${percent}%` }} />
          </div>

          <div className={styles.resultsList}>
            {questions.map((q, index) => {
              const answer = answers[index]
              const correctLabel = getCorrectAnswerLabel(q)
              const answerLabel = getAnswerLabel(q, answer)
              return (
                <div key={q.id || index} className={styles.resultItem}>
                  <div className={styles.resultHeader}>
                    <span className={answer?.isCorrect ? styles.resultOk : styles.resultBad}>
                      {answer?.isCorrect ? 'Correct' : 'Wrong'}
                    </span>
                    <span className={styles.resultQuestion}>{q.question || 'Question'}</span>
                  </div>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Your answer:</span>
                    <span className={styles.resultValue}>{answerLabel}</span>
                  </div>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Correct answer:</span>
                    <span className={styles.resultValue}>{correctLabel}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.quizFooter}>
          <span className={styles.helperText}>Review complete. Continue to the lesson video.</span>
          <button className={styles.submitButton} type="button" onClick={onSuccess}>
            Continue Video
          </button>
        </div>
      </aside>
    )
  }

  const selectedSummary = currentType === 'multi_choice'
    ? (selectedOptions.length
        ? selectedOptions.map((id) => optionMap[id]?.label || id).join(', ')
        : 'None')
    : currentType === 'fill_blank'
      ? (fillAnswer.trim() || 'None')
      : (optionMap[selectedOption]?.label ?? 'None')

  return (
    <aside className={styles.quizCard} aria-live="polite">
      <div className={styles.quizHeader}>
        <p className={styles.badge}>Checkpoint Quiz</p>
        <div className={styles.progressRow}>
          <p className={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <span className={styles.progressPct}>{progressPct}%</span>
        </div>
        <div className={styles.progressBar} aria-hidden>
          <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className={styles.quizBody}>
        {code ? (
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>Code</div>
            <pre className={styles.codePre}>
              <code>{code}</code>
            </pre>
          </div>
        ) : null}

        <h3 className={styles.title}>{prompt}</h3>

        {currentQuestion.codeImageUrl ? (
          <img className={styles.codeImage} src={currentQuestion.codeImageUrl} alt="Code prompt" />
        ) : null}

        <form onSubmit={handleSubmit} className={styles.form}>
          {currentType === 'fill_blank' ? (
            <input
              type="text"
              className={styles.fillBlankInput}
              value={fillAnswer}
              onChange={(event) => {
                setFillAnswer(event.target.value)
                setStatus('idle')
              }}
              placeholder="Type your answer"
            />
          ) : currentType === 'multi_choice' ? (
            currentOptions.map((option, optionIndex) => (
              <label key={option.id} className={styles.optionCard}>
                <input
                  type="checkbox"
                  name={`video-quiz-${currentQuestion.id}`}
                  value={option.id}
                  checked={selectedOptions.includes(String(option.id))}
                  onChange={(event) => {
                    const id = String(option.id)
                    const next = event.target.checked
                      ? [...selectedOptions, id]
                      : selectedOptions.filter((entry) => entry !== id)
                    setSelectedOptions(next)
                    setStatus('idle')
                  }}
                />
                <span className={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</span>
                <span className={styles.optionLabel}>{option.label}</span>
              </label>
            ))
          ) : (
            currentOptions.map((option, optionIndex) => (
              <label key={option.id} className={styles.optionCard}>
                <input
                  type="radio"
                  name={`video-quiz-${currentQuestion.id}`}
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(event) => {
                    setSelectedOption(event.target.value)
                    setStatus('idle')
                  }}
                />
                <span className={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</span>
                <span className={styles.optionLabel}>{option.label}</span>
              </label>
            ))
          )}
        </form>
      </div>

      <div className={styles.quizFooter}>
        {status === 'no-selection' ? (
          <p className={styles.errorText}>Please choose an answer first.</p>
        ) : (
          <p className={styles.helperText}>Selected answer: {selectedSummary}</p>
        )}
        <button className={styles.submitButton} type="submit" onClick={handleSubmit}>
          {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </aside>
  )
}

export default TimedQuizGate