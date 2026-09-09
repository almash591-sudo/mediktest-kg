import { supabase } from '../../../lib/supabaseClient'
import QuestionList from '../../components/QuestionList'
import Link from 'next/link'

export default async function BlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ block: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { block } = await params
  const { mode } = await searchParams
  const blockNumber = Number(block)
  const reviewMode = mode === 'review'

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('block_number', blockNumber)

  if (error) {
    return <div>Ошибка: {error.message}</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#4da3ff' }}>
        &larr; Назад
      </Link>
      <h1>Блок {blockNumber}</h1>

      <div style={{ marginBottom: '20px' }}>
        <Link
          href={`/blocks/${blockNumber}`}
          style={{
            marginRight: '16px',
            color: reviewMode ? '#4da3ff' : '#fff',
            fontWeight: reviewMode ? 'normal' : 'bold',
          }}
        >
          Тренировка
        </Link>
        <Link
          href={`/blocks/${blockNumber}?mode=review`}
          style={{
            color: reviewMode ? '#fff' : '#4da3ff',
            fontWeight: reviewMode ? 'bold' : 'normal',
          }}
        >
          Просмотр с ответами
        </Link>
      </div>

      <QuestionList questions={questions} reviewMode={reviewMode} />
    </div>
  )
}
