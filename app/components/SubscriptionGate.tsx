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

  if (status === 'loading') return <p className="muted">Загрузка...</p>
  if (status === 'free' || status === 'allowed') return <>{children}</>

  return (
    <div className="card">
      <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '18px' }}>
        Доступно по подписке
      </p>
      <p className="muted" style={{ marginBottom: '16px' }}>
        {status === 'guest'
          ? 'Чтобы открыть этот раздел, сначала войдите в аккаунт, затем оформите подписку.'
          : 'Этот раздел доступен только с активной подпиской.'}
      </p>
      <Link href={status === 'guest' ? '/login' : '/subscribe'} className="btn btn-primary">
        {status === 'guest' ? 'Войти' : 'Оформить подписку'}
      </Link>
    </div>
  )
}
