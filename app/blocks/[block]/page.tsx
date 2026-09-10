import { supabase } from '../../../lib/supabaseClient'
import QuestionList from '../../components/QuestionList'
import SubscriptionGate from '../../components/SubscriptionGate'
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
  const isFree = blockNumber === 1

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('block_number', blockNumber)

  if (error) {
    return <div className="container">Ошибка: {error.message}</div>
  }

  return (
    <div className="container">
      <Link href="/" className="link">
        &larr; Назад
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Блок {blockNumber}
      </h1>

      <div className="nav-row" style={{ marginTop: 0 }}>
        <Link
          href={`/blocks/${blockNumber}`}
          className={reviewMode ? 'btn btn-outline' : 'btn btn-primary'}
        >
          Тренировка
        </Link>
        <Link
          href={`/blocks/${blockNumber}?mode=review`}
          className={reviewMode ? 'btn btn-primary' : 'btn btn-outline'}
        >
          Просмотр с ответами
        </Link>
      </div>

      <SubscriptionGate isFree={isFree}>
        <QuestionList questions={questions} reviewMode={reviewMode} />
      </SubscriptionGate>
    </div>
  )
}
