'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_LOGIN = 'almash591@gmail.com'
const ADMIN_PASSWORD = '1qa2ws'
const TAPS_REQUIRED = 5
const TAP_WINDOW_MS = 2000

export default function SecretAdminAccess() {
  const router = useRouter()
  const [tapCount, setTapCount] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleTap() {
    setTapCount((prev) => {
      const next = prev + 1
      if (next >= TAPS_REQUIRED) {
        setShowDialog(true)
        return 0
      }
      return next
    })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setTapCount(0), TAP_WINDOW_MS)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem('admin_unlocked', 'true')
      } catch {}
      setShowDialog(false)
      setLogin('')
      setPassword('')
      setError('')
      router.push('/admin')
    } else {
      setError('Неверный логин или пароль')
    }
  }

  return (
    <>
      <h1
        className="wordmark"
        onClick={handleTap}
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        МедикТест КР
      </h1>

      {showDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '340px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '14px', fontSize: '18px' }}>
              Вход в админку
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="input"
                style={{ marginBottom: '10px' }}
                autoFocus
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                style={{ marginBottom: '10px' }}
              />
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDialog(false)
                    setError('')
                  }}
                  className="btn btn-outline"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
