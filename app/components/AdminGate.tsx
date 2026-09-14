'use client'

import { useEffect, useState, ReactNode } from 'react'
import Link from 'next/link'

export default function AdminGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem('admin_unlocked') === 'true')
    } catch {}
    setChecking(false)
  }, [])

  if (checking) {
    return <div className="container">Проверка доступа...</div>
  }

  if (!unlocked) {
    return (
      <div className="container">
        <p>Доступ запрещён.</p>
        <Link href="/" className="link">
          На главную
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
