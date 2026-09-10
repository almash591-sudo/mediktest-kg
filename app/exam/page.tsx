import { supabase } from '../../lib/supabaseClient'
import ExamClient from '../components/ExamClient'
import SubscriptionGate from '../components/SubscriptionGate'
import Link from 'next/link'

const EXAM_QUESTION_COUNT = 100

export default async function ExamPage() {
  const { data: questions, error } = await supabase.from('questions').select('*')

  if (error) {
    return <div>Ошибка: {error.message}</div>
  }

  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  const examQuestions = shuffled.slice(0, EXAM_QUESTION_COUNT)

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#4da3ff' }}>
        &larr; Назад
      </Link>
      <h1>Экзамен</h1>
      <p style={{ color: '#aaa' }}>
        Вопросов: {examQuestions.length}. Время: 50 минут.
      </p>
      <SubscriptionGate>
        <ExamClient questions={examQuestions} />
      </SubscriptionGate>
    </div>
  )
}
