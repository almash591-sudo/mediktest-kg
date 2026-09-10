'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import ThemeToggle from './ThemeToggle'

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
    <div className="topbar">
      {email ? <span>Вы вошли как {email}</span> : (
        <a href="/login" className="link">
          Войти или зарегистрироваться
        </a>
      )}
      <div className="topbar-right">
        <ThemeToggle />
        {email && (
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '13px', minHeight: 'auto' }}
          >
            Выйти
          </button>
        )}
      </div>
    </div>
  )
}
