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
    return <div className="container">Ошибка: {error}</div>
  }

  return (
    <div className="container">
      <AuthStatus />

      <h1 className="wordmark">МедикТест КР</h1>

      <div className="nav-row">
        <Link href="/exam" className="btn btn-primary">Начать экзамен</Link>
        <Link href="/mistakes" className="btn btn-outline">Мои ошибки</Link>
        <Link href="/favorites" className="btn btn-outline">Избранное</Link>
        <Link href="/subscribe" className="btn btn-outline">Подписка</Link>
      </div>

      {!isSubscribed && (
        <p className="muted" style={{ marginBottom: '20px' }}>
          Блок 1 доступен бесплатно. Остальные блоки, темы и экзамен — по подписке.
        </p>
      )}

      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : (
        <>
          <h2 className="section-heading">Блоки</h2>
          <div>
            {blocks.map((b) => {
              const locked = !isSubscribed && b !== 1
              return (
                <div key={b} className="list-link-row">
                  <Link href={`/blocks/${b}`} className="link">
                    Блок {b}
                  </Link>
                  {locked && <span className="locked-badge">по подписке</span>}
                </div>
              )
            })}
          </div>

          <h2 className="section-heading">Темы</h2>
          <div>
            {topics.map((t) => {
              const locked = !isSubscribed
              return (
                <div key={t} className="list-link-row">
                  <Link href={`/topics/${encodeURIComponent(t)}`} className="link">
                    {t}
                  </Link>
                  {locked && <span className="locked-badge">по подписке</span>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
