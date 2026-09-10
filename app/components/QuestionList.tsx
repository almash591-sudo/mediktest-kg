'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

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
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})
  const [showResults, setShowResults] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (reviewMode) return

    async function loadUserAndProgress() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id ?? null
      setUserId(uid)

      if (!uid) return

      const ids = questions.map((q) => q.id)
      if (ids.length === 0) return

      const { data } = await supabase
        .from('user_answers')
        .select('question_id, selected_option, is_favorite')
        .eq('user_id', uid)
        .in('question_id', ids)

      if (!data) return

      const answersMap: Record<number, Option> = {}
      const favMap: Record<number, boolean> = {}
      for (const row of data) {
        if (row.selected_option) {
          answersMap[row.question_id] = row.selected_option as Option
        }
        if (row.is_favorite) {
          favMap[row.question_id] = true
        }
      }
      setAnswers(answersMap)
      setFavorites(favMap)
    }

    loadUserAndProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSelect(questionId: number, option: Option) {
    if (reviewMode) return
    if (answers[questionId]) return

    setAnswers((prev) => ({ ...prev, [questionId]: option }))

    if (!userId) return

    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    const isCorrect = option === question.correct_answer

    await supabase.from('user_answers').upsert(
      {
        user_id: userId,
        question_id: questionId,
        is_correct: isCorrect,
        selected_option: option,
      },
      { onConflict: 'user_id,question_id' }
    )
  }

  async function toggleFavorite(questionId: number) {
    if (!userId) {
      alert('Войдите в аккаунт, чтобы добавлять вопросы в избранное')
      return
    }

    const newValue = !favorites[questionId]
    setFavorites((prev) => ({ ...prev, [questionId]: newValue }))

    await supabase.from('user_answers').upsert(
      {
        user_id: userId,
        question_id: questionId,
        is_favorite: newValue,
      },
      { onConflict: 'user_id,question_id' }
    )
  }

  function getOptionText(q: Question, opt: Option): string {
    if (opt === 'a') return q.option_a
    if (opt === 'b') return q.option_b
    if (opt === 'c') return q.option_c
    return q.option_d
  }

  function getOptionClass(question: Question, option: Option): string {
    const selected = reviewMode
      ? (question.correct_answer as Option)
      : answers[question.id]

    if (!selected) return 'option-row'

    if (option === question.correct_answer) {
      return 'option-row correct'
    }
    if (option === selected) {
      return 'option-row incorrect'
    }
    return 'option-row faded'
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
        <div className="banner-success" style={{ marginBottom: '28px' }}>
          <p style={{ fontWeight: 700, fontSize: '18px', margin: 0 }}>
            Результат: {correctCount} из {questions.length} правильно
          </p>
          <p style={{ margin: '4px 0 14px' }}>
            Отвечено: {answeredCount} из {questions.length}
          </p>
          <button onClick={handleRestart} className="btn btn-outline">
            Пройти заново (на экране)
          </button>
        </div>
      )}

      {questions.map((q, i) => (
        <div key={q.id} className="question">
          <div className="qnum">{i + 1}</div>
          <div className="qbody">
            <div className="qtext-row">
              <p className="qtext">{q.question_text}</p>
              {!reviewMode && (
                <button
                  onClick={() => toggleFavorite(q.id)}
                  title="В избранное"
                  className={`fav-btn${favorites[q.id] ? ' active' : ''}`}
                >
                  {favorites[q.id] ? '★' : '☆'}
                </button>
              )}
            </div>
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

      {!reviewMode && !showResults && (
        <button onClick={handleFinish} className="btn btn-primary" style={{ marginTop: '10px' }}>
          Завершить тест
        </button>
      )}
    </div>
  )
}
