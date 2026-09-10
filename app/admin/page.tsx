'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

const ADMIN_EMAIL = 'almash591@gmail.com'

type Request = {
  id: number
  user_id: string
  email: string | null
  plan: string
  created_at: string
}

type Subscription = {
  user_id: string
  is_active: boolean
  plan: string | null
  expires_at: string | null
}

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [requests, setRequests] = useState<Request[]>([])
  const [subsByUser, setSubsByUser] = useState<Record<string, Subscription>>({})
  const [planDrafts, setPlanDrafts] = useState<Record<string, string>>({})
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      const email = userData.user?.email

      if (email !== ADMIN_EMAIL) {
        setIsAdmin(false)
        setChecking(false)
        return
      }
      setIsAdmin(true)
      setChecking(false)
      await loadData()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoadError('')

    const { data: reqData, error: reqError } = await supabase
      .from('subscription_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (reqError) {
      setLoadError(reqError.message)
      return
    }

    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')

    if (subError) {
      setLoadError(subError.message)
      return
    }

    setRequests(reqData ?? [])

    const map: Record<string, Subscription> = {}
    for (const s of subData ?? []) {
      map[s.user_id] = s
    }
    setSubsByUser(map)

    const initialPlans: Record<string, string> = {}
    const initialDates: Record<string, string> = {}
    for (const r of reqData ?? []) {
      initialPlans[r.user_id] = r.plan
      initialDates[r.user_id] = toDateInputValue(addMonths(new Date(), 1))
    }
    setPlanDrafts((prev) => ({ ...initialPlans, ...prev }))
    setDateDrafts((prev) => ({ ...initialDates, ...prev }))
  }

  function quickSetMonths(userId: string, months: number) {
    setDateDrafts((prev) => ({
      ...prev,
      [userId]: toDateInputValue(addMonths(new Date(), months)),
    }))
  }

  async function activate(userId: string, email: string | null) {
    setSavingId(userId)

    const plan = planDrafts[userId] || 'month'
    const expiresAt = dateDrafts[userId]

    const { error } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        email: email,
        is_active: true,
        plan,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
      { onConflict: 'user_id' }
    )

    setSavingId(null)

    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }

    await loadData()
  }

  async function deactivate(userId: string) {
    setSavingId(userId)
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
    setSavingId(null)

    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }
    await loadData()
  }

  if (checking) {
    return <div style={{ padding: '20px' }}>Проверка доступа...</div>
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Доступ запрещён.</p>
        <Link href="/" style={{ color: '#4da3ff' }}>
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#4da3ff' }}>
        &larr; На главную
      </Link>
      <h1>Админка: заявки на подписку</h1>

      {loadError && <p style={{ color: '#ff6b6b' }}>{loadError}</p>}

      {requests.length === 0 && <p style={{ color: '#aaa' }}>Заявок пока нет.</p>}

      {requests.map((r) => {
        const currentSub = subsByUser[r.user_id]
        const isActiveNow =
          currentSub?.is_active &&
          (!currentSub.expires_at || new Date(currentSub.expires_at) > new Date())

        return (
          <div
            key={r.id}
            style={{
              padding: '16px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: '1px solid #444',
              background: '#161616',
            }}
          >
            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {r.email || r.user_id}
            </p>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>
              Запросила план: {r.plan} · заявка от{' '}
              {new Date(r.created_at).toLocaleString('ru-RU')}
            </p>
            <p style={{ marginBottom: '12px' }}>
              Текущий статус:{' '}
              <span style={{ color: isActiveNow ? '#6bcf7f' : '#ff6b6b' }}>
                {isActiveNow
                  ? `активна до ${currentSub?.expires_at ? new Date(currentSub.expires_at).toLocaleDateString('ru-RU') : '∞'}`
                  : 'не активна'}
              </span>
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <select
                value={planDrafts[r.user_id] || r.plan}
                onChange={(e) =>
                  setPlanDrafts((prev) => ({ ...prev, [r.user_id]: e.target.value }))
                }
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: '#111',
                  color: '#fff',
                }}
              >
                <option value="month">1 месяц</option>
                <option value="half_year">6 месяцев</option>
                <option value="year">1 год</option>
              </select>

              <input
                type="date"
                value={dateDrafts[r.user_id] || ''}
                onChange={(e) =>
                  setDateDrafts((prev) => ({ ...prev, [r.user_id]: e.target.value }))
                }
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: '#111',
                  color: '#fff',
                }}
              />

              <button
                onClick={() => quickSetMonths(r.user_id, 1)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff', cursor: 'pointer' }}
              >
                +1 мес
              </button>
              <button
                onClick={() => quickSetMonths(r.user_id, 6)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff', cursor: 'pointer' }}
              >
                +6 мес
              </button>
              <button
                onClick={() => quickSetMonths(r.user_id, 12)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff', cursor: 'pointer' }}
              >
                +1 год
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => activate(r.user_id, r.email)}
                disabled={savingId === r.user_id}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#2e7d4f',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {savingId === r.user_id ? 'Сохранение...' : 'Подтвердить и активировать'}
              </button>

              {isActiveNow && (
                <button
                  onClick={() => deactivate(r.user_id)}
                  disabled={savingId === r.user_id}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Отключить
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
