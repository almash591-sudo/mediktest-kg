import { supabase } from '../../../lib/supabaseClient'
import QuestionList from '../../components/QuestionList'
import SubscriptionGate from '../../components/SubscriptionGate'
import Link from 'next/link'

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { topic: rawTopic } = await params
  const { mode } = await searchParams
  const topic = decodeURIComponent(rawTopic)
  const reviewMode = mode === 'review'

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('topic', topic)

  if (error) {
    return <div>Ошибка: {error.message}</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#4da3ff' }}>
        &larr; Назад
      </Link>
      <h1>{topic}</h1>

      <div style={{ marginBottom: '20px' }}>
        <Link
          href={`/topics/${encodeURIComponent(topic)}`}
          style={{
            marginRight: '16px',
            color: reviewMode ? '#4da3ff' : '#fff',
            fontWeight: reviewMode ? 'normal' : 'bold',
          }}
        >
          Тренировка
        </Link>
        <Link
          href={`/topics/${encodeURIComponent(topic)}?mode=review`}
          style={{
            color: reviewMode ? '#fff' : '#4da3ff',
            fontWeight: reviewMode ? 'bold' : 'normal',
          }}
        >
          Просмотр с ответами
        </Link>
      </div>

      <SubscriptionGate>
        <QuestionList questions={questions} reviewMode={reviewMode} />
      </SubscriptionGate>
    </div>
  )
}
