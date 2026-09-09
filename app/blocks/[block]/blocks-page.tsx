import { supabase } from '../../../lib/supabaseClient'
import QuestionList from '../../components/QuestionList'
import Link from 'next/link'

export default async function BlockPage({
  params,
}: {
  params: Promise<{ block: string }>
}) {
  const { block } = await params
  const blockNumber = Number(block)

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
      <QuestionList questions={questions} />
    </div>
  )
}
