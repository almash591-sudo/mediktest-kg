import { supabase } from '../lib/supabaseClient'
import QuestionList from './components/QuestionList'

export default async function Home() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')

  if (error) {
    return <div>Ошибка: {error.message}</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Тестирование</h1>
      <QuestionList questions={questions} />
    </div>
  )
}
