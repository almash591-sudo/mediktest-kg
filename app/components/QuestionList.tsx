'use client'

import { useState, CSSProperties } from 'react'

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

export default function QuestionList({
  questions,
  reviewMode = false,
}: {
  questions: Question[]
  reviewMode?: boolean
}) {
  const [answers, setAnswers] = useState<Record<number, Option>>({})
  const [showResults, setShowResults] = useState(false)

  function handleSelect(questionId: number, option: Option) {
    if (reviewMode) return
    if (answers[questionId]) return
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  function getOptionText(q: Question, opt: Option): string {
    if (opt === 'a') return q.option_a
    if (opt === 'b') return q.option_b
    if (opt === 'c') return q.option_c
    return q.option_d
  }

  function getButtonStyle(question: Question, option: Option): CSSProperties {
    const selected = reviewMode
      ? (question.correct_answer as Option)
      : answers[question.id]

    const base: CSSProperties = {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '10px',
      marginBottom: '8px',
      borderRadius: '6px',
      border: '1px solid #444',
      cursor: reviewMode || selected ? 'default' : 'pointer',
      background: '#111',
      color: '#fff',
    }

    if (!selected) return base

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

  function handleFinish() {
    setShowResults(true)
  }

  function handleRestart() {
    setAnswers({})
    setShowResults(false)
  }

  return (
    <div>
      {!reviewMode && showResults && (
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
          <p style={{ margin: '4px 0 12px', color: '#aaa' }}>
            Отвечено: {answeredCount} из {questions.length}
          </p>
          <button
            onClick={handleRestart}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #444',
              background: '#222',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Пройти заново
          </button>
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

      {!reviewMode && !showResults && (
        <button
          onClick={handleFinish}
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
          Завершить тест
        </button>
      )}
    </div>
  )
}
