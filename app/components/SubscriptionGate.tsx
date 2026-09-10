'use client'

import { useEffect, useState, ReactNode } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

type Status = 'loading' | 'free' | 'allowed' | 'blocked' | 'guest'

export default function SubscriptionGate({
  isFree = false,
  children,
}: {
  isFree?: boolean
  children: ReactNode
}) {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    async function check() {
      if (isFree) {
        setStatus('free')
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id

      if (!uid) {
        setStatus('guest')
        return
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('is_active, expires_at')
        .eq('user_id', uid)
        .maybeSingle()

      const active =
        !!data?.is_active &&
        (!data.expires_at || new Date(data.expires_at) > new Date())

      setStatus(active ? 'allowed' : 'blocked')
    }

    check()
  }, [isFree])

  if (status === 'loading') return <p style={{ color: '#aaa' }}>Загрузка...</p>
  if (status === 'free' || status === 'allowed') return <>{children}</>

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #444',
        borderRadius: '8px',
        background: '#161616',
      }}
    >
      <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>
        Доступно по подписке
      </p>
      <p style={{ color: '#aaa', marginBottom: '16px' }}>
        {status === 'guest'
          ? 'Чтобы открыть этот раздел, сначала войдите в аккаунт, затем оформите подписку.'
          : 'Этот раздел доступен только с активной подпиской.'}
      </p>
      <Link
        href={status === 'guest' ? '/login' : '/subscribe'}
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          borderRadius: '6px',
          background: '#2e7d4f',
          color: '#fff',
          fontWeight: 'bold',
          textDecoration: 'none',
        }}
      >
        {status === 'guest' ? 'Войти' : 'Оформить подписку'}
      </Link>
    </div>
  )
}
