'use client'

import { useState, useEffect, CSSProperties } from 'react'

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

  function getButtonStyle(question: Question, option: Option): CSSProperties {
    const selected = answers[question.id]
    const base: CSSProperties = {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '10px',
      marginBottom: '8px',
      borderRadius: '6px',
      border: '1px solid #444',
      cursor: showResults ? 'default' : 'pointer',
      background: option === selected ? '#22344d' : '#111',
      color: '#fff',
    }

    if (!showResults) return base

    if (option === question.correct_answer) {
      return { ...base, background: '#1a4d2e', border: '1px solid #2e7d4f' }
    }
    if (option === selected) {
      return { ...base, background: '#4d1a1a', border: '1px solid #7d2e2e' }
    }
    return { ...base, opacity: 0.5 }
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
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#000',
          padding: '10px 0',
          marginBottom: '20px',
          borderBottom: '1px solid #333',
          fontWeight: 'bold',
          fontSize: '18px',
        }}
      >
        Осталось времени: {formatTime(secondsLeft)}
      </div>

      {showResults && (
        <div
          style={{
            padding: '16px',
            marginBottom: '24px',
            borderRadius: '8px',
            border: '1px solid #444',
            background: '#161616',
          }}
        >
          <p style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>
            Результат: {correctCount} из {questions.length} правильно
          </p>
          <p style={{ margin: '4px 0 0', color: '#aaa' }}>
            Отвечено: {answeredCount} из {questions.length}
          </p>
        </div>
      )}

      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: '30px' }}>
          <p style={{ fontWeight: 'bold' }}>{q.question_text}</p>
          {options.map((opt) => (
            <button
              key={opt}
              style={getButtonStyle(q, opt)}
              onClick={() => handleSelect(q.id, opt)}
            >
              {opt}) {getOptionText(q, opt)}
            </button>
          ))}
        </div>
      ))}

      {!showResults && (
        <button
          onClick={() => setShowResults(true)}
          style={{
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            background: '#2e7d4f',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '10px',
          }}
        >
          Завершить экзамен
        </button>
      )}
    </div>
  )
}
