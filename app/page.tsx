'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import AuthStatus from './components/AuthStatus'
import SecretAdminAccess from './components/SecretAdminAccess'

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

      <SecretAdminAccess />

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
          <div className="nav-row" style={{ marginTop: 0 }}>
            {blocks.map((b) => {
              const locked = !isSubscribed && b !== 1
              return (
                <Link
                  key={b}
                  href={`/blocks/${b}`}
                  className={locked ? 'btn btn-outline locked-tile' : 'btn btn-outline'}
                >
                  Блок {b}
                  {locked ? ' 🔒' : ''}
                </Link>
              )
            })}
          </div>

          <h2 className="section-heading">Темы</h2>
          <div className="nav-row" style={{ marginTop: 0 }}>
            {topics.map((t) => {
              const locked = !isSubscribed
              return (
                <Link
                  key={t}
                  href={`/topics/${encodeURIComponent(t)}`}
                  className={locked ? 'btn btn-outline locked-tile' : 'btn btn-outline'}
                >
                  {t}
                  {locked ? ' 🔒' : ''}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
