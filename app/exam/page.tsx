import { supabase } from '../../lib/supabaseClient'
import ExamClient from '../components/ExamClient'
import SubscriptionGate from '../components/SubscriptionGate'
import Link from 'next/link'

const EXAM_QUESTION_COUNT = 100

export default async function ExamPage() {
  const { data: questions, error } = await supabase.from('questions').select('*')

  if (error) {
    return <div className="container">Ошибка: {error.message}</div>
  }

  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  const examQuestions = shuffled.slice(0, EXAM_QUESTION_COUNT)

  return (
    <div className="container">
      <Link href="/" className="link">
        &larr; Назад
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Экзамен
      </h1>
      <p className="muted" style={{ marginBottom: '20px' }}>
        Вопросов: {examQuestions.length}. Время: 50 минут.
      </p>
      <SubscriptionGate>
        <ExamClient questions={examQuestions} />
      </SubscriptionGate>
    </div>
  )
}
