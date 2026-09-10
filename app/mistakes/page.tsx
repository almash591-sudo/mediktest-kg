'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import QuestionList from '../components/QuestionList'

type Question = {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
}

export default function MistakesPage() {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id

      if (!uid) {
        setLoggedIn(false)
        setLoading(false)
        return
      }
      setLoggedIn(true)

      const { data: wrongAnswers } = await supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', uid)
        .eq('is_correct', false)

      const ids = (wrongAnswers ?? []).map((r) => r.question_id)

      if (ids.length === 0) {
        setQuestions([])
        setLoading(false)
        return
      }

      const { data: questionRows } = await supabase
        .from('questions')
        .select('*')
        .in('id', ids)

      setQuestions(questionRows ?? [])
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="container">
      <Link href="/" className="link">
        &larr; Назад
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Мои ошибки
      </h1>

      {loading && <p className="muted">Загрузка...</p>}

      {!loading && !loggedIn && (
        <p className="muted">
          Чтобы видеть свои ошибки, нужно{' '}
          <Link href="/login" className="link">
            войти в аккаунт
          </Link>
          .
        </p>
      )}

      {!loading && loggedIn && questions.length === 0 && (
        <p className="muted">
          Пока нет ни одной ошибки — либо ты всё решаешь верно, либо ещё не проходила тесты.
        </p>
      )}

      {!loading && loggedIn && questions.length > 0 && <QuestionList questions={questions} />}
    </div>
  )
}
