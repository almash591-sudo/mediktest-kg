'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

const PLANS = [
  { id: 'month', label: '1 месяц', price: '300 сом' },
  { id: 'half_year', label: '6 месяцев', price: '1500 сом' },
  { id: 'year', label: '1 год', price: '2500 сом' },
]

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState('month')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#4da3ff' }}>
        &larr; Назад
      </Link>
      <h1>Подписка</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            style={{
              flex: '1 1 150px',
              padding: '16px',
              borderRadius: '8px',
              border:
                selectedPlan === plan.id
                  ? '2px solid #2e7d4f'
                  : '1px solid #444',
              background: selectedPlan === plan.id ? '#1a4d2e' : '#161616',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{plan.label}</div>
            <div style={{ color: '#aaa' }}>{plan.price}</div>
          </button>
        ))}
      </div>

      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #444',
          background: '#161616',
          marginBottom: '20px',
        }}
      >
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Как оплатить:</p>
        <p style={{ color: '#ccc', marginBottom: '4px' }}>
          Переведи сумму выбранного плана на МБАНК: <b>+79213091217</b>
        </p>
        <p style={{ color: '#ccc', marginBottom: '4px' }}>
          Пришли скрин перевода в Telegram/WhatsApp: <b>+79213091217</b>
        </p>
        <p style={{ color: '#aaa', fontSize: '14px' }}>
          После проверки оплаты доступ откроется в течение суток.
        </p>
      </div>

      {!submitted ? (
        <>
          {error && <p style={{ color: '#ff6b6b', marginBottom: '12px' }}>{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              background: '#2e7d4f',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Отправка...' : 'Я оплатил(а), отправить заявку'}
          </button>
        </>
      ) : (
        <p style={{ color: '#6bcf7f', fontWeight: 'bold' }}>
          Заявка отправлена. Доступ откроется после проверки оплаты.
        </p>
      )}
    </div>
  )
}
