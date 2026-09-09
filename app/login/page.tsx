'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

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
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>{mode === 'signin' ? 'Вход' : 'Регистрация'}</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #444',
              background: '#111',
              color: '#fff',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #444',
              background: '#111',
              color: '#fff',
            }}
          />
        </div>

        {error && (
          <p style={{ color: '#ff6b6b', marginBottom: '12px' }}>{error}</p>
        )}
        {message && (
          <p style={{ color: '#6bcf7f', marginBottom: '12px' }}>{message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            background: '#2e7d4f',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Подождите...' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <p style={{ marginTop: '16px' }}>
        {mode === 'signin' ? (
          <>
            Нет аккаунта?{' '}
            <button
              onClick={() => setMode('signup')}
              style={{ color: '#4da3ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Зарегистрироваться
            </button>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <button
              onClick={() => setMode('signin')}
              style={{ color: '#4da3ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Войти
            </button>
          </>
        )}
      </p>
    </div>
  )
}
