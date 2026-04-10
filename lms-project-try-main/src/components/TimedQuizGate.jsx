import { useMemo, useState } from 'react'
import styles from './TimedQuizGate.module.css'

function TimedQuizGate({ quiz, onSuccess }) {
  const questions = useMemo(() => {
    if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      return quiz.questions
    }

    return [
      {
        id: 'q-1',
        question: quiz.question,
        options: quiz.options,
        correctOptionId: quiz.correctOptionId,
      },
    ]
  }, [quiz])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [answers, setAnswers] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const [status, setStatus] = useState('idle')

  const currentQuestion = questions[currentQuestionIndex]

  const optionMap = useMemo(() => {
    return currentQuestion.options.reduce((map, option) => {
      map[option.id] = option
      return map
    }, {})
  }, [currentQuestion.options])

  const score = useMemo(() => {
    return answers.reduce((total, answer) => (answer.isCorrect ? total + 1 : total), 0)
  }, [answers])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!selectedOption) {
      setStatus('no-selection')
      return
    }

    const isCorrect = selectedOption === currentQuestion.correctOptionId
    const nextAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
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
    setSelectedOption('')
    setStatus('idle')
  }

  if (isComplete) {
    return (
      <aside className={styles.quizCard} aria-live="polite">
        <p className={styles.badge}>Quiz Complete</p>
        <h3 className={styles.title}>Final Score</h3>
        <p className={styles.scoreText}>
          You scored <strong>{score}</strong> out of <strong>{questions.length}</strong>
        </p>

        <button className={styles.submitButton} type="button" onClick={onSuccess}>
          Continue Video
        </button>
      </aside>
    )
  }

  return (
    <aside className={styles.quizCard} aria-live="polite">
      <p className={styles.badge}>Checkpoint Quiz</p>
      <p className={styles.progressText}>
        Question {currentQuestionIndex + 1} of {questions.length}
      </p>
      <h3 className={styles.title}>{currentQuestion.question}</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        {currentQuestion.options.map((option, optionIndex) => (
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
        ))}

        <button className={styles.submitButton} type="submit">
          {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </form>

      {status === 'no-selection' && (
        <p className={styles.errorText}>Please choose an answer first.</p>
      )}

      <p className={styles.helperText}>
        Current answer selected: {optionMap[selectedOption]?.label ?? 'None'}
      </p>
    </aside>
  )
}

export default TimedQuizGate