'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'

const ADMIN_EMAIL = 'almash591@gmail.com'
const PAGE_SIZE = 20

type Question = {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  block_number: number | null
  topic: string | null
}

function csvEscape(value: string | number | null): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export default function AdminQuestionsPage() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [topics, setTopics] = useState<string[]>([])
  const [topicFilter, setTopicFilter] = useState('')
  const [blockFilter, setBlockFilter] = useState('')
  const [search, setSearch] = useState('')

  const [questions, setQuestions] = useState<Question[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<Question>>({})
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    let query = supabase.from('questions').select('*', { count: 'exact' })

    if (blockFilter) query = query.eq('block_number', Number(blockFilter))
    if (topicFilter) query = query.eq('topic', topicFilter)
    if (search.trim()) query = query.ilike('question_text', `%${search.trim()}%`)

    query = query
      .order('id', { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    const { data, count, error } = await query

    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }

    setQuestions(data ?? [])
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [blockFilter, topicFilter, search, page])

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

      const { data: topicRows } = await supabase.from('questions').select('topic')
      const uniqueTopics = Array.from(
        new Set((topicRows ?? []).map((r) => r.topic).filter(Boolean))
      ) as string[]
      setTopics(uniqueTopics.sort())
    }
    init()
  }, [])

  useEffect(() => {
    if (isAdmin) loadQuestions()
  }, [isAdmin, loadQuestions])

  function startEdit(q: Question) {
    setEditingId(q.id)
    setDraft({ ...q })
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({})
  }

  async function saveEdit() {
    if (editingId === null) return
    setSaving(true)

    const { error } = await supabase
      .from('questions')
      .update({
        question_text: draft.question_text,
        option_a: draft.option_a,
        option_b: draft.option_b,
        option_c: draft.option_c,
        option_d: draft.option_d,
        correct_answer: draft.correct_answer,
        block_number: draft.block_number,
        topic: draft.topic,
      })
      .eq('id', editingId)

    setSaving(false)

    if (error) {
      alert('Ошибка сохранения: ' + error.message)
      return
    }

    setEditingId(null)
    setDraft({})
    await loadQuestions()
  }

  async function deleteQuestion(id: number) {
    if (!confirm('Удалить этот вопрос без возможности отмены?')) return

    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) {
      alert('Ошибка удаления: ' + error.message)
      return
    }
    await loadQuestions()
  }

  async function exportCsv() {
    setExporting(true)

    let query = supabase
      .from('questions')
      .select('question_text, option_a, option_b, option_c, option_d, correct_answer, block_number, topic')

    if (blockFilter) query = query.eq('block_number', Number(blockFilter))
    if (topicFilter) query = query.eq('topic', topicFilter)
    if (search.trim()) query = query.ilike('question_text', `%${search.trim()}%`)

    const { data, error } = await query.order('id', { ascending: true })

    setExporting(false)

    if (error) {
      alert('Ошибка экспорта: ' + error.message)
      return
    }

    const header = [
      'question_text',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'block_number',
      'topic',
    ]
    const lines = [header.join(',')]
    for (const row of data ?? []) {
      lines.push(
        [
          csvEscape(row.question_text),
          csvEscape(row.option_a),
          csvEscape(row.option_b),
          csvEscape(row.option_c),
          csvEscape(row.option_d),
          csvEscape(row.correct_answer),
          csvEscape(row.block_number),
          csvEscape(row.topic),
        ].join(',')
      )
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyFilters() {
    setPage(0)
    loadQuestions()
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="container" style={{ maxWidth: '820px' }}>
      <Link href="/admin" className="link">
        &larr; К заявкам на подписку
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Управление вопросами
      </h1>
      <p className="muted" style={{ marginBottom: '20px' }}>
        Всего вопросов: {totalCount}
      </p>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="nav-row" style={{ marginTop: 0, marginBottom: '12px' }}>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', flex: '1 1 200px' }}
          >
            <option value="">Все темы</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Номер блока"
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', flex: '1 1 140px' }}
          />

          <input
            type="text"
            placeholder="Поиск по тексту вопроса"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ width: 'auto', flex: '2 1 220px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={applyFilters} className="btn btn-primary">
            Применить фильтры
          </button>
          <button onClick={exportCsv} disabled={exporting} className="btn btn-outline">
            {exporting ? 'Экспорт...' : 'Экспортировать в CSV (с учётом фильтров)'}
          </button>
        </div>
      </div>

      {loadError && <p className="error-text">{loadError}</p>}
      {loading && <p className="muted">Загрузка...</p>}

      {!loading &&
        questions.map((q) => (
          <div key={q.id} className="card" style={{ marginBottom: '14px' }}>
            {editingId === q.id ? (
              <div>
                <label className="muted" style={{ fontSize: '13px' }}>
                  Текст вопроса
                </label>
                <textarea
                  value={draft.question_text ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, question_text: e.target.value }))}
                  className="input"
                  style={{ minHeight: '70px', marginBottom: '10px' }}
                />

                {(['a', 'b', 'c', 'd'] as const).map((letter) => (
                  <div key={letter} style={{ marginBottom: '8px' }}>
                    <label className="muted" style={{ fontSize: '13px' }}>
                      Вариант {letter}
                    </label>
                    <input
                      type="text"
                      value={(draft as any)[`option_${letter}`] ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [`option_${letter}`]: e.target.value }))
                      }
                      className="input"
                    />
                  </div>
                ))}

                <div className="nav-row" style={{ marginTop: 0, marginBottom: '12px' }}>
                  <div style={{ flex: '1 1 120px' }}>
                    <label className="muted" style={{ fontSize: '13px', display: 'block' }}>
                      Правильный
                    </label>
                    <select
                      value={draft.correct_answer ?? 'a'}
                      onChange={(e) => setDraft((d) => ({ ...d, correct_answer: e.target.value }))}
                      className="input"
                    >
                      <option value="a">a</option>
                      <option value="b">b</option>
                      <option value="c">c</option>
                      <option value="d">d</option>
                    </select>
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label className="muted" style={{ fontSize: '13px', display: 'block' }}>
                      Блок
                    </label>
                    <input
                      type="number"
                      value={draft.block_number ?? ''}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, block_number: Number(e.target.value) }))
                      }
                      className="input"
                    />
                  </div>
                  <div style={{ flex: '2 1 200px' }}>
                    <label className="muted" style={{ fontSize: '13px', display: 'block' }}>
                      Тема
                    </label>
                    <input
                      type="text"
                      value={draft.topic ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveEdit} disabled={saving} className="btn btn-primary">
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button onClick={cancelEdit} className="btn btn-outline">
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
                  #{q.id} · блок {q.block_number ?? '—'} · {q.topic || 'без темы'}
                </p>
                <p style={{ fontWeight: 600, marginBottom: '10px' }}>{q.question_text}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => startEdit(q)} className="btn btn-outline">
                    Редактировать
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="btn btn-outline"
                    style={{ color: 'var(--incorrect)', borderColor: 'var(--incorrect)' }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

      {!loading && questions.length === 0 && (
        <p className="muted">Ничего не найдено по этим фильтрам.</p>
      )}

      {!loading && totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-outline"
          >
            Назад
          </button>
          <span className="muted">
            Страница {page + 1} из {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
            className="btn btn-outline"
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  )
}
