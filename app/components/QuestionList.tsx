'use client'

import { useState } from 'react'

export default function QuestionList({ questions }) {
  const [answers, setAnswers] = useState({})

  function handleSelect(questionId, option) {
    if (answers[questionId]) return
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  function getButtonStyle(question, option) {
    const selected = answers[question.id]
    const base = {
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

  return (
    <div>
      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: '30px' }}>
          <p style={{ fontWeight: 'bold' }}>{q.question_text}</p>
          {['a', 'b', 'c', 'd'].map((opt) => (
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
