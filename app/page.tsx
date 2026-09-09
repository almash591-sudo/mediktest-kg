import { supabase } from '../lib/supabaseClient'

export default async function Home() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')

  if (error) {
    return <div>Ошибка: {error.message}</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Вопросы</h1>
      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: '20px' }}>
          <p><b>{q.question_text}</b></p>
          <p>a) {q.option_a}</p>
          <p>b) {q.option_b}</p>
          <p>c) {q.option_c}</p>
          <p>d) {q.option_d}</p>
        </div>
      ))}
    </div>
  )
}
