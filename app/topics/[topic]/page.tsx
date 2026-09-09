import { supabase } from '../../../lib/supabaseClient'
import QuestionList from '../../components/QuestionList'
import Link from 'next/link'

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>
}) {
  const { topic: rawTopic } = await params
  const topic = decodeURIComponent(rawTopic)

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
      <QuestionList questions={questions} />
    </div>
  )
}
