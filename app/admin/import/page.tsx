'use client'

import { useState } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'
import { supabase } from '../../../lib/supabaseClient'

const ADMIN_EMAIL = 'almash591@gmail.com'
const BATCH_SIZE = 500

type CsvRow = Record<string, string>

type ParsedQuestion = {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  topic: string
  block_number: number
  specialty: string
}

export default function AdminImportPage() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checked, setChecked] = useState(false)

  const [csvText, setCsvText] = useState('')
  const [rows, setRows] = useState<CsvRow[]>([])
  const [parseError, setParseError] = useState('')

  const [specialty, setSpecialty] = useState('')
  const [topicMode, setTopicMode] = useState<'fixed' | 'fromCsv'>('fixed')
  const [fixedTopic, setFixedTopic] = useState('')
  const [blockMode, setBlockMode] = useState<'fixed' | 'fromCsv'>('fixed')
  const [fixedBlock, setFixedBlock] = useState('')

  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [resultMessage, setResultMessage] = useState('')
  const [importErrors, setImportErrors] = useState<string[]>([])

  useState(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      setIsAdmin(userData.user?.email === ADMIN_EMAIL)
      setChecking(false)
      setChecked(true)
    }
    init()
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setCsvText(text)
      parseCsv(text)
    }
    reader.readAsText(file, 'utf-8')
  }

  function parseCsv(text: string) {
    setParseError('')
    const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true })

    if (result.errors.length > 0) {
      setParseError(result.errors[0].message)
      setRows([])
      return
    }

    const required = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']
    const headers = result.meta.fields ?? []
    const missing = required.filter((r) => !headers.includes(r))
    if (missing.length > 0) {
      setParseError('В файле не хватает колонок: ' + missing.join(', '))
      setRows([])
      return
    }

    if (topicMode === 'fromCsv' && !headers.includes('topic')) {
      setParseError('Выбрано "брать тему из CSV", но колонки topic в файле нет')
      setRows([])
      return
    }
    if (blockMode === 'fromCsv' && !headers.includes('block_number')) {
      setParseError('Выбрано "брать блок из CSV", но колонки block_number в файле нет')
      setRows([])
      return
    }

    setRows(result.data)
  }

  function handleTextareaChange(text: string) {
    setCsvText(text)
    if (text.trim()) parseCsv(text)
    else setRows([])
  }

  function buildQuestions(): ParsedQuestion[] {
    return rows.map((r) => ({
      question_text: r.question_text ?? '',
      option_a: r.option_a ?? '',
      option_b: r.option_b ?? '',
      option_c: r.option_c ?? '',
      option_d: r.option_d ?? '',
      correct_answer: (r.correct_answer ?? '').trim().toLowerCase(),
      topic: topicMode === 'fromCsv' ? r.topic ?? '' : fixedTopic,
      block_number: blockMode === 'fromCsv' ? Number(r.block_number) : Number(fixedBlock),
      specialty,
    }))
  }

  async function handleImport() {
    setImportErrors([])
    setResultMessage('')

    if (!specialty.trim()) {
      setParseError('Укажи специальность перед импортом')
      return
    }
    if (topicMode === 'fixed' && !fixedTopic.trim()) {
      setParseError('Укажи тему (или переключись на "брать из CSV")')
      return
    }
    if (blockMode === 'fixed' && !fixedBlock.trim()) {
      setParseError('Укажи номер блока (или переключись на "брать из CSV")')
      return
    }

    const questions = buildQuestions()
    if (questions.length === 0) return

    setImporting(true)
    setProgress({ done: 0, total: questions.length })

    const errors: string[] = []
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('questions').insert(batch)
      if (error) errors.push(error.message)
      setProgress({ done: Math.min(i + BATCH_SIZE, questions.length), total: questions.length })
    }

    setImporting(false)
    setImportErrors(errors)
    if (errors.length === 0) {
      setResultMessage(`Готово: загружено ${questions.length} вопросов.`)
      setRows([])
      setCsvText('')
    }
  }

  if (checking || !checked) {
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

  const preview = rows.slice(0, 5)

  return (
    <div className="container" style={{ maxWidth: '820px' }}>
      <Link href="/admin" className="link">
        &larr; В админку
      </Link>
      <h1 className="wordmark" style={{ fontSize: '24px' }}>
        Импорт вопросов из CSV
      </h1>
      <p className="muted" style={{ marginBottom: '20px' }}>
        Обязательные колонки в файле: question_text, option_a, option_b, option_c, option_d, correct_answer.
        Колонки topic и block_number — опциональны, если не берёшь их из файла (настрой ниже).
      </p>

      <div className="card" style={{ marginBottom: '20px' }}>
        <label className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Файл CSV
        </label>
        <input type="file" accept=".csv" onChange={handleFile} style={{ marginBottom: '14px' }} />

        <label className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          ...или вставь содержимое CSV прямо сюда
        </label>
        <textarea
          value={csvText}
          onChange={(e) => handleTextareaChange(e.target.value)}
          className="input"
          style={{ minHeight: '100px' }}
        />
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <label className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Специальность (например: Терапия, Гинекология)
        </label>
        <input
          type="text"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="input"
          style={{ marginBottom: '16px' }}
        />

        <label className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Тема
        </label>
        <div className="nav-row" style={{ marginTop: 0, marginBottom: '8px' }}>
          <button
            onClick={() => setTopicMode('fixed')}
            className={topicMode === 'fixed' ? 'btn btn-primary' : 'btn btn-outline'}
          >
            Одна тема на весь файл
          </button>
          <button
            onClick={() => setTopicMode('fromCsv')}
            className={topicMode === 'fromCsv' ? 'btn btn-primary' : 'btn btn-outline'}
          >
            Брать из колонки topic
          </button>
        </div>
        {topicMode === 'fixed' && (
          <input
            type="text"
            value={fixedTopic}
            onChange={(e) => setFixedTopic(e.target.value)}
            className="input"
            style={{ marginBottom: '16px' }}
            placeholder="Например: Кардиология"
          />
        )}

        <label className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Номер блока
        </label>
        <div className="nav-row" style={{ marginTop: 0, marginBottom: '8px' }}>
          <button
            onClick={() => setBlockMode('fixed')}
            className={blockMode === 'fixed' ? 'btn btn-primary' : 'btn btn-outline'}
          >
            Один блок на весь файл
          </button>
          <button
            onClick={() => setBlockMode('fromCsv')}
            className={blockMode === 'fromCsv' ? 'btn btn-primary' : 'btn btn-outline'}
          >
            Брать из колонки block_number
          </button>
        </div>
        {blockMode === 'fixed' && (
          <input
            type="number"
            value={fixedBlock}
            onChange={(e) => setFixedBlock(e.target.value)}
            className="input"
          />
        )}
      </div>

      {parseError && <p className="error-text">{parseError}</p>}

      {rows.length > 0 && !parseError && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <p style={{ fontWeight: 700, marginBottom: '10px' }}>
            Найдено строк: {rows.length}. Первые {preview.length} для проверки:
          </p>
          {preview.map((r, i) => (
            <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>{r.question_text}</p>
              <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                a) {r.option_a} · b) {r.option_b} · c) {r.option_c} · d) {r.option_d} · верный: {r.correct_answer}
              </p>
            </div>
          ))}

          <button onClick={handleImport} disabled={importing} className="btn btn-primary">
            {importing
              ? `Загрузка... ${progress?.done ?? 0}/${progress?.total ?? 0}`
              : `Импортировать ${rows.length} вопросов`}
          </button>
        </div>
      )}

      {resultMessage && <p className="success-text">{resultMessage}</p>}
      {importErrors.map((e, i) => (
        <p key={i} className="error-text">
          {e}
        </p>
      ))}
    </div>
  )
}
