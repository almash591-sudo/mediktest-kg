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

export default function QuestionList({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<number, Option>>({})

  function handleSelect(questionId: number, option: Option) {
    if (answers[questionId]) return
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
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
      cursor: selected ? 'default' : 'pointer',
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

  return (
    <div>
      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: '30px' }}>
          <p style={{ fontWeight: 'bold' }}>{q.question_text}</p>
          {options.map((opt) => (
            <button
              key={opt}
              style={getButtonStyle(q, opt)}
              onClick={() => handleSelect(q.id, opt)}
            >
              {opt}) {q[`option_${opt}`]}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
