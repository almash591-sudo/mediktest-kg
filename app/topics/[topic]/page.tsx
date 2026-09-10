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
    return <div className="container">Ошибка: {error.message}</div>
  }

  return (
    <div className="container">
      <Link href="/" className="link">
        &larr; Назад
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        {topic}
      </h1>

      <div className="nav-row" style={{ marginTop: 0 }}>
        <Link
          href={`/topics/${encodeURIComponent(topic)}`}
          className={reviewMode ? 'btn btn-outline' : 'btn btn-primary'}
        >
          Тренировка
        </Link>
        <Link
          href={`/topics/${encodeURIComponent(topic)}?mode=review`}
          className={reviewMode ? 'btn btn-primary' : 'btn btn-outline'}
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
