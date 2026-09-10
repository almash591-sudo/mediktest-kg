'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AuthStatus from './components/AuthStatus'

export default function Home() {
  const [blocks, setBlocks] = useState<number[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('block_number, topic')

      if (qError) {
        setError(qError.message)
        setLoading(false)
        return
      }

      const blockList = Array.from(
        new Set((questions ?? []).map((q) => q.block_number))
      ).sort((a, b) => a - b)
      const topicList = Array.from(
        new Set((questions ?? []).map((q) => q.topic).filter(Boolean))
      )

      setBlocks(blockList)
      setTopics(topicList)

      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id

      if (uid) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('is_active, expires_at')
          .eq('user_id', uid)
          .maybeSingle()

        const active =
          !!sub?.is_active && (!sub.expires_at || new Date(sub.expires_at) > new Date())
        setIsSubscribed(active)
      }

      setLoading(false)
    }

    load()
  }, [])

  if (error) {
    return <div style={{ padding: '20px' }}>Ошибка: {error}</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <AuthStatus />

      <h1>МедикТест КР</h1>

      <div style={{ margin: '20px 0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
        <Link
          href="/mistakes"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: '6px',
            background: '#333',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          Мои ошибки
        </Link>
        <Link
          href="/favorites"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: '6px',
            background: '#333',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          Избранное
        </Link>
        <Link
          href="/subscribe"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: '6px',
            background: '#7a5b1a',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}
        >
          Подписка
        </Link>
      </div>

      {!isSubscribed && (
        <p style={{ color: '#aaa', marginBottom: '20px' }}>
          Блок 1 доступен бесплатно. Остальные блоки, темы и экзамен — по подписке.
        </p>
      )}

      {loading ? (
        <p style={{ color: '#aaa' }}>Загрузка...</p>
      ) : (
        <>
          <h2>Блоки</h2>
          {blocks.map((b) => {
            const locked = !isSubscribed && b !== 1
            return (
              <div key={b} style={{ marginBottom: '8px' }}>
                <Link href={`/blocks/${b}`} style={{ color: '#4da3ff' }}>
                  Блок {b} {locked ? '🔒' : ''}
                </Link>
              </div>
            )
          })}

          <h2 style={{ marginTop: '30px' }}>Темы</h2>
          {topics.map((t) => {
            const locked = !isSubscribed
            return (
              <div key={t} style={{ marginBottom: '8px' }}>
                <Link href={`/topics/${encodeURIComponent(t)}`} style={{ color: '#4da3ff' }}>
                  {t} {locked ? '🔒' : ''}
                </Link>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
