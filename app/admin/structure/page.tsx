'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'

const ADMIN_EMAIL = 'almash591@gmail.com'

type Row = {
  specialty: string | null
  topic: string | null
  block_number: number | null
  created_at: string
}

type Group = {
  topic: string
  specialties: string[]
  count: number
  minBlock: number | null
  maxBlock: number | null
  earliest: string
  latest: string
}

type SortKey = 'topic' | 'specialty' | 'count' | 'latest'

async function fetchAllRows(): Promise<Row[]> {
  const pageSize = 1000
  let from = 0
  const all: Row[] = []

  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('specialty, topic, block_number, created_at')
      .range(from, from + pageSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    all.push(...(data as Row[]))
    if (data.length < pageSize) break
    from += pageSize
  }

  return all
}

export default function AdminStructurePage() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [sortKey, setSortKey] = useState<SortKey>('count')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [specialtyDrafts, setSpecialtyDrafts] = useState<Record<string, string>>({})
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({})
  const [savingTopic, setSavingTopic] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const data = await fetchAllRows()
      setRows(data)
    } catch (e: any) {
      setLoadError(e.message ?? String(e))
    }
    setLoading(false)
  }

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
      await load()
    }
    init()
  }, [])

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>()
    for (const r of rows) {
      const topic = r.topic || '(без темы)'
      const existing = map.get(topic)
      const specialty = r.specialty || '—'
      const block = r.block_number

      if (!existing) {
        map.set(topic, {
          topic,
          specialties: [specialty],
          count: 1,
          minBlock: block,
          maxBlock: block,
          earliest: r.created_at,
          latest: r.created_at,
        })
      } else {
        existing.count += 1
        if (!existing.specialties.includes(specialty)) existing.specialties.push(specialty)
        if (block !== null) {
          if (existing.minBlock === null || block < existing.minBlock) existing.minBlock = block
          if (existing.maxBlock === null || block > existing.maxBlock) existing.maxBlock = block
        }
        if (r.created_at < existing.earliest) existing.earliest = r.created_at
        if (r.created_at > existing.latest) existing.latest = r.created_at
      }
    }
    return Array.from(map.values())
  }, [rows])

  const sortedGroups = useMemo(() => {
    const copy = [...groups]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'topic') cmp = a.topic.localeCompare(b.topic)
      else if (sortKey === 'specialty') cmp = a.specialties.join(',').localeCompare(b.specialties.join(','))
      else if (sortKey === 'count') cmp = a.count - b.count
      else if (sortKey === 'latest') cmp = a.latest.localeCompare(b.latest)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [groups, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  async function applySpecialty(topic: string) {
    const value = specialtyDrafts[topic]
    if (!value) return
    setSavingTopic(topic)
    const { error } = await supabase.from('questions').update({ specialty: value }).eq('topic', topic)
    setSavingTopic(null)
    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }
    await load()
  }

  async function applyTopicRename(oldTopic: string) {
    const newTopic = topicDrafts[oldTopic]
    if (!newTopic || !newTopic.trim() || newTopic === oldTopic) return
    setSavingTopic(oldTopic)
    const { error } = await supabase.from('questions').update({ topic: newTopic.trim() }).eq('topic', oldTopic)
    setSavingTopic(null)
    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }
    await load()
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

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        padding: 0,
        color: 'var(--ink)',
        fontSize: '13px',
      }}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  )

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <Link href="/admin" className="link">
        &larr; В админку
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Структура базы
      </h1>
      <p className="muted" style={{ marginBottom: '20px' }}>
        Группировка по темам. Здесь можно проставить специальность сразу для всей темы и переименовать тему
        (изменения применяются ко всем вопросам с таким же значением).
      </p>

      {loadError && <p className="error-text">{loadError}</p>}
      {loading && <p className="muted">Загрузка... (читаю все вопросы, может занять несколько секунд)</p>}

      {!loading && (
        <>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              marginBottom: '8px',
            }}
          >
            <div style={{ flex: '2 1 200px' }}>
              <SortHeader label="Тема" k="topic" />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <SortHeader label="Специальность" k="specialty" />
            </div>
            <div style={{ flex: '0 0 70px' }}>
              <SortHeader label="Кол-во" k="count" />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <SortHeader label="Загружено" k="latest" />
            </div>
          </div>

          {sortedGroups.map((g) => (
            <div key={g.topic} className="card" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '10px' }}>
                <div style={{ flex: '2 1 200px' }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{g.topic}</p>
                  <p className="muted" style={{ fontSize: '12px', margin: '2px 0 0' }}>
                    блоки {g.minBlock ?? '—'}–{g.maxBlock ?? '—'}
                  </p>
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <p style={{ margin: 0 }}>{g.specialties.join(', ')}</p>
                </div>
                <div style={{ flex: '0 0 70px' }}>
                  <p style={{ margin: 0 }}>{g.count}</p>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                    {new Date(g.earliest).toLocaleDateString('ru-RU')}
                    {g.earliest !== g.latest && <> – {new Date(g.latest).toLocaleDateString('ru-RU')}</>}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Новая специальность"
                  value={specialtyDrafts[g.topic] ?? ''}
                  onChange={(e) =>
                    setSpecialtyDrafts((d) => ({ ...d, [g.topic]: e.target.value }))
                  }
                  className="input"
                  style={{ width: 'auto', flex: '1 1 160px' }}
                />
                <button
                  onClick={() => applySpecialty(g.topic)}
                  disabled={savingTopic === g.topic}
                  className="btn btn-outline"
                >
                  Задать специальность
                </button>

                <input
                  type="text"
                  placeholder="Переименовать тему"
                  value={topicDrafts[g.topic] ?? ''}
                  onChange={(e) => setTopicDrafts((d) => ({ ...d, [g.topic]: e.target.value }))}
                  className="input"
                  style={{ width: 'auto', flex: '1 1 160px' }}
                />
                <button
                  onClick={() => applyTopicRename(g.topic)}
                  disabled={savingTopic === g.topic}
                  className="btn btn-outline"
                >
                  Переименовать
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
