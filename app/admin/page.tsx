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
    return <div className="container">Проверка доступа...</div>
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <p>Доступ запрещён.</p>
        <Link href="/" className="link">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '760px' }}>
      <Link href="/" className="link">
        &larr; На главную
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Заявки на подписку
      </h1>

      {loadError && <p className="error-text">{loadError}</p>}

      {requests.length === 0 && <p className="muted">Заявок пока нет.</p>}

      {requests.map((r) => {
        const currentSub = subsByUser[r.user_id]
        const isActiveNow =
          currentSub?.is_active &&
          (!currentSub.expires_at || new Date(currentSub.expires_at) > new Date())

        return (
          <div key={r.id} className="card" style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: 700, marginBottom: '4px' }}>{r.email || r.user_id}</p>
            <p className="muted" style={{ fontSize: '14px', marginBottom: '10px' }}>
              Запросила план: {r.plan} · заявка от {new Date(r.created_at).toLocaleString('ru-RU')}
            </p>
            <p style={{ marginBottom: '14px' }}>
              Текущий статус:{' '}
              <span
                style={{
                  color: isActiveNow ? 'var(--correct)' : 'var(--incorrect)',
                  fontWeight: 600,
                }}
              >
                {isActiveNow
                  ? `активна до ${
                      currentSub?.expires_at
                        ? new Date(currentSub.expires_at).toLocaleDateString('ru-RU')
                        : '∞'
                    }`
                  : 'не активна'}
              </span>
            </p>

            <div className="nav-row" style={{ marginTop: 0, marginBottom: '12px' }}>
              <select
                value={planDrafts[r.user_id] || r.plan}
                onChange={(e) =>
                  setPlanDrafts((prev) => ({ ...prev, [r.user_id]: e.target.value }))
                }
                className="input"
                style={{ width: 'auto' }}
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
                className="input"
                style={{ width: 'auto' }}
              />

              <button onClick={() => quickSetMonths(r.user_id, 1)} className="btn btn-outline">
                +1 мес
              </button>
              <button onClick={() => quickSetMonths(r.user_id, 6)} className="btn btn-outline">
                +6 мес
              </button>
              <button onClick={() => quickSetMonths(r.user_id, 12)} className="btn btn-outline">
                +1 год
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => activate(r.user_id, r.email)}
                disabled={savingId === r.user_id}
                className="btn btn-primary"
              >
                {savingId === r.user_id ? 'Сохранение...' : 'Подтвердить и активировать'}
              </button>

              {isActiveNow && (
                <button
                  onClick={() => deactivate(r.user_id)}
                  disabled={savingId === r.user_id}
                  className="btn btn-outline"
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
