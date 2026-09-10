'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

const PLANS = [
  { id: 'month', label: '1 месяц', price: '300 сом' },
  { id: 'half_year', label: '6 месяцев', price: '1500 сом' },
  { id: 'year', label: '1 год', price: '2500 сом' },
]

type SubStatus = {
  isActive: boolean
  expiresAt: string | null
  plan: string | null
}

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState('month')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<SubStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    setStatusLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id

    if (!uid) {
      setStatus(null)
      setStatusLoading(false)
      return
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('is_active, expires_at, plan')
      .eq('user_id', uid)
      .maybeSingle()

    if (data) {
      const active =
        !!data.is_active && (!data.expires_at || new Date(data.expires_at) > new Date())
      setStatus({ isActive: active, expiresAt: data.expires_at, plan: data.plan })
    } else {
      setStatus({ isActive: false, expiresAt: null, plan: null })
    }
    setStatusLoading(false)
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id

    if (!uid) {
      setError('Сначала нужно войти в аккаунт.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('subscription_requests')
      .insert({ user_id: uid, plan: selectedPlan, email: userData.user?.email })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSubmitted(true)
  }

  const planLabel = (id: string | null) =>
    PLANS.find((p) => p.id === id)?.label ?? id ?? ''

  return (
    <div className="container" style={{ maxWidth: '560px' }}>
      <Link href="/" className="link">
        &larr; Назад
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Подписка
      </h1>

      {!statusLoading && status && (
        <div
          className={status.isActive ? 'banner-success' : 'banner-muted'}
          style={{ marginBottom: '20px' }}
        >
          {status.isActive ? (
            <p style={{ margin: 0 }}>
              Подписка активна ({planLabel(status.plan)})
              {status.expiresAt && (
                <> — до {new Date(status.expiresAt).toLocaleDateString('ru-RU')}</>
              )}
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Подписка сейчас не активна. Выбери план ниже, чтобы оформить.
            </p>
          )}
        </div>
      )}

      <div className="nav-row" style={{ marginTop: 0 }}>
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`plan-card${selectedPlan === plan.id ? ' selected' : ''}`}
          >
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{plan.label}</div>
            <div className="muted">{plan.price}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <p style={{ fontWeight: 700, marginBottom: '8px' }}>Как оплатить</p>
        <p style={{ marginBottom: '4px' }}>
          Переведи сумму выбранного плана на МБАНК: <b>+79213091217</b>
        </p>
        <p style={{ marginBottom: '4px' }}>
          Пришли скрин перевода в Telegram/WhatsApp: <b>+79312091217</b>
        </p>
        <p className="muted" style={{ fontSize: '14px' }}>
          После проверки оплаты доступ откроется в течение суток.
        </p>
      </div>

      {!submitted ? (
        <>
          {error && <p className="error-text">{error}</p>}
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
            {loading
              ? 'Отправка...'
              : status?.isActive
              ? 'Продлить подписку, отправить заявку'
              : 'Я оплатил(а), отправить заявку'}
          </button>
        </>
      ) : (
        <p className="success-text">
          Заявка отправлена. Доступ откроется после проверки оплаты.
        </p>
      )}
    </div>
  )
}
