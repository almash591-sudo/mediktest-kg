import { supabase } from '../lib/supabaseClient'
import AuthStatus from './components/AuthStatus'
import Link from 'next/link'

export default async function Home() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('block_number, topic')

  if (error) {
    return <div>Ошибка: {error.message}</div>
  }

  const blocks = Array.from(new Set(questions.map((q) => q.block_number))).sort(
    (a, b) => a - b
  )
  const topics = Array.from(
    new Set(questions.map((q) => q.topic).filter(Boolean))
  )

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <AuthStatus />

      <h1>МедикТест КР</h1>

      <div style={{ margin: '20px 0' }}>
        <Link
          href="/exam"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: '6px',
            background: '#2e7d4f',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          Начать экзамен
        </Link>
      </div>

      <h2>Блоки</h2>
      {blocks.map((b) => (
        <div key={b} style={{ marginBottom: '8px' }}>
          <Link href={`/blocks/${b}`} style={{ color: '#4da3ff' }}>
            Блок {b}
          </Link>
        </div>
      ))}

      <h2 style={{ marginTop: '30px' }}>Темы</h2>
      {topics.map((t) => (
        <div key={t} style={{ marginBottom: '8px' }}>
          <Link href={`/topics/${encodeURIComponent(t)}`} style={{ color: '#4da3ff' }}>
            {t}
          </Link>
        </div>
      ))}
    </div>
  )
}
