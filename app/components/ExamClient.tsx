'use client'

import { useState, useEffect } from 'react'

type Question = {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
}

type Option = 'a' | 'b' | 'c' | 'd'

const EXAM_SECONDS = 50 * 60

export default function ExamClient({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<number, Option>>({})
  const [showResults, setShowResults] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS)

  useEffect(() => {
    if (showResults) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setShowResults(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showResults])

  function handleSelect(questionId: number, option: Option) {
    if (showResults) return
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  function getOptionText(q: Question, opt: Option): string {
    if (opt === 'a') return q.option_a
    if (opt === 'b') return q.option_b
    if (opt === 'c') return q.option_c
    return q.option_d
  }

  function getOptionClass(question: Question, option: Option): string {
    const selected = answers[question.id]

    if (!showResults) {
      return option === selected ? 'option-row picked' : 'option-row'
    }

    if (option === question.correct_answer) return 'option-row correct'
    if (option === selected) return 'option-row incorrect'
    return 'option-row faded'
  }

  const options: Option[] = ['a', 'b', 'c', 'd']
  const answeredCount = Object.keys(answers).length
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correct_answer
  ).length

  function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <div className="timer-bar">Осталось времени: {formatTime(secondsLeft)}</div>

      {showResults && (
        <div className="banner-success" style={{ marginBottom: '28px' }}>
          <p style={{ fontWeight: 700, fontSize: '18px', margin: 0 }}>
            Результат: {correctCount} из {questions.length} правильно
          </p>
          <p style={{ margin: '4px 0 0' }}>
            Отвечено: {answeredCount} из {questions.length}
          </p>
        </div>
      )}

      {questions.map((q, i) => (
        <div key={q.id} className="question">
          <div className="qnum">{i + 1}</div>
          <div className="qbody">
            <p className="qtext" style={{ marginBottom: '14px' }}>
              {q.question_text}
            </p>
            {options.map((opt) => (
              <button
                key={opt}
                className={getOptionClass(q, opt)}
                onClick={() => handleSelect(q.id, opt)}
              >
                <span className="option-marker">{opt}</span>
                <span>{getOptionText(q, opt)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {!showResults && (
        <button
          onClick={() => setShowResults(true)}
          className="btn btn-primary"
          style={{ marginTop: '10px' }}
        >
          Завершить экзамен
        </button>
      )}
    </div>
  )
}
