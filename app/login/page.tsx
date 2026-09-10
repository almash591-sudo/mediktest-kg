'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      setMessage('Регистрация прошла. Если включено подтверждение почты — проверь ящик. Иначе можно сразу войти.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="container" style={{ maxWidth: '420px' }}>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        {mode === 'signin' ? 'Вход' : 'Регистрация'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label className="muted" style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
            Email
          </label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label className="muted" style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
            Пароль
          </label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="error-text">{error}</p>}
        {message && (
          <p className="success-text" style={{ marginBottom: '12px' }}>
            {message}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
          {loading ? 'Подождите...' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: '18px', fontSize: '14px' }}>
        {mode === 'signin' ? (
          <>
            Нет аккаунта?{' '}
            <button
              onClick={() => setMode('signup')}
              className="link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              Зарегистрироваться
            </button>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <button
              onClick={() => setMode('signin')}
              className="link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              Войти
            </button>
          </>
        )}
      </p>
    </div>
  )
}
