import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'

type Page = 'inicio' | 'biblia' | 'anotacoes' | 'habitos'
type Note = { id: string; title: string; body: string; date: string }
type Habit = { id: string; name: string; detail: string; done: boolean }
const starterHabits: Habit[] = [
  { id: 'devocional', name: 'Devocional', detail: 'Separar um tempo com Deus', done: false },
  { id: 'leitura', name: 'Leitura', detail: 'Ler algumas páginas', done: false },
  { id: 'agua', name: 'Beber água', detail: 'Cuidar do corpo durante o dia', done: false },
  { id: 'organizar', name: 'Organizar o espaço', detail: 'Deixar o ambiente pronto', done: false },
]
const books = [
  { name: 'Gênesis', chapters: 50 }, { name: 'Êxodo', chapters: 40 }, { name: 'Salmos', chapters: 150 },
  { name: 'Provérbios', chapters: 31 }, { name: 'Isaías', chapters: 66 }, { name: 'Mateus', chapters: 28 },
  { name: 'Marcos', chapters: 16 }, { name: 'Lucas', chapters: 24 }, { name: 'João', chapters: 21 },
  { name: 'Romanos', chapters: 16 }, { name: 'Efésios', chapters: 6 }, { name: 'Apocalipse', chapters: 22 },
]
const verseText = 'Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.'
const today = () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
function readStorage<T,>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}

export default function App() {
  const [page, setPage] = useState<Page>('inicio')
  const [notes, setNotes] = useState<Note[]>(() => readStorage('star-room-notes-v1', []))
  const [habits, setHabits] = useState<Habit[]>(() => readStorage('star-room-habits-v1', starterHabits))
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [search, setSearch] = useState('')
  const [book, setBook] = useState('João')
  const [chapter, setChapter] = useState(1)
  const [verseMark, setVerseMark] = useState(false)
  const [toast, setToast] = useState('')
  useEffect(() => { localStorage.setItem('star-room-notes-v1', JSON.stringify(notes)) }, [notes])
  useEffect(() => { localStorage.setItem('star-room-habits-v1', JSON.stringify(habits)) }, [habits])
  const filteredNotes = useMemo(() => notes.filter(note => (note.title + ' ' + note.body).toLowerCase().includes(search.toLowerCase())), [notes, search])
  const completed = habits.filter(habit => habit.done).length
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200) }
  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!noteTitle.trim() && !noteBody.trim()) return
    setNotes(current => [{ id: crypto.randomUUID(), title: noteTitle.trim() || 'Nota sem título', body: noteBody.trim(), date: new Date().toISOString() }, ...current])
    setNoteTitle(''); setNoteBody(''); showToast('Nota guardada')
  }
  function toggleHabit(id: string) { setHabits(current => current.map(habit => habit.id === id ? { ...habit, done: !habit.done } : habit)) }
  function addHabit() {
    const name = window.prompt('Qual hábito queres acompanhar?')
    if (name?.trim()) setHabits(current => [...current, { id: crypto.randomUUID(), name: name.trim(), detail: 'Um passo de cada vez', done: false }])
  }
  function openPage(next: Page) { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <main className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => openPage('inicio')} aria-label="Ir ao início"><span className="brand-mark">✳</span><span>STAR <b>ROOM</b><small>teu espaço pessoal</small></span></button>
      <span className="nav-label">ESPAÇO</span>
      <nav className="main-nav" aria-label="Navegação principal">
        {([{ id: 'inicio', icon: '⌂', label: 'Visão geral' }, { id: 'biblia', icon: '▤', label: 'Bíblia' }, { id: 'anotacoes', icon: '✎', label: 'Anotações' }, { id: 'habitos', icon: '◷', label: 'Hábitos' }] as const).map(item => <button key={item.id} className={page === item.id ? 'nav-item active' : 'nav-item'} onClick={() => openPage(item.id)}><span>{item.icon}</span>{item.label}{page === item.id && <i />}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="mini-orbit"><span>✦</span></div><p>Um lugar para desacelerar e voltar ao que importa.</p><span className="local-label"><i /> Os teus dados ficam neste dispositivo</span></div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><span className="breadcrumb">STAR ROOM <span>/</span> {({ inicio: 'VISÃO GERAL', biblia: 'BÍBLIA', anotacoes: 'ANOTAÇÕES', habitos: 'HÁBITOS' } as Record<Page, string>)[page]}</span><h1>{({ inicio: 'O teu espaço.', biblia: 'Tempo na Palavra.', anotacoes: 'Tira as ideias da cabeça.', habitos: 'Pequenos passos contam.' } as Record<Page, string>)[page]}</h1></div><div className="top-date"><span className="date-dot" />{today()}</div></header>
      {page === 'inicio' && <div className="page-content home-page">
        <section className="welcome-panel"><div className="welcome-copy"><span className="eyebrow"><span className="eyebrow-line" /> UM ESPAÇO SÓ TEU</span><h2>Respira.<br /><em>Recomeça</em> com calma.</h2><p>Um lugar para alimentar a fé, organizar pensamentos e construir uma rotina que faça sentido.</p><button className="primary-button" onClick={() => openPage('biblia')}>Abrir a Bíblia <span>↗</span></button></div><div className="welcome-art" aria-hidden="true"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-star">✳</div><div className="art-book"><div className="book-cover"><span>HOLY<br />BIBLE</span><i>✦</i></div><div className="book-pages" /></div><span className="art-caption">PAZ · PRESENÇA · PROPÓSITO</span></div><div className="panel-index">01 / 04</div></section>
        <div className="section-heading"><div><span className="eyebrow">O TEU CANTO</span><h2>O que vamos cuidar hoje?</h2></div><span className="subtle">Escolhe por onde começar</span></div>
        <div className="feature-grid">
          <button className="feature-card feature-bible" onClick={() => openPage('biblia')}><span className="card-icon">▤</span><span className="card-number">01</span><h3>Palavra</h3><p>Um momento para ler, refletir e guardar o que falou contigo.</p><span className="card-link">Continuar leitura <b>↗</b></span><span className="card-decoration bible-decoration">✧</span></button>
          <button className="feature-card feature-notes" onClick={() => openPage('anotacoes')}><span className="card-icon">✎</span><span className="card-number">02</span><h3>Anotações</h3><p>Ideias, orações e pensamentos num só lugar.</p><span className="card-link">Escrever uma nota <b>↗</b></span><span className="card-decoration note-decoration">“</span></button>
          <button className="feature-card feature-habits" onClick={() => openPage('habitos')}><span className="card-icon">◷</span><span className="card-number">03</span><h3>Hábitos</h3><p>Constrói consistência sem tentar mudar tudo de uma vez.</p><span className="card-link">Ver o teu progresso <b>↗</b></span><span className="habit-ring-small">{Math.round(completed / Math.max(habits.length, 1) * 100)}<small>%</small></span></button>
        </div>
        <div className="bottom-grid"><section className="verse-panel"><div className="verse-top"><span className="eyebrow">PALAVRA PARA HOJE</span><span className="verse-mark">✦</span></div><blockquote>“{verseText}”</blockquote><span className="verse-reference">SALMOS 119:105</span><div className="verse-bottom"><span>Uma verdade de cada vez.</span><button onClick={() => { navigator.clipboard?.writeText(verseText); showToast('Versículo copiado') }}>Copiar versículo ↗</button></div></section><section className="progress-panel"><div className="progress-title"><span className="eyebrow">HOJE</span><span>{completed}/{habits.length}</span></div><h3>O teu ritmo, não a pressa.</h3><p>Não precisas fazer tudo. Só continuar.</p><div className="progress-track"><span style={{ width: `${habits.length ? completed / habits.length * 100 : 0}%` }} /></div><button className="text-button" onClick={() => openPage('habitos')}>Ver hábitos <span>→</span></button></section></div>
      </div>}
      {page === 'biblia' && <div className="page-content bible-page"><div className="page-intro"><span className="eyebrow">LEITURA E REFLEXÃO</span><p>Vai com calma. Lê um trecho, observa o que chama a tua atenção e guarda a mensagem.</p></div><section className="reading-panel"><div className="reading-toolbar"><label>Livro<select value={book} onChange={event => { setBook(event.target.value); setChapter(1); setVerseMark(false) }}>{books.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label><label>Capítulo<select value={chapter} onChange={event => { setChapter(Number(event.target.value)); setVerseMark(false) }}>{Array.from({ length: books.find(item => item.name === book)?.chapters ?? 1 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label><span className="reading-badge">LEITURA PESSOAL</span></div><div className="reading-paper"><span className="paper-kicker">SAGRADAS ESCRITURAS</span><h2>{book} <span>{chapter}</span></h2><div className="paper-rule" /><p className={verseMark ? 'sample-verse marked' : 'sample-verse'}><sup>1</sup>{book === 'Salmos' && chapter === 23 ? 'O Senhor é o meu pastor; nada me faltará.' : book === 'João' && chapter === 1 ? 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.' : 'A tua palavra é luz para o meu caminho. Lê, medita e procura compreender o que este capítulo te ensina.'}</p><p className="sample-note">Este espaço é uma demonstração de leitura. Para apresentar o texto integral e a tradução escolhida, é necessário ligar uma fonte bíblica licenciada.</p><button className={verseMark ? 'mark-button is-marked' : 'mark-button'} onClick={() => setVerseMark(!verseMark)}>{verseMark ? '✓ Trecho marcado' : '＋ Marcar este trecho'}</button></div><div className="reading-footer"><span>Um momento de silêncio também faz parte da leitura.</span><button onClick={() => openPage('anotacoes')}>Guardar uma reflexão ↗</button></div></section></div>}
      {page === 'anotacoes' && <div className="page-content notes-page"><div className="page-intro"><span className="eyebrow">CADERNO PESSOAL</span><p>Guarda ideias, aprendizados, orações e coisas que não queres esquecer.</p></div><form className="note-composer" onSubmit={saveNote}><span className="eyebrow">NOVA NOTA</span><input value={noteTitle} onChange={event => setNoteTitle(event.target.value)} placeholder="Dá um título à tua ideia..." aria-label="Título da nota" /><textarea value={noteBody} onChange={event => setNoteBody(event.target.value)} placeholder="Escreve aqui. Não precisa ficar perfeito..." aria-label="Texto da nota" rows={4} /><div className="composer-footer"><span>As notas são guardadas neste dispositivo.</span><button className="primary-button" type="submit">Guardar nota <span>↗</span></button></div></form><div className="notes-heading"><div><span className="eyebrow">O TEU CADERNO</span><h2>{notes.length} {notes.length === 1 ? 'nota guardada' : 'notas guardadas'}</h2></div><input className="search-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar notas..." aria-label="Pesquisar notas" /></div>{filteredNotes.length ? <div className="notes-grid">{filteredNotes.map(note => <article className="note-card" key={note.id}><div className="note-card-top"><span>✳ NOTA PESSOAL</span><button aria-label="Apagar nota" onClick={() => setNotes(current => current.filter(item => item.id !== note.id))}>×</button></div><h3>{note.title}</h3><p>{note.body || 'Sem texto adicional.'}</p><time>{new Date(note.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</time></article>)}</div> : <div className="empty-state"><span>✎</span><h3>O caderno começa com uma ideia.</h3><p>{search ? 'Não encontrámos notas com essa pesquisa.' : 'Quando guardares a tua primeira nota, ela aparece aqui.'}</p></div>}</div>}
      {page === 'habitos' && <div className="page-content habits-page"><div className="page-intro"><span className="eyebrow">CONSTÂNCIA COM LEVEZA</span><p>Pequenas ações repetidas valem mais do que um plano perfeito que não sai do papel.</p></div><section className="habits-summary"><div><span className="eyebrow">PROGRESSO DE HOJE</span><h2>{completed === habits.length && habits.length ? 'Dia concluído.' : 'Cada passo conta.'}</h2><p>{completed} de {habits.length} hábitos concluídos</p></div><div className="progress-ring" style={{ '--progress': `${habits.length ? completed / habits.length * 100 : 0}%` } as React.CSSProperties}><div><strong>{Math.round(habits.length ? completed / habits.length * 100 : 0)}%</strong><span>HOJE</span></div></div></section><div className="habit-list-heading"><div><span className="eyebrow">A TUA LISTA</span><h2>Rotina diária</h2></div><button className="secondary-button" onClick={addHabit}>＋ Novo hábito</button></div><div className="habit-list">{habits.map((habit, index) => <article className={habit.done ? 'habit-row done' : 'habit-row'} key={habit.id}><button className="habit-check" onClick={() => toggleHabit(habit.id)} aria-label={habit.done ? 'Desmarcar hábito' : 'Marcar hábito'}>{habit.done ? '✓' : ''}</button><span className="habit-index">0{index + 1}</span><div className="habit-copy"><h3>{habit.name}</h3><p>{habit.detail}</p></div><span className={habit.done ? 'habit-status complete' : 'habit-status'}>{habit.done ? 'Concluído' : 'Pendente'}</span><button className="habit-remove" aria-label={`Remover hábito ${habit.name}`} onClick={() => setHabits(current => current.filter(item => item.id !== habit.id))}>×</button></article>)}</div><button className="reset-day" onClick={() => setHabits(current => current.map(habit => ({ ...habit, done: false })))}>Reiniciar marcações do dia ↺</button></div>}
      <footer className="workspace-footer"><span>STAR ROOM <i>✳</i></span><span>Feito para voltar ao que importa.</span></footer>
    </section>
    {toast && <div className="toast" role="status">✓ &nbsp; {toast}</div>}
  </main>
}
