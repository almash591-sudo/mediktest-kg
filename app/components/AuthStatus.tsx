'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function AuthStatus() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setLoaded(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (!loaded) return null

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#aaa',
      }}
    >
      {email ? (
        <>
          <span>Вы вошли как: {email}</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid #444',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Выйти
          </button>
        </>
      ) : (
        <a href="/login" style={{ color: '#4da3ff' }}>
          Войти / Зарегистрироваться
        </a>
      )}
    </div>
  )
}
