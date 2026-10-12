import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ClipboardEvent, type CSSProperties } from 'react'
import './App.css'

type Page = 'inicio' | 'biblia' | 'anotacoes' | 'habitos' | 'ajustes'
type Category = string
type HighlightColor = 'gold' | 'blue' | 'pink' | 'violet'
type Note = { id: number; title: string; category: Category; content: string; updatedAt: number }
type Habit = { id: number; name: string; detail: string; done: boolean; kind?: string }
type Book = { id: number; name: string; abbreviation: string; chapters: number; testament: 'OT' | 'NT' }
type Verse = { verse: number; text: string }
type VerseSelection = { key: string; reference: string; number: number; text: string } | null
type Appearance = {
  atmosphere: 'journal' | 'pixel' | 'cozy'
  titleFont: 'pixel' | 'silkscreen' | 'press-start' | 'vt323' | 'editorial' | 'rounded' | 'space'
  bodyFont: 'sans' | 'serif' | 'mono' | 'professional' | 'handwritten'
  bibleLayout: 'study-notebook' | 'spread' | 'single-page' | 'classic'
  jesusStyle: 'margin' | 'red' | 'blue'
  habitLayout: 'journal' | 'weekly' | 'pixels'
  elements: 'symbolic' | 'pixel' | 'sketch'
  palette: 'custom' | 'night-gold' | 'paper'
  shadows: 'soft' | 'none' | 'deep'
  panelShape: 'soft' | 'square' | 'pill'
  motion: 'reveal' | 'gentle' | 'minimal'
  paperTexture: 'dots' | 'lines' | 'plain'
  readingSize: number
  homeTagline: string
  colors: { background: string; surface: string; paper: string; accent: string; secondary: string; text: string; muted: string; paperText: string }
}

const defaultAppearance: Appearance = {
  atmosphere: 'journal', titleFont: 'pixel', bodyFont: 'sans', bibleLayout: 'study-notebook',
  jesusStyle: 'margin', habitLayout: 'journal', elements: 'symbolic', palette: 'custom',
  shadows: 'soft', panelShape: 'soft', motion: 'reveal', paperTexture: 'dots', readingSize: 18,
  homeTagline: 'Um lugar para as tuas ideias.',
  colors: { background: '#080808', surface: '#171717', paper: '#ece9e2', accent: '#e8e6e1', secondary: '#858585', text: '#f4f2ed', muted: '#aaa7a1', paperText: '#242424' },
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialFolders: Category[] = ['Devocional', 'Célula', 'Aula IV', 'outros...']
const fallbackDailyVerse = 'Será como árvore plantada junto a ribeiros de águas, que dá fruto no tempo certo.'
const penModelViewerUrl = 'https://www.innerscene.com/tools/3d-viewer?url=https%3A%2F%2Fwww.innerscene.com%2Fapi%2Flibrary%2Fnib-pen-writing-instrument-f4ed7ea9%2Fdownload&embedded=1'
type FocusedObject = 'bible' | 'notes' | 'goals' | 'tracker'
// This is only a preview built from the user's existing Canva sample. It is never labeled as official NVI text.
const canvaPsalm23Preview: Verse[] = [
  { verse: 1, text: 'O Senhor é o meu pastor, nada me faltará.' },
  { verse: 2, text: 'Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.' },
  { verse: 3, text: 'Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.' },
  { verse: 4, text: 'Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.' },
  { verse: 5, text: 'Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda.' },
  { verse: 6, text: 'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias.' },
]
const fallbackBooks: Book[] = [
  { id: 1, name: 'Gênesis', abbreviation: 'Gn', chapters: 50, testament: 'OT' },
  { id: 2, name: 'Êxodo', abbreviation: 'Ex', chapters: 40, testament: 'OT' },
  { id: 3, name: 'Levítico', abbreviation: 'Lv', chapters: 27, testament: 'OT' },
  { id: 4, name: 'Números', abbreviation: 'Nm', chapters: 36, testament: 'OT' },
  { id: 5, name: 'Deuteronômio', abbreviation: 'Dt', chapters: 34, testament: 'OT' },
  { id: 6, name: 'Josué', abbreviation: 'Js', chapters: 24, testament: 'OT' },
  { id: 7, name: 'Juízes', abbreviation: 'Jz', chapters: 21, testament: 'OT' },
  { id: 8, name: 'Rute', abbreviation: 'Rt', chapters: 4, testament: 'OT' },
  { id: 9, name: '1 Samuel', abbreviation: '1Sm', chapters: 31, testament: 'OT' },
  { id: 10, name: '2 Samuel', abbreviation: '2Sm', chapters: 24, testament: 'OT' },
  { id: 11, name: '1 Reis', abbreviation: '1Rs', chapters: 22, testament: 'OT' },
  { id: 12, name: '2 Reis', abbreviation: '2Rs', chapters: 25, testament: 'OT' },
  { id: 13, name: '1 Crônicas', abbreviation: '1Cr', chapters: 29, testament: 'OT' },
  { id: 14, name: '2 Crônicas', abbreviation: '2Cr', chapters: 36, testament: 'OT' },
  { id: 15, name: 'Esdras', abbreviation: 'Ed', chapters: 10, testament: 'OT' },
  { id: 16, name: 'Neemias', abbreviation: 'Ne', chapters: 13, testament: 'OT' },
  { id: 17, name: 'Ester', abbreviation: 'Et', chapters: 10, testament: 'OT' },
  { id: 18, name: 'Jó', abbreviation: 'Jó', chapters: 42, testament: 'OT' },
  { id: 19, name: 'Salmos', abbreviation: 'Sl', chapters: 150, testament: 'OT' },
  { id: 20, name: 'Provérbios', abbreviation: 'Pv', chapters: 31, testament: 'OT' },
  { id: 21, name: 'Eclesiastes', abbreviation: 'Ec', chapters: 12, testament: 'OT' },
  { id: 22, name: 'Cântico dos Cânticos', abbreviation: 'Ct', chapters: 8, testament: 'OT' },
  { id: 23, name: 'Isaías', abbreviation: 'Is', chapters: 66, testament: 'OT' },
  { id: 24, name: 'Jeremias', abbreviation: 'Jr', chapters: 52, testament: 'OT' },
  { id: 25, name: 'Lamentações', abbreviation: 'Lm', chapters: 5, testament: 'OT' },
  { id: 26, name: 'Ezequiel', abbreviation: 'Ez', chapters: 48, testament: 'OT' },
  { id: 27, name: 'Daniel', abbreviation: 'Dn', chapters: 12, testament: 'OT' },
  { id: 28, name: 'Oséias', abbreviation: 'Os', chapters: 14, testament: 'OT' },
  { id: 29, name: 'Joel', abbreviation: 'Jl', chapters: 3, testament: 'OT' },
  { id: 30, name: 'Amós', abbreviation: 'Am', chapters: 9, testament: 'OT' },
  { id: 31, name: 'Obadias', abbreviation: 'Ob', chapters: 1, testament: 'OT' },
  { id: 32, name: 'Jonas', abbreviation: 'Jn', chapters: 4, testament: 'OT' },
  { id: 33, name: 'Miquéias', abbreviation: 'Mq', chapters: 7, testament: 'OT' },
  { id: 34, name: 'Naum', abbreviation: 'Na', chapters: 3, testament: 'OT' },
  { id: 35, name: 'Habacuque', abbreviation: 'Hc', chapters: 3, testament: 'OT' },
  { id: 36, name: 'Sofonias', abbreviation: 'Sf', chapters: 3, testament: 'OT' },
  { id: 37, name: 'Ageu', abbreviation: 'Ag', chapters: 2, testament: 'OT' },
  { id: 38, name: 'Zacarias', abbreviation: 'Zc', chapters: 14, testament: 'OT' },
  { id: 39, name: 'Malaquias', abbreviation: 'Ml', chapters: 4, testament: 'OT' },
  { id: 40, name: 'Mateus', abbreviation: 'Mt', chapters: 28, testament: 'NT' },
  { id: 41, name: 'Marcos', abbreviation: 'Mc', chapters: 16, testament: 'NT' },
  { id: 42, name: 'Lucas', abbreviation: 'Lc', chapters: 24, testament: 'NT' },
  { id: 43, name: 'João', abbreviation: 'Jo', chapters: 21, testament: 'NT' },
  { id: 44, name: 'Atos', abbreviation: 'At', chapters: 28, testament: 'NT' },
  { id: 45, name: 'Romanos', abbreviation: 'Rm', chapters: 16, testament: 'NT' },
  { id: 46, name: '1 Coríntios', abbreviation: '1Co', chapters: 16, testament: 'NT' },
  { id: 47, name: '2 Coríntios', abbreviation: '2Co', chapters: 13, testament: 'NT' },
  { id: 48, name: 'Gálatas', abbreviation: 'Gl', chapters: 6, testament: 'NT' },
  { id: 49, name: 'Efésios', abbreviation: 'Ef', chapters: 6, testament: 'NT' },
  { id: 50, name: 'Filipenses', abbreviation: 'Fp', chapters: 4, testament: 'NT' },
  { id: 51, name: 'Colossenses', abbreviation: 'Cl', chapters: 4, testament: 'NT' },
  { id: 52, name: '1 Tessalonicenses', abbreviation: '1Ts', chapters: 5, testament: 'NT' },
  { id: 53, name: '2 Tessalonicenses', abbreviation: '2Ts', chapters: 3, testament: 'NT' },
  { id: 54, name: '1 Timóteo', abbreviation: '1Tm', chapters: 6, testament: 'NT' },
  { id: 55, name: '2 Timóteo', abbreviation: '2Tm', chapters: 4, testament: 'NT' },
  { id: 56, name: 'Tito', abbreviation: 'Tt', chapters: 3, testament: 'NT' },
  { id: 57, name: 'Filemom', abbreviation: 'Fm', chapters: 1, testament: 'NT' },
  { id: 58, name: 'Hebreus', abbreviation: 'Hb', chapters: 13, testament: 'NT' },
  { id: 59, name: 'Tiago', abbreviation: 'Tg', chapters: 5, testament: 'NT' },
  { id: 60, name: '1 Pedro', abbreviation: '1Pe', chapters: 5, testament: 'NT' },
  { id: 61, name: '2 Pedro', abbreviation: '2Pe', chapters: 3, testament: 'NT' },
  { id: 62, name: '1 João', abbreviation: '1Jo', chapters: 5, testament: 'NT' },
  { id: 63, name: '2 João', abbreviation: '2Jo', chapters: 1, testament: 'NT' },
  { id: 64, name: '3 João', abbreviation: '3Jo', chapters: 1, testament: 'NT' },
  { id: 65, name: 'Judas', abbreviation: 'Jd', chapters: 1, testament: 'NT' },
  { id: 66, name: 'Apocalipse', abbreviation: 'Ap', chapters: 22, testament: 'NT' },
]

const seedNotes: Note[] = [{
  id: 1,
  title: 'O que é propósito?',
  category: 'Devocional',
  content: '<p>Propósito é a razão e direção que Deus dá à nossa vida.</p><p>Não significa necessariamente descobrir imediatamente qual será minha profissão, com quem vou casar, onde vou morar ou qual ministério vou exercer.</p><p>Antes de descobrir o que fazer, precisamos entender quem Deus quer que sejamos.</p><p>Propósito não começa com “o que vou fazer?”, mas com “quem estou me tornando diante de Deus?”</p>',
  updatedAt: Date.now() - 86_400_000,
}]
const seedHabits: Habit[] = [
  { id: 1, name: 'Devocional', detail: 'Um momento para Deus', done: false, kind: 'Fé' },
  { id: 2, name: 'Leitura bíblica', detail: 'Ler um trecho e refletir', done: false, kind: 'Fé' },
  { id: 3, name: 'Beber água', detail: 'Fazer pausas para me hidratar', done: false, kind: 'Saúde' },
  { id: 4, name: 'Estudar 25 minutos', detail: 'Uma sessão de foco', done: false, kind: 'Estudo' },
  { id: 5, name: 'Movimentar o corpo', detail: 'Caminhar, pedalar ou alongar', done: false, kind: 'Saúde' },
  { id: 6, name: 'Arrumar o quarto', detail: 'Deixar o meu espaço agradável', done: false, kind: 'Casa' },
  { id: 7, name: 'Planejar o dia', detail: 'Definir uma prioridade', done: false, kind: 'Rotina' },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function safeNoteHtml(value: string) {
  if (!value) return ''
  if (!/<\/?[a-z][\s\S]*>/i.test(value)) return escapeHtml(value).replace(/\n/g, '<br>')
  const parsed = new DOMParser().parseFromString(value, 'text/html')
  const allowed = new Set(['DIV', 'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI', 'H1', 'H2', 'BLOCKQUOTE', 'SPAN'])
  const clean = (source: Node, target: Node) => {
    if (source.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(source.textContent ?? ''))
      return
    }
    if (!(source instanceof HTMLElement)) return
    if (!allowed.has(source.tagName)) {
      source.childNodes.forEach(child => clean(child, target))
      return
    }
    const safe = document.createElement(source.tagName.toLowerCase())
    source.childNodes.forEach(child => clean(child, safe))
    target.appendChild(safe)
  }
  const output = document.createElement('div')
  parsed.body.childNodes.forEach(node => clean(node, output))
  return output.innerHTML
}

async function getJson(path: string) {
  const response = await fetch(path, { headers: { Accept: 'application/json' } })
  const raw = await response.text()
  let body: unknown = {}
  try { body = raw ? JSON.parse(raw) : {} } catch { body = { error: raw } }
  if (!response.ok) {
    const item = body as { error?: string; message?: string }
    throw new Error(item.message || item.error || `A API respondeu com status ${response.status}.`)
  }
  return body as Record<string, unknown> | unknown[]
}

function extractVerses(payload: unknown): Verse[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Verse => typeof item === 'object' && item !== null && 'verse' in item && 'text' in item)
  if (typeof payload === 'object' && payload !== null) {
    const object = payload as { verses?: unknown; data?: { verses?: unknown } }
    const verses = Array.isArray(object.verses) ? object.verses : Array.isArray(object.data?.verses) ? object.data.verses : []
    return verses.filter((item): item is Verse => typeof item === 'object' && item !== null && 'verse' in item && 'text' in item)
  }
  return []
}

function App() {
  const [page, setPage] = useState<Page>('inicio')
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null)
  const [focusedObject, setFocusedObject] = useState<FocusedObject | null>(null)
  const [launchingSection, setLaunchingSection] = useState<string | null>(null)
  const launchTimer = useRef<number | null>(null)
  const [bibleBookOpen, setBibleBookOpen] = useState(false)
  const [bibleOpening, setBibleOpening] = useState(false)
  const [bookTilt, setBookTilt] = useState({ x: 0, y: 0 })
  const bookPointerStart = useRef<{ x: number; y: number; dragged: boolean } | null>(null)
  const bookDragRef = useRef(false)
  const bibleOpenTimer = useRef<number | null>(null)
  const thisMonthKey = localDateKey(new Date()).slice(0, 7)
  const [habitMonth, setHabitMonth] = useState<string>(() => load('star-room-habit-month', thisMonthKey))
  const [appearance, setAppearance] = useState<Appearance>(() => {
    const saved = load<Partial<Appearance>>('star-room-appearance', {})
    const colors = { ...defaultAppearance.colors, ...(saved.colors ?? {}) }
    // Migrate previous default blue/gold choices to ink-and-paper without overwriting custom colors.
    if (saved.colors?.accent?.toLowerCase() === '#9fc7fa') colors.accent = '#e8e6e1'
    if (saved.colors?.secondary?.toLowerCase() === '#c9a95f') colors.secondary = '#858585'
    if (saved.colors?.background?.toLowerCase() === '#070b13') colors.background = '#080808'
    if (saved.colors?.surface?.toLowerCase() === '#121b29') colors.surface = '#171717'
    return { ...defaultAppearance, ...saved, colors }
  })
  const [habitHistory, setHabitHistory] = useState<Record<string, string[]>>(() => {
    const stored = load<Record<string, string[]>>('star-room-habit-log', {})
    const oldHabits = load<Habit[]>('star-room-habits', seedHabits)
    const today = localDateKey(new Date())
    const migrated = { ...stored }
    oldHabits.filter(habit => habit.done).forEach(habit => {
      const id = String(habit.id)
      migrated[id] = Array.from(new Set([...(migrated[id] ?? []), today]))
    })
    return migrated
  })
  const [jesusVerses, setJesusVerses] = useState<string[]>(() => load('star-room-jesus-verses', []))
  const [notes, setNotes] = useState<Note[]>(() => load('star-room-notes', seedNotes))
  const [folders, setFolders] = useState<Category[]>(() => load('star-room-folders', initialFolders))
  const [addingFolder, setAddingFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [habits, setHabits] = useState<Habit[]>(() => load('star-room-habits', seedHabits))
  const [category, setCategory] = useState<Category>('Devocional')
  const [activeNoteId, setActiveNoteId] = useState<number | null>(() => load<Note[]>('star-room-notes', seedNotes)[0]?.id ?? 1)
  const [noteSearch, setNoteSearch] = useState('')
  const [books, setBooks] = useState<Book[]>(fallbackBooks)
  const [bookId, setBookId] = useState<number>(() => load('star-room-progress-v2', { bookId: 19, chapter: 23 }).bookId)
  const [chapter, setChapter] = useState<number>(() => load('star-room-progress-v2', { bookId: 19, chapter: 23 }).chapter)
  const [verses, setVerses] = useState<Verse[]>([])
  const [selectedVerse, setSelectedVerse] = useState<VerseSelection>(null)
  const [highlights, setHighlights] = useState<Record<string, HighlightColor>>(() => load('star-room-highlights', {}))
  const [bookmarks, setBookmarks] = useState<string[]>(() => load('star-room-bookmarks', []))
  const [apiReady, setApiReady] = useState(false)
  const [apiStatusLoaded, setApiStatusLoaded] = useState(false)
  const [bibleLoading, setBibleLoading] = useState(false)
  const [reloadChapter, setReloadChapter] = useState(0)
  const [bibleError, setBibleError] = useState('')
  const [showSetupHelp, setShowSetupHelp] = useState(false)
  const [toast, setToast] = useState('')
  const [dailyVerse, setDailyVerse] = useState('')
  const [chapterNotes, setChapterNotes] = useState<Record<string, string>>(() => load('star-room-chapter-notes', {}))
  const [dailyVerseLoading, setDailyVerseLoading] = useState(false)
  const [habitInput, setHabitInput] = useState('')
  const [habitDetailInput, setHabitDetailInput] = useState('')
  const [habitKindInput, setHabitKindInput] = useState('Rotina')
  const [addHabitOpen, setAddHabitOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const currentBook = books.find(book => book.id === bookId) ?? fallbackBooks.find(book => book.id === bookId) ?? fallbackBooks[18]
  const chapterNoteKey = `${currentBook.abbreviation}-${chapter}`
  const linkedChapterNotes = notes.filter(note => note.title.startsWith(`${currentBook.name} ${chapter}:`)).sort((a, b) => b.updatedAt - a.updatedAt)
  const activeNote = notes.find(note => note.id === activeNoteId) ?? null
  const categoryNotes = useMemo(() => notes
    .filter(note => note.category === category)
    .filter(note => `${note.title} ${note.content.replace(/<[^>]*>/g, ' ')}`.toLowerCase().includes(noteSearch.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt), [notes, category, noteSearch])
  const doneHabits = habits.filter(habit => habit.done).length
  const completion = habits.length ? Math.round(doneHabits / habits.length * 100) : 0
  const currentDateKey = localDateKey(new Date())
  const monthDays = useMemo(() => {
    const [rawYear, rawMonth] = habitMonth.split('-').map(Number)
    const year = Number.isFinite(rawYear) && rawYear > 1970 ? rawYear : new Date().getFullYear()
    const month = Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : new Date().getMonth() + 1
    const total = new Date(year, month, 0).getDate()
    return Array.from({ length: total }, (_, index) => {
      const date = new Date(year, month - 1, index + 1)
      return { key: localDateKey(date), label: String(index + 1), weekday: date.toLocaleDateString('pt-BR', { weekday: 'narrow' }) }
    })
  }, [habitMonth])
  const habitDisplayDays = useMemo(() => {
    if (appearance.habitLayout !== 'weekly') return monthDays
    const [year, month] = habitMonth.split('-').map(Number)
    const anchor = habitMonth === thisMonthKey ? new Date() : new Date(year, month - 1, 1)
    const anchorDay = habitMonth === thisMonthKey ? anchor.getDate() : 7
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(year, month - 1, anchorDay - 6 + index)
      return { key: localDateKey(date), label: String(date.getDate()), weekday: date.toLocaleDateString('pt-BR', { weekday: 'narrow' }) }
    })
  }, [monthDays, appearance.habitLayout, habitMonth, thisMonthKey])
  const [habitYear, habitMonthNumber] = habitMonth.split('-').map(Number)
  const selectedMonthLabel = new Date(habitYear || new Date().getFullYear(), (habitMonthNumber || (new Date().getMonth() + 1)) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const habitTrend = useMemo(() => habitDisplayDays.map(day => {
    const count = habits.filter(habit => (habitHistory[String(habit.id)] ?? []).includes(day.key) || (day.key === currentDateKey && habit.done)).length
    return { ...day, count, percent: habits.length ? Math.round(count / habits.length * 100) : 0 }
  }), [habitDisplayDays, habits, habitHistory, currentDateKey])
  const fontHeading = appearance.titleFont === 'pixel' ? '"Pixelify Sans", monospace' : appearance.titleFont === 'silkscreen' ? '"Silkscreen", monospace' : appearance.titleFont === 'press-start' ? '"Press Start 2P", monospace' : appearance.titleFont === 'vt323' ? '"VT323", monospace' : appearance.titleFont === 'editorial' ? '"Lora", Georgia, serif' : appearance.titleFont === 'space' ? '"Space Grotesk", sans-serif' : '"DM Sans", sans-serif'
  const fontBody = appearance.bodyFont === 'serif' ? '"Lora", Georgia, serif' : appearance.bodyFont === 'mono' ? '"DM Mono", monospace' : appearance.bodyFont === 'professional' ? '"Space Grotesk", sans-serif' : appearance.bodyFont === 'handwritten' ? '"Caveat", cursive' : '"DM Sans", Inter, sans-serif'
  const rootStyle = {
    '--space': appearance.colors.background,
    '--surface': appearance.colors.surface,
    '--surface-strong': appearance.colors.surface,
    '--paper': appearance.colors.paper,
    '--accent': appearance.colors.accent,
    '--cyan': appearance.colors.accent,
    '--blue': appearance.colors.accent,
    '--accent-secondary': appearance.colors.secondary,
    '--ink': appearance.colors.text,
    '--muted': appearance.colors.muted,
    '--paper-text': appearance.colors.paperText,
    '--heading-font': fontHeading,
    '--body-font': fontBody,
    '--panel-radius': appearance.panelShape === 'square' ? '3px' : appearance.panelShape === 'pill' ? '26px' : '14px',
    '--shadow-opacity': appearance.shadows === 'none' ? '0' : appearance.shadows === 'deep' ? '.34' : '.16',
    '--bible-size': `${appearance.readingSize}px`,
  } as CSSProperties

  useEffect(() => {
    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null
    try {
      const canvas = document.createElement('canvas')
      context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    } catch {
      context = null
    }
    setWebglAvailable(Boolean(context))
    if (context) {
      const extension = context.getExtension('WEBGL_lose_context')
      extension?.loseContext()
    }
  }, [])

  useEffect(() => {
    if (!focusedObject) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocusedObject(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [focusedObject])

  useEffect(() => { localStorage.setItem('star-room-notes', JSON.stringify(notes)) }, [notes])
  useEffect(() => { localStorage.setItem('star-room-folders', JSON.stringify(folders)) }, [folders])
  useEffect(() => { localStorage.setItem('star-room-habits', JSON.stringify(habits)) }, [habits])
  useEffect(() => { localStorage.setItem('star-room-appearance', JSON.stringify(appearance)) }, [appearance])
  useEffect(() => { localStorage.setItem('star-room-habit-month', habitMonth) }, [habitMonth])
  useEffect(() => { localStorage.setItem('star-room-habit-log', JSON.stringify(habitHistory)) }, [habitHistory])
  useEffect(() => { localStorage.setItem('star-room-jesus-verses', JSON.stringify(jesusVerses)) }, [jesusVerses])
  useEffect(() => {
    let observer: IntersectionObserver | null = null
    let frameId = 0
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    frameId = window.requestAnimationFrame(() => {
      const items = Array.from(document.querySelectorAll<HTMLElement>('.scroll-reveal'))
      items.forEach(item => item.classList.remove('is-visible'))
      if (appearance.motion !== 'reveal' || prefersReduced || !('IntersectionObserver' in window)) {
        items.forEach(item => item.classList.add('is-visible'))
        return
      }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          }
        })
      }, { threshold: 0.02, rootMargin: '0px 0px -12px 0px' })
      items.forEach(item => {
        if (item.getBoundingClientRect().top < window.innerHeight * 0.92) item.classList.add('is-visible')
        else observer?.observe(item)
      })
    })
    return () => {
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
    }
  }, [page, appearance.motion])
  useEffect(() => {
    // One-time addition of ordinary routine habits to older installs, without overwriting existing records.
    if (localStorage.getItem('star-room-routine-habits-v1') === 'done') return
    const routineDefaults: Habit[] = [
      { id: 101, name: 'Beber água', detail: 'Fazer pausas para hidratar', done: false, kind: 'Saúde' },
      { id: 102, name: 'Estudar 25 minutos', detail: 'Uma sessão de foco', done: false, kind: 'Estudo' },
      { id: 103, name: 'Movimentar o corpo', detail: 'Caminhar, pedalar ou alongar', done: false, kind: 'Saúde' },
      { id: 104, name: 'Arrumar o quarto', detail: 'Deixar o meu espaço agradável', done: false, kind: 'Casa' },
    ]
    setHabits(current => {
      const names = new Set(current.map(habit => habit.name.trim().toLowerCase()))
      return [...current, ...routineDefaults.filter(habit => !names.has(habit.name.toLowerCase()))]
    })
    localStorage.setItem('star-room-routine-habits-v1', 'done')
  }, [])
  useEffect(() => {
    setFolders(current => Array.from(new Set([...current, ...notes.map(note => note.category).filter(Boolean)])))
    // Runs once to keep folders from earlier versions of Star Room available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { localStorage.setItem('star-room-highlights', JSON.stringify(highlights)) }, [highlights])
  useEffect(() => { localStorage.setItem('star-room-bookmarks', JSON.stringify(bookmarks)) }, [bookmarks])
  useEffect(() => { localStorage.setItem('star-room-progress-v2', JSON.stringify({ bookId, chapter })) }, [bookId, chapter])
  useEffect(() => { localStorage.setItem('star-room-chapter-notes', JSON.stringify(chapterNotes)) }, [chapterNotes])
  useEffect(() => { setSelectedVerse(null) }, [bookId, chapter])
  useEffect(() => {
    if (page === 'biblia') {
      setBibleBookOpen(false)
      setBibleOpening(false)
    }
    return () => {
      if (bibleOpenTimer.current !== null) window.clearTimeout(bibleOpenTimer.current)
      bibleOpenTimer.current = null
    }
  }, [page])

  useEffect(() => {
    let active = true
    getJson('/api/bible/status')
      .then(result => { if (active) setApiReady(Boolean((result as { configured?: boolean }).configured)) })
      .catch(() => { if (active) setApiReady(false) })
      .finally(() => { if (active) setApiStatusLoaded(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!apiReady) return
    let active = true
    getJson('/api/bible/books?target_lang=pt')
      .then(payload => {
        if (!active) return
        const rawBooks = Array.isArray(payload) ? payload : (payload as { data?: unknown[] }).data ?? []
        const merged = rawBooks.map(item => {
          const apiBook = item as Partial<Book>
          const fallback = fallbackBooks.find(book => book.id === apiBook.id) ?? fallbackBooks.find(book => book.name === apiBook.name)
          return fallback ? { ...fallback, ...apiBook, chapters: fallback.chapters, testament: (apiBook.testament ?? fallback.testament) as 'OT' | 'NT' } as Book : null
        }).filter((book): book is Book => Boolean(book))
        if (merged.length > 0) setBooks(merged)
      })
      .catch(error => { if (active) setBibleError(error instanceof Error ? error.message : 'Não foi possível carregar os livros.') })
    return () => { active = false }
  }, [apiReady])

  useEffect(() => {
    if (!apiReady) return
    let active = true
    setDailyVerseLoading(true)
    getJson('/api/bible/bibles/nvi/Sl/1?target_lang=pt')
      .then(payload => {
        if (!active) return
        const verse = extractVerses(payload).find(item => item.verse === 3)
        if (verse?.text) setDailyVerse(verse.text)
      })
      .catch(() => { if (active) setDailyVerse('') })
      .finally(() => { if (active) setDailyVerseLoading(false) })
    return () => { active = false }
  }, [apiReady])

  useEffect(() => {
    if (page !== 'biblia' || !apiReady || !currentBook) return
    let active = true
    setBibleLoading(true)
    setBibleError('')
    setSelectedVerse(null)
    getJson(`/api/bible/bibles/nvi/${encodeURIComponent(currentBook.abbreviation)}/${chapter}?target_lang=pt`)
      .then(payload => {
        if (!active) return
        const received = extractVerses(payload)
        if (!received.length) throw new Error('A API respondeu, mas não encontrei versículos neste capítulo.')
        setVerses(received)
      })
      .catch(error => {
        if (active) {
          setVerses([])
          setBibleError(error instanceof Error ? error.message : 'Não foi possível carregar o capítulo.')
        }
      })
      .finally(() => { if (active) setBibleLoading(false) })
    return () => { active = false }
  }, [page, apiReady, currentBook.id, currentBook.abbreviation, chapter, reloadChapter])

  useEffect(() => {
    if (activeNote && editorRef.current) editorRef.current.innerHTML = safeNoteHtml(activeNote.content)
  }, [activeNote?.id])

  useEffect(() => {
    if (!categoryNotes.some(note => note.id === activeNoteId)) setActiveNoteId(categoryNotes[0]?.id ?? null)
  }, [categoryNotes, activeNoteId])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  const launchSection = (id: FocusedObject) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || appearance.motion === 'minimal'
    if (reduced) {
      setFocusedObject(id)
      return
    }
    setLaunchingSection(id)
    if (launchTimer.current !== null) window.clearTimeout(launchTimer.current)
    launchTimer.current = window.setTimeout(() => {
      setFocusedObject(id)
      setLaunchingSection(null)
      launchTimer.current = null
    }, 560)
  }

  const enterFocusedObject = () => {
    if (!focusedObject) return
    const destination: Record<FocusedObject, Page> = {
      bible: 'biblia',
      notes: 'anotacoes',
      goals: 'habitos',
      tracker: 'habitos',
    }
    const target = destination[focusedObject]
    setFocusedObject(null)
    setLaunchingSection(null)
    setPage(target)
  }

  const openBibleAt = (id: number, chapterNumber = 1) => {
    setBookId(id)
    setChapter(chapterNumber)
    setPage('biblia')
  }

  const openBibleBook = () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || appearance.motion === 'minimal') {
      setBibleBookOpen(true)
      return
    }
    setBibleOpening(true)
    if (bibleOpenTimer.current !== null) window.clearTimeout(bibleOpenTimer.current)
    bibleOpenTimer.current = window.setTimeout(() => {
      setBibleBookOpen(true)
      setBibleOpening(false)
      bibleOpenTimer.current = null
    }, 820)
  }

  const shiftHabitMonth = (amount: number) => {
    const [year, month] = habitMonth.split('-').map(Number)
    const shifted = new Date((year || new Date().getFullYear()), (month || (new Date().getMonth() + 1)) - 1 + amount, 1)
    setHabitMonth(`${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`)
  }

  const createNote = (preset?: { title?: string; content?: string; category?: Category }) => {
    const id = Date.now()
    const newCategory = preset?.category ?? category
    const note: Note = {
      id,
      title: preset?.title ?? '',
      category: newCategory,
      content: preset?.content ?? '',
      updatedAt: Date.now(),
    }
    setCategory(newCategory)
    setNotes(previous => [note, ...previous])
    setActiveNoteId(id)
    setNoteSearch('')
    setPage('anotacoes')
    window.setTimeout(() => editorRef.current?.focus(), 80)
  }

  const updateActiveNote = (patch: Partial<Note>) => {
    if (!activeNoteId) return
    setNotes(previous => previous.map(note => note.id === activeNoteId ? { ...note, ...patch, updatedAt: Date.now() } : note))
  }

  const saveEditorContent = () => {
    if (!editorRef.current || !activeNoteId) return
    const content = safeNoteHtml(editorRef.current.innerHTML)
    const firstLine = (editorRef.current.innerText || editorRef.current.textContent || '').split('\n').map(line => line.trim()).find(Boolean) ?? ''
    updateActiveNote({ content, title: firstLine.slice(0, 64) })
  }

  const formatNote = (command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'formatBlock' | 'insertText', value?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    saveEditorContent()
  }

  const pastePlainText = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
    saveEditorContent()
  }

  const selectVerse = (verse: Verse) => {
    const key = `${currentBook.abbreviation} ${chapter}:${verse.verse}`
    setSelectedVerse({ key, reference: `${currentBook.name} ${chapter}:${verse.verse}`, number: verse.verse, text: verse.text })
  }

  const applyHighlight = (color: HighlightColor | null) => {
    if (!selectedVerse) return
    setHighlights(previous => {
      const next = { ...previous }
      if (color) next[selectedVerse.key] = color
      else delete next[selectedVerse.key]
      return next
    })
    showToast(color ? 'Versículo grifado.' : 'Grifo removido.')
  }

  const copySelectedVerse = async () => {
    if (!selectedVerse) return
    const sourceLabel = apiReady ? 'NVI' : 'prévia do Canva'
    try {
      await navigator.clipboard.writeText(`${selectedVerse.reference} — ${selectedVerse.text} (${sourceLabel})`)
      showToast('Versículo copiado.')
    } catch {
      showToast('A cópia foi bloqueada pelo navegador. Seleciona o texto para copiar.')
    }
  }

  const noteSelectedVerse = () => {
    if (!selectedVerse) return
    const sourceLabel = apiReady ? 'NVI' : 'prévia do Canva'
    const content = `<blockquote>${escapeHtml(`${selectedVerse.reference} — ${selectedVerse.text} (${sourceLabel})`)}</blockquote><p><br></p>`
    createNote({ title: selectedVerse.reference, content, category: 'Devocional' })
  }

  const changeChapter = (step: number) => {
    const index = books.findIndex(book => book.id === bookId)
    if (step < 0 && chapter > 1) { setChapter(value => value - 1); return }
    if (step > 0 && chapter < currentBook.chapters) { setChapter(value => value + 1); return }
    const nextBook = books[index + step]
    if (!nextBook) return
    setBookId(nextBook.id)
    setChapter(step > 0 ? 1 : nextBook.chapters)
  }

  const submitFolder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = folderName.trim().replace(/\s+/g, ' ')
    if (!name) return
    if (folders.some(folder => folder.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      showToast('Já existe uma pasta com esse nome.')
      return
    }
    setFolders(current => [...current, name])
    setCategory(name)
    setFolderName('')
    setAddingFolder(false)
    setActiveNoteId(null)
    showToast('Pasta criada.')
  }

  const deleteFolder = (folder: string) => {
    const destination = folders.find(item => item !== folder) ?? 'Geral'
    if (!window.confirm(`Excluir a pasta “${folder}”? As notas serão movidas para “${destination}”.`)) return
    setFolders(current => {
      const rest = current.filter(item => item !== folder)
      return rest.length ? rest : [destination]
    })
    setNotes(current => current.map(note => note.category === folder ? { ...note, category: destination, updatedAt: Date.now() } : note))
    if (category === folder) setCategory(destination)
    if (!folders.some(item => item !== folder)) setCategory(destination)
    showToast(`Pasta excluída. As notas foram movidas para ${destination}.`)
  }

  const changeHabitDay = (habitId: number, dateKey: string) => {
    const existing = habitHistory[String(habitId)] ?? []
    const today = localDateKey(new Date())
    const currentlyChecked = existing.includes(dateKey) || (dateKey === today && Boolean(habits.find(habit => habit.id === habitId)?.done))
    const shouldBeChecked = !currentlyChecked
    setHabitHistory(previous => {
      const days = previous[String(habitId)] ?? []
      const updated = shouldBeChecked ? Array.from(new Set([...days, dateKey])) : days.filter(date => date !== dateKey)
      return { ...previous, [String(habitId)]: updated }
    })
    if (dateKey === today) setHabits(previous => previous.map(habit => habit.id === habitId ? { ...habit, done: shouldBeChecked } : habit))
  }

  const updateSetting = <K extends keyof Appearance,>(key: K, value: Appearance[K]) => {
    setAppearance(previous => ({ ...previous, [key]: value }))
  }

  const updateColor = (key: keyof Appearance['colors'], value: string) => {
    setAppearance(previous => ({ ...previous, palette: 'custom', colors: { ...previous.colors, [key]: value } }))
  }

  const choosePalette = (palette: Appearance['palette']) => {
    if (palette === 'night-gold') setAppearance(previous => ({ ...previous, palette, colors: { background: '#070b13', surface: '#121b29', paper: '#e9e3d6', accent: '#9fc7fa', secondary: '#c9a95f', text: '#f2f0ea', muted: '#a6b0c1', paperText: '#292b30' } }))
    else if (palette === 'paper') setAppearance(previous => ({ ...previous, palette, colors: { background: '#111318', surface: '#20242b', paper: '#f0e8d8', accent: '#b5cadf', secondary: '#b18d5c', text: '#f2f0ea', muted: '#bbc1ca', paperText: '#302a22' } }))
    else updateSetting('palette', 'custom')
  }

  const resetAppearance = () => {
    setAppearance(defaultAppearance)
    showToast('Aparência restaurada aos padrões STAR.')
  }

  const toggleJesusVerse = () => {
    if (!selectedVerse) return
    setJesusVerses(current => current.includes(selectedVerse.key) ? current.filter(key => key !== selectedVerse.key) : [...current, selectedVerse.key])
    showToast(jesusVerses.includes(selectedVerse.key) ? 'Marca de fala removida.' : 'Versículo marcado como fala de Jesus.')
  }

  const submitHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!habitInput.trim()) return
    setHabits(current => [...current, { id: Date.now(), name: habitInput.trim(), detail: habitDetailInput.trim() || 'Hábito pessoal', done: false, kind: habitKindInput }])
    setHabitInput('')
    setHabitDetailInput('')
    setHabitKindInput('Rotina')
    setAddHabitOpen(false)
    showToast('Hábito adicionado.')
  }

  return (
    <main className={`site-shell atmosphere-${appearance.atmosphere} elements-${appearance.elements} motion-${appearance.motion} panels-${appearance.panelShape} shadows-${appearance.shadows} habits-${appearance.habitLayout} paper-${appearance.paperTexture}`} style={rootStyle}>
      <header className={`topbar ${page === 'inicio' ? 'topbar-home' : 'topbar-inner'}`}>
        <button className="brand-lockup" onClick={() => setPage('inicio')} aria-label="Voltar ao quarto">
          <img src="/star-logo.png" className="brand-logo" alt="Logo STAR" />
          <span className="brand-wordmark"><span className="brand-room">room</span></span>
        </button>
        {page !== 'inicio' && <div className="inner-nav">
          <button className="back-to-room" onClick={() => setPage('inicio')}>← Voltar ao quarto</button>
          <span className="inner-page-name">{({ biblia: 'A Palavra', anotacoes: 'Pensamentos', habitos: 'Metas e hábitos', ajustes: 'Meu espaço' } as Record<string,string>)[page]}</span>
          <div className="topbar-status"><span className={`status-dot ${apiReady ? 'is-live' : ''}`} />{apiReady ? 'NVI conectada' : 'espaço pessoal'}</div>
        </div>}
        {page === 'inicio' && <span className="home-top-note">UM ESPAÇO TEU · DESDE O PRIMEIRO PENSAMENTO</span>}
      </header>

      <div className={`app-content page-${page}`} key={page}>
        {page === 'inicio' && <section className="home-view home-canva home-story page-enter">
          <section className="story-verse" aria-label="Versículo do dia">
            <div className="story-verse-copy">
              <span className="story-index">00 / UM MOMENTO DE PAZ</span>
              <p className="story-verse-label">VERSÍCULO DO DIA</p>
              <h1>Encontra um<br/><em>momento de paz.</em></h1>
              <blockquote>{dailyVerseLoading ? 'A preparar a Palavra…' : dailyVerse || fallbackDailyVerse}</blockquote>
              <span className="story-reference">SALMOS 1:3 <i/> {apiReady ? 'NVI' : 'PRÉVIA'}</span>
              <button className="story-text-link" onClick={() => openBibleAt(19,1)}>Ler o capítulo <span>↗</span></button>
            </div>
            <div className="story-hands" aria-hidden="true">
              <span className="orbit orbit-one"/><span className="orbit orbit-two"/>
              <img src="https://res.publicdomainfiles.com/pdf_view/52/13526046019596.png" alt=""/>
              <span className="story-vertical-note">RESPIRA · ORA · CONFIA</span>
            </div>
            <span className="story-scroll-cue"><span/> DESLIZA PARA DESCOBRIR</span>
          </section>

          <button className={`story-object-section story-bible scroll-reveal ${launchingSection === 'bible' ? 'is-launching' : ''}`} onClick={() => launchSection('bible')} aria-label="Entrar na Bíblia">
            <span className="story-section-index">01</span>
            <span className="story-object bible-object-art" aria-hidden="true">
              <span className="home-bible-model">
                <span className="home-bible-pages"/><span className="home-bible-back"/><span className="home-bible-spine"/>
                <span className="home-bible-cover"><span>HOLY BIBLE</span></span>
              </span>
            </span>
            <span className="story-object-copy"><span className="story-kicker">A PALAVRA DE DEUS</span><strong>O livro sagrado.</strong><p>Um lugar para ler, refletir e guardar aquilo que fala contigo.</p><span className="story-action-hint">TOCA NO LIVRO PARA ABRIR <b>↗</b></span></span>
            <span className="story-margin-note">Ler.<br/>Meditar.<br/>Viver.</span>
          </button>

          <button className={`story-object-section story-notes scroll-reveal ${launchingSection === 'notes' ? 'is-launching' : ''}`} onClick={() => launchSection('notes')} aria-label="Entrar nas anotações">
            <span className="story-section-index">02</span>
            <span className="story-object pen-object-art" aria-hidden="true">
              <span className="pen-model3d pen-model3d-real" aria-label="Modelo 3D interativo de caneta-tinteiro">
                {webglAvailable === true
                  ? <iframe className="pen-model-preview" src={penModelViewerUrl} title="Prévia 3D de caneta-tinteiro" loading="lazy" allow="fullscreen" />
                  : <div className="webgl-unavailable-home"><span>3D</span><small>{webglAvailable === false ? 'WebGL indisponível neste navegador' : 'A verificar suporte 3D…'}</small></div>}
              </span>
            </span>
            <span className="story-object-copy"><span className="story-kicker">UM ESPAÇO PARA TI</span><strong>Coloca os teus<br/>pensamentos no papel.</strong><p>Orações, ideias, planos e tudo o que não queres esquecer.</p><span className="story-action-hint">TOCA PARA ESCREVER <b>↗</b></span></span>
            <span className="story-margin-note">Escreve.<br/>Solta.<br/>Guarda.</span>
          </button>

          <button className={`story-object-section story-goals scroll-reveal ${launchingSection === 'goals' ? 'is-launching' : ''}`} onClick={() => launchSection('goals')} aria-label="Entrar nos hábitos e metas">
            <span className="story-section-index">03</span>
            <span className="story-object star-object-art" aria-hidden="true">
              <span className="star-aura"/>
              <span className="star-model3d">
                <img className="star-depth star-depth-4" src="/pixel-star.png" alt=""/>
                <img className="star-depth star-depth-3" src="/pixel-star.png" alt=""/>
                <img className="star-depth star-depth-2" src="/pixel-star.png" alt=""/>
                <img className="star-depth star-depth-1" src="/pixel-star.png" alt=""/>
                <img className="star-front" src="/pixel-star.png" alt=""/>
              </span>
            </span>
            <span className="story-object-copy"><span className="story-kicker">PEQUENOS PASSOS, GRANDES MUDANÇAS</span><strong>E as tuas metas<br/>e objetivos?</strong><p>Vamos chegar lá? Um dia de cada vez, ao teu ritmo.</p><span className="story-action-hint">TOCA NA ESTRELA <b>↗</b></span></span>
            <span className="story-margin-note">Sonha.<br/>Planeia.<br/>Constrói.</span>
          </button>

          <button className={`story-object-section story-tracker scroll-reveal ${launchingSection === 'tracker' ? 'is-launching' : ''}`} onClick={() => launchSection('tracker')} aria-label="Abrir tracker mensal e lembretes">
            <span className="story-section-index">04</span>
            <span className="story-object tracker-object-art" aria-hidden="true"><span className="tracker-notebook-model"><span className="tracker-notebook-pages"/><img src="/habit-tracker.svg" alt=""/></span></span>
            <span className="story-object-copy"><span className="story-kicker">O TEU CADERNO DE ROTINA</span><strong>O que fazes hoje<br/>constrói o amanhã.</strong><p>Hábitos, rotina e lembretes num tracker mensal que vais preenchendo.</p><span className="story-action-hint">ABRIR O TEU TRACKER <b>↗</b></span></span>
          </button>
          <footer className="story-footer"><img src="/star-logo.png" alt="STAR"/><span>O TEU QUARTO DIGITAL</span><span>FEITO PARA SER TEU.</span><button onClick={() => setPage('ajustes')}>PERSONALIZAR ↗</button></footer>
        </section>}

        {page === 'biblia' && !bibleBookOpen && <section className={`bible-book-entry page-enter ${bibleOpening ? 'book-opening' : ''}`} aria-label="Capa da Bíblia">
          <div className="book-entry-stage">
            <div className={`bible-book-object ${bibleOpening ? 'is-opening' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="Toca para abrir a Bíblia. Arrasta para inclinar o livro em 3D."
              style={{ '--book-tilt-x': `${bookTilt.x}deg`, '--book-tilt-y': `${bookTilt.y}deg` } as CSSProperties}
              onClick={event => {
                if (bookDragRef.current) { event.preventDefault(); bookDragRef.current = false; return }
                openBibleBook()
              }}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openBibleBook() } }}
              onPointerDown={event => {
                bookPointerStart.current = { x: event.clientX, y: event.clientY, dragged: false }
                if (event.pointerType === 'touch') event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={event => {
                if (bibleOpening) return
                const start = bookPointerStart.current
                if (event.pointerType === 'touch') {
                  if (!start) return
                  const dx = event.clientX - start.x
                  const dy = event.clientY - start.y
                  if (Math.hypot(dx, dy) > 7) start.dragged = true
                  if (start.dragged) {
                    setBookTilt({
                      x: Math.max(-15, Math.min(15, dx * .55)),
                      y: Math.max(-12, Math.min(12, dy * -.42)),
                    })
                  }
                  return
                }
                const rect = event.currentTarget.getBoundingClientRect()
                const horizontal = (event.clientX - rect.left) / rect.width
                const vertical = (event.clientY - rect.top) / rect.height
                setBookTilt({ x: (0.5 - horizontal) * 10, y: (0.5 - vertical) * 8 })
              }}
              onPointerUp={event => {
                if (bookPointerStart.current?.dragged) {
                  bookDragRef.current = true
                  window.setTimeout(() => { bookDragRef.current = false }, 350)
                }
                bookPointerStart.current = null
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
              }}
              onPointerCancel={() => { bookPointerStart.current = null; bookDragRef.current = false; setBookTilt({ x: 0, y: 0 }) }}
              onPointerLeave={() => { if (!bookPointerStart.current) setBookTilt({ x: 0, y: 0 }) }}>
              <div className="bible-book-pages" /><div className="bible-book-back" />
              <div className="bible-book-cover" aria-label="Capa de couro escuro">
                <div className="book-cover-heading">HOLY BIBLE</div>
              </div>
            </div>
          </div>
          <div className="book-entry-copy">
            <span className="book-entry-kicker">STAR ROOM / BÍBLIA</span>
            <h1>Um livro.<br /><span>Muitas páginas.</span></h1>
            <p className="book-touch-instruction">Toca na capa para abrir. Move o cursor para inclinar o livro.</p>
            <div className="book-entry-pickers">
              <label><span>CONTINUAR EM</span><select value={bookId} onChange={event => { setBookId(Number(event.target.value)); setChapter(1) }} aria-label="Escolher livro para abrir">{books.map(book => <option value={book.id} key={book.id}>{book.name}</option>)}</select></label>
              <label><span>CAPÍTULO</span><select value={chapter} onChange={event => setChapter(Number(event.target.value))} aria-label="Escolher capítulo para abrir">{Array.from({ length: currentBook.chapters }, (_, index) => index + 1).map(number => <option value={number} key={number}>{number}</option>)}</select></label>
            </div>
            <p className="book-touch-hint"><span aria-hidden="true">↳</span> A capa é interativa</p>
            <p className="last-reading-line">Última leitura <strong>{currentBook.name} {chapter}</strong></p>
          </div>
        </section>}

        {page === 'biblia' && bibleBookOpen && <section className={`bible-view bible-canva page-enter bible-opened bible-layout-${appearance.bibleLayout}`}>
          <div className="bible-layout">
            <aside className="chapter-notes-panel notebook-margin">
              <div className="chapter-notes-heading">
                <div><span className="canva-kicker">CADERNO DE LEITURA</span><h2>Anotações do capítulo</h2></div>
                <button className="chapter-note-add" title="Criar anotação ligada a este capítulo" aria-label="Criar anotação do capítulo" onClick={() => createNote({ title: `${currentBook.name} ${chapter}`, category: 'Devocional', content: `<p><br></p>` })}>＋</button>
              </div>
              <p className="chapter-notes-context">{currentBook.name} {chapter} <span>·</span> Guarda o que esta leitura te fez perceber.</p>
              <textarea
                className="chapter-notes-paper"
                value={chapterNotes[chapterNoteKey] ?? ''}
                onChange={event => setChapterNotes(previous => ({ ...previous, [chapterNoteKey]: event.target.value }))}
                placeholder="Escreve aqui as tuas reflexões..."
                aria-label={`Anotações de ${currentBook.name} capítulo ${chapter}`}
              />
              <div className="chapter-notes-related">
                <div className="related-heading"><span>NOTAS DE VERSÍCULOS</span><span>{linkedChapterNotes.length}</span></div>
                {linkedChapterNotes.map(note => <button className="related-note" key={note.id} onClick={() => { setCategory(note.category); setActiveNoteId(note.id); setPage('anotacoes') }}><strong>{note.title}</strong><span>{note.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 84) || 'Abrir anotação'}</span><b>↗</b></button>)}
                {linkedChapterNotes.length === 0 && <p className="related-empty">Quando anotares um versículo, ele aparece aqui.</p>}
              </div>
              <div className="bible-margin-doodle" aria-hidden="true"><img src="/cross-sketch.png" alt="" /><img src="https://res.publicdomainfiles.com/pdf_view/52/13526046019596.png" alt="" /></div>
              <div className="chapter-notes-save"><span className="notes-save-pip" /> Guardado neste navegador</div>
            </aside>

            <section className="bible-reader-canva">
              <div className="bible-reader-controls">
                <label className="book-picker-control"><span>Livro</span><select value={bookId} onChange={event => { setBookId(Number(event.target.value)); setChapter(1) }} aria-label="Escolher livro da Bíblia"><optgroup label="Antigo Testamento">{books.filter(book => book.testament === 'OT').map(book => <option value={book.id} key={book.id}>{book.name}</option>)}</optgroup><optgroup label="Novo Testamento">{books.filter(book => book.testament === 'NT').map(book => <option value={book.id} key={book.id}>{book.name}</option>)}</optgroup></select></label>
                <label className="chapter-picker-control"><span>Capítulo</span><select value={chapter} onChange={event => setChapter(Number(event.target.value))} aria-label="Escolher capítulo">{Array.from({ length: currentBook.chapters }, (_, index) => index + 1).map(number => <option key={number} value={number}>{number}</option>)}</select></label>
                <div className="translation-badge"><span className={`translation-dot ${apiReady ? 'connected' : ''}`} /> NVI</div>
                <div className="chapter-arrows"><button onClick={() => changeChapter(-1)} aria-label="Capítulo anterior" title="Capítulo anterior">←</button><button onClick={() => changeChapter(1)} aria-label="Próximo capítulo" title="Próximo capítulo">→</button></div>
              </div>

              <div className="bible-reader-heading"><div><span className="bible-book-context">{currentBook.testament === 'OT' ? 'ANTIGO TESTAMENTO' : 'NOVO TESTAMENTO'}</span><h1>{currentBook.name} <span>{chapter}</span></h1></div><button className={`chapter-bookmark ${bookmarks.includes(`${currentBook.abbreviation} ${chapter}`) ? 'is-saved' : ''}`} onClick={() => { const key = `${currentBook.abbreviation} ${chapter}`; setBookmarks(previous => previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]); showToast(bookmarks.includes(key) ? 'Marcador removido.' : 'Capítulo salvo nos marcadores.') }}>{bookmarks.includes(`${currentBook.abbreviation} ${chapter}`) ? '★ Salvo' : '☆ Salvar capítulo'}</button></div>

              {apiStatusLoaded && !apiReady && <div className="bible-preview-status"><span>Prévia de interação</span><p>A API NVI ainda não está conectada. Neste capítulo de Salmos, podes testar o grifamento com o texto de exemplo que já estava no teu Canva.</p><button onClick={() => setShowSetupHelp(value => !value)}>{showSetupHelp ? 'Ocultar configuração' : 'Configurar texto NVI'} <span>↗</span></button>{showSetupHelp && <div className="bible-setup-inline"><ol><li>Obtém uma chave no <a href="https://biblelexicon.com.br/docs" target="_blank" rel="noreferrer">BibleLexicon API</a>.</li><li>Cria `.env.local` na pasta principal e adiciona `BIBLELEXICON_API_KEY=tua_chave`.</li><li>Reinicia com <code>npm run dev</code>.</li></ol><small>Não publiques nem compartilhes a chave. A prévia abaixo não é apresentada como texto oficial da NVI.</small></div>}</div>}
              {apiReady && bibleLoading && <div className="reader-loading"><span className="loading-orbit" /><strong>Carregando {currentBook.name} {chapter}</strong><span>Preparando o texto da NVI…</span></div>}
              {apiReady && bibleError && !bibleLoading && <div className="reader-error"><span>!</span><h3>Não consegui abrir esse capítulo</h3><p>{bibleError}</p><button className="button-quiet" onClick={() => setReloadChapter(value => value + 1)}>Tentar novamente ↻</button></div>}

              {((apiReady && !bibleLoading && !bibleError && verses.length > 0) || (!apiReady && currentBook.id === 19 && chapter === 23)) && <>
                {!apiReady && <p className="sample-text-label">AMOSTRA DO TEU PROTÓTIPO · NÃO É UMA CARGA OFICIAL DA NVI</p>}
                <div className="verse-list verse-list-canva">{(apiReady ? verses : canvaPsalm23Preview).map(verse => {
                  const key = `${currentBook.abbreviation} ${chapter}:${verse.verse}`
                  const color = highlights[key]
                  return <div className="verse-item-with-tools" key={verse.verse}>
                    <button className={`verse-line verse-line-canva ${selectedVerse?.key === key ? 'verse-active' : ''} ${color ? `marked marked-${color}` : ''} ${jesusVerses.includes(key) ? `jesus-saying jesus-style-${appearance.jesusStyle}` : ''}`} onClick={() => selectVerse(verse)} aria-pressed={selectedVerse?.key === key} title={`Selecionar ${currentBook.name} ${chapter}:${verse.verse}`}><span className="verse-number">{verse.verse}</span><span className="verse-text"><span className="verse-highlight-surface">{verse.text}</span></span>{color && <span className="highlight-indicator" aria-label={`Grifo ${color}`} />}</button>
                    {selectedVerse?.key === key && <div className="verse-tools verse-tools-canva verse-tools-under-selection"><div className="selected-verse-caption"><span>VERSÍCULO SELECIONADO</span><strong>{selectedVerse.reference}</strong></div><div className="highlight-tools" aria-label="Ferramentas do versículo selecionado"><span className="toolbar-label">Grifar</span><button className={`color-tool color-gold ${highlights[selectedVerse.key] === 'gold' ? 'color-active' : ''}`} title="Grifar amarelo" aria-label="Grifar amarelo" aria-pressed={highlights[selectedVerse.key] === 'gold'} onClick={() => applyHighlight('gold')} /><button className={`color-tool color-blue ${highlights[selectedVerse.key] === 'blue' ? 'color-active' : ''}`} title="Grifar azul" aria-label="Grifar azul" aria-pressed={highlights[selectedVerse.key] === 'blue'} onClick={() => applyHighlight('blue')} /><button className={`color-tool color-pink ${highlights[selectedVerse.key] === 'pink' ? 'color-active' : ''}`} title="Grifar rosa" aria-label="Grifar rosa" aria-pressed={highlights[selectedVerse.key] === 'pink'} onClick={() => applyHighlight('pink')} /><button className={`color-tool color-violet ${highlights[selectedVerse.key] === 'violet' ? 'color-active' : ''}`} title="Grifar violeta" aria-label="Grifar violeta" aria-pressed={highlights[selectedVerse.key] === 'violet'} onClick={() => applyHighlight('violet')} /><button className="tool-text-button" onClick={() => applyHighlight(null)}>Limpar</button><i className="tool-separator" /><button className="tool-text-button" onClick={() => void copySelectedVerse()}>Copiar</button><button className="tool-text-button" onClick={noteSelectedVerse}>Anotar</button><button className={`tool-text-button jesus-mark-action ${jesusVerses.includes(selectedVerse.key) ? 'is-marked' : ''}`} onClick={toggleJesusVerse}>{jesusVerses.includes(selectedVerse.key) ? 'Desmarcar fala de Jesus' : 'Marcar fala de Jesus'}</button></div></div>}
                  </div>
                })}</div>
                {apiReady && <div className="reader-attribution-canva">NVI · Nova Versão Internacional</div>}
              </>}
              {!apiReady && !(currentBook.id === 19 && chapter === 23) && <div className="bible-empty-state"><img src="/star-logo.png" alt="" /><h2>{currentBook.name} {chapter}</h2><p>Conecta a API para carregar o texto real deste capítulo. Quando o texto estiver disponível, seleciona qualquer versículo para o grifar.</p></div>}

              <div className="bible-reader-footer"><span><i className={`reader-status-dot ${apiReady ? '' : 'is-offline'}`} /> {apiReady ? 'NVI CONECTADA' : 'MODO DE PRÉVIA'}</span><span>{Object.keys(highlights).length} grifos <b>·</b> {bookmarks.length} marcadores</span></div>
            </section>
          </div>
        </section>}

        {page === 'anotacoes' && <section className="notes-view page-enter">
          <div className="notes-quick-actions"><span>TEU ESPAÇO</span><button className="button-primary new-note-button" onClick={() => createNote()}>＋ Nova nota</button></div>
          <div className="notes-app glass-card">
            <aside className="notes-sidebar">
              <div className="notes-sidebar-heading"><span>PASTAS</span><span className="folder-count">{folders.length}</span><button className="folder-add-toggle" title="Criar pasta" aria-label="Criar pasta" onClick={() => setAddingFolder(value => !value)}>{addingFolder ? '×' : '+'}</button></div>
              {addingFolder && <form className="new-folder-form" onSubmit={submitFolder}><input autoFocus value={folderName} onChange={event => setFolderName(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { setAddingFolder(false); setFolderName('') } }} placeholder="Nome da pasta" aria-label="Nome da nova pasta" maxLength={32} /><button type="submit" aria-label="Salvar pasta">↵</button></form>}
              <div className="category-options">{folders.map(item => <div key={item} className={`folder-option-wrap ${category === item ? 'folder-selected' : ''}`}><button className={`folder-select ${category === item ? 'active-category' : ''}`} onClick={() => { setCategory(item); setActiveNoteId(notes.find(note => note.category === item)?.id ?? null) }}><span className="category-glyph"><img src="/star-logo.png" alt="" /></span><span className="folder-name">{item}</span><small>{notes.filter(note => note.category === item).length}</small></button><button className="folder-delete" title={`Excluir pasta ${item}`} aria-label={`Excluir pasta ${item}`} onClick={() => deleteFolder(item)}>×</button></div>)}</div>
              <div className="notes-list-heading"><span>ANOTAÇÕES</span><button onClick={() => createNote()} aria-label="Criar nota">＋</button></div>
              <label className="note-search"><input value={noteSearch} onChange={event => setNoteSearch(event.target.value)} placeholder="Buscar notas..." /></label>
              <div className="notes-list">{categoryNotes.map(note => <button key={note.id} className={`note-list-item ${activeNoteId === note.id ? 'selected-note' : ''}`} onClick={() => setActiveNoteId(note.id)}><strong>{note.title || 'Nova anotação'}</strong><small>{new Date(note.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</small><span>{note.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 82) || 'Sem texto ainda'}</span></button>)}{categoryNotes.length === 0 && <div className="notes-empty-list"><img src="/engraved-books.svg" alt="" /><p>Nenhuma nota nesta pasta.</p><button onClick={() => createNote()}>Criar uma nota</button></div>}</div>
              <div className="notes-sidebar-bottom"><span className="sync-pip" /> SALVO NESTE NAVEGADOR</div>
            </aside>
            <section className="note-workspace">
              {activeNote ? <>
                <div className="note-editor-top"><span className="note-date">{new Date(activeNote.updatedAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span><div><span className="autosave-label"><i /> Salvo</span><button className="delete-note-top" title="Excluir anotação" onClick={() => { const remaining = notes.filter(note => note.id !== activeNote.id); setNotes(remaining); setActiveNoteId(remaining.find(note => note.category === category)?.id ?? null); showToast('Anotação excluída.') }}>Excluir</button></div></div>
                <div ref={editorRef} className="note-paper" contentEditable suppressContentEditableWarning role="textbox" aria-label="Escreva sua anotação" aria-multiline="true" data-placeholder="Clica aqui e começa a escrever…" onInput={saveEditorContent} onBlur={saveEditorContent} onPaste={pastePlainText} />
                <div className="note-bottom-bar"><div className="note-format-tools" aria-label="Formatação de anotação"><button title="Texto normal" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('formatBlock', 'p')}>Texto</button><i /><button title="Negrito" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('bold')}><b>B</b></button><button title="Itálico" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('italic')}><i>I</i></button><button title="Sublinhado" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('underline')}><u>U</u></button><i /><button title="Lista com marcadores" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('insertUnorderedList')}>Lista</button><button title="Lista numerada" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('insertOrderedList')}>Num.</button><button title="Checklist" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('insertText', '☐ ')}>Checklist</button><i /><button title="Citação" onMouseDown={event => event.preventDefault()} onClick={() => formatNote('formatBlock', 'blockquote')}>Citação</button></div><div className="note-bottom-meta"><span>{activeNote.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length} palavras</span><span>•</span><span>{category}</span></div></div>
              </> : <div className="note-welcome"><img src="/star-logo.png" alt="" /><h2>Teu espaço de escrita</h2><p>Escolhe uma anotação à esquerda ou começa uma nova.</p><button className="button-primary" onClick={() => createNote()}>Criar anotação <span>＋</span></button></div>}
            </section>
          </div>
          <div className="notes-footer"><span>STAR ROOM / NOTES</span><span>AS TUAS IDEIAS, DO TEU JEITO</span></div>
        </section>}

        {page === 'habitos' && <section className="habits-view page-enter">
          <header className="habit-journal-header">
            <div className="habit-journal-title"><span className="handwritten-overline">meu caderno de rotina</span><h1>Habit <span>tracker</span></h1><p>Marca os dias e observa os teus próprios padrões.</p></div>
            <div className="habit-month-turner"><button onClick={() => shiftHabitMonth(-1)} aria-label="Mês anterior" title="Mês anterior">‹</button><div><small>MÊS DE REGISTO</small><strong>{selectedMonthLabel}</strong></div><button onClick={() => shiftHabitMonth(1)} aria-label="Próximo mês" title="Próximo mês">›</button><button className="month-current" onClick={() => setHabitMonth(thisMonthKey)}>Este mês</button></div>
          </header>
          <section className="habit-checklist glass-card habit-journal-paper"><div className="habit-list-title"><div><span className="section-kicker">{selectedMonthLabel.toLocaleUpperCase('pt-BR')}</span><h2>Registo mensal</h2><p>{habits.length} hábitos · marca cada dia em que fizeste a atividade</p></div><button className="button-primary" onClick={() => setAddHabitOpen(value => !value)}>{addHabitOpen ? 'Cancelar' : '+ Novo hábito'}</button></div>
            {addHabitOpen && <form className="habit-add-form" onSubmit={submitHabit}><input autoFocus value={habitInput} onChange={event => setHabitInput(event.target.value)} placeholder="Nome do hábito ou rotina" aria-label="Nome do hábito" required /><input value={habitDetailInput} onChange={event => setHabitDetailInput(event.target.value)} placeholder="Descrição curta (opcional)" aria-label="Descrição do hábito" /><select value={habitKindInput} onChange={event => setHabitKindInput(event.target.value)} aria-label="Área do hábito"><option>Rotina</option><option>Estudo</option><option>Saúde</option><option>Casa</option><option>Fé</option><option>Lazer</option><option>Outro</option></select><button className="button-primary" type="submit">Adicionar</button></form>}
            <div className="habit-journal-scroll"><div className="habit-journal-grid" style={{ '--day-count': habitDisplayDays.length } as CSSProperties}>
              <div className="habit-journal-head"><div className="habit-name-head">{appearance.habitLayout === 'weekly' ? 'HÁBITO / 7 DIAS' : appearance.habitLayout === 'pixels' ? 'HÁBITO / PIXELS' : 'HÁBITO / MÊS'}</div>{habitDisplayDays.map(day => <div key={day.key} className={`habit-day-head ${day.key === currentDateKey ? 'is-today' : ''}`} title={day.key}><small>{day.weekday}</small><strong>{day.label}</strong></div>)}</div>
              {habits.map((habit, index) => <div className={`habit-journal-row ${habit.done ? 'habit-done' : ''}`} key={habit.id}>
                <div className="habit-journal-name"><span className="habit-row-index">{String(index + 1).padStart(2, '0')}</span><span className="habit-row-copy"><strong>{habit.name}</strong><small>{habit.detail}</small><em className="habit-kind-tag">{habit.kind ?? 'Pessoal'}</em></span><button className="habit-remove" aria-label={`Excluir ${habit.name}`} onClick={() => { if (window.confirm(`Excluir o hábito “${habit.name}”?`)) setHabits(current => current.filter(item => item.id !== habit.id)) }}>×</button></div>
                {habitDisplayDays.map(day => { const checked = (habitHistory[String(habit.id)] ?? []).includes(day.key) || (day.key === currentDateKey && habit.done); return <button key={day.key} className={`habit-journal-cell ${checked ? 'checked' : ''} ${day.key === currentDateKey ? 'is-today' : ''}`} aria-pressed={checked} aria-label={`${habit.name}, dia ${day.label}: ${checked ? 'concluído' : 'não concluído'}`} title={`${day.key} · ${habit.name}`} onClick={() => changeHabitDay(habit.id, day.key)}>{checked ? '×' : ''}</button> })}
              </div>)}
            </div></div>
            {habits.length === 0 && <div className="habit-empty">Ainda não há hábitos nesta lista. Adiciona o primeiro acima.</div>}
            <div className="habit-trend-panel"><div><span className="handwritten-overline">o desenho do mês</span><strong>Registos por dia</strong><small>Vê os dias em que a tua rotina apareceu.</small></div><svg viewBox="0 0 620 82" preserveAspectRatio="none" role="img" aria-label="Gráfico de registos por dia neste mês"><path className="habit-trend-axis" d="M8 66 H612" />{habitTrend.length > 1 && <polyline className="habit-trend-line" points={habitTrend.map((day, index) => `${8 + index * (604 / (habitTrend.length - 1))},${66 - day.percent * .52}`).join(' ')} />}{habitTrend.map((day, index) => <circle className="habit-trend-point" key={day.key} cx={habitTrend.length > 1 ? 8 + index * (604 / (habitTrend.length - 1)) : 310} cy={66 - day.percent * .52} r="2.5" />)}</svg><span className="habit-trend-legend">0% <i /> 100% · {habitTrend.filter(day => day.count > 0).length} dias com registos</span></div>
          </section>
        </section>}

        {page === 'ajustes' && <section className="settings-view page-enter">
          <div className="settings-heading"><img src="/star-logo.png" alt="Logo STAR" /><div><span className="room-eyebrow">STAR ROOM / PERSONALIZAÇÃO</span><h1>Deixa o espaço com a tua cara.</h1><p>As alterações aparecem na prévia imediatamente e ficam guardadas neste navegador.</p></div></div>
          <div className="settings-layout">
            <div className="settings-controls">
              <section className="settings-group"><div className="settings-group-title"><span>01</span><div><h2>Atmosfera</h2><p>A sensação geral do teu quarto digital.</p></div></div>
                <label className="setting-field"><span>Estilo</span><select value={appearance.atmosphere} onChange={event => updateSetting('atmosphere', event.target.value as Appearance['atmosphere'])}><option value="journal">Star Journal</option><option value="pixel">Pixel Sanctuary</option><option value="cozy">Cozy Study</option></select></label>
                <label className="setting-field"><span>Elementos visuais</span><select value={appearance.elements} onChange={event => updateSetting('elements', event.target.value as Appearance['elements'])}><option value="symbolic">Símbolos STAR personalizados</option><option value="pixel">Pixel art</option><option value="sketch">Rabiscos de caderno</option></select></label>
                <label className="setting-field setting-text-field"><span>Frase no rodapé</span><input type="text" maxLength={80} value={appearance.homeTagline} onChange={event => updateSetting('homeTagline', event.target.value)} placeholder="Um lugar para as tuas ideias." /></label>
              </section>
              <section className="settings-group"><div className="settings-group-title"><span>02</span><div><h2>Cores</h2><p>Escolhe uma paleta e ajusta cada cor.</p></div></div>
                <label className="setting-field"><span>Paleta</span><select value={appearance.palette} onChange={event => choosePalette(event.target.value as Appearance['palette'])}><option value="custom">Personalizada</option><option value="night-gold">Azul-noite & dourado</option><option value="paper">Noite & papel</option></select></label>
                <div className="color-settings-grid">{([['background','Fundo'],['surface','Superfícies'],['paper','Papel bíblico'],['accent','Cor de destaque'],['secondary','Dourado secundário'],['text','Texto principal'],['muted','Texto discreto'],['paperText','Texto no papel']] as [keyof Appearance['colors'], string][]).map(([key,label]) => <label className="color-setting" key={key}><input type="color" value={appearance.colors[key]} onChange={event => updateColor(key, event.target.value)} /><span>{label}</span><code>{appearance.colors[key].toUpperCase()}</code></label>)}</div>
              </section>
              <section className="settings-group"><div className="settings-group-title"><span>03</span><div><h2>Tipografia</h2><p>Os títulos podem ser pixel art, sem prejudicar a leitura longa.</p></div></div>
                <label className="setting-field"><span>Fonte dos títulos</span><select value={appearance.titleFont} onChange={event => updateSetting('titleFont', event.target.value as Appearance['titleFont'])}><option value="pixel">Pixel suave — Pixelify Sans</option><option value="silkscreen">Pixel em grelha — Silkscreen</option><option value="press-start">Pixel clássico — Press Start 2P</option><option value="vt323">Retro terminal — VT323</option><option value="editorial">Editorial — Lora</option><option value="rounded">Arredondada — DM Sans</option><option value="space">Geométrica — Space Grotesk</option></select></label>
                <label className="setting-field"><span>Fonte dos textos</span><select value={appearance.bodyFont} onChange={event => updateSetting('bodyFont', event.target.value as Appearance['bodyFont'])}><option value="sans">Sans-serif — DM Sans</option><option value="serif">Literária — Lora</option><option value="mono">Monoespaçada — DM Mono</option><option value="professional">Profissional — Space Grotesk</option><option value="handwritten">Manuscrita — Caveat</option></select></label>
                <label className="setting-field slider-field"><span>Tamanho do texto bíblico <strong>{appearance.readingSize}px</strong></span><input type="range" min="15" max="24" value={appearance.readingSize} onChange={event => updateSetting('readingSize', Number(event.target.value))} /></label>
              </section>
              <section className="settings-group"><div className="settings-group-title"><span>04</span><div><h2>Forma e profundidade</h2><p>Define como os painéis se encaixam visualmente.</p></div></div>
                <label className="setting-field"><span>Formato dos painéis</span><select value={appearance.panelShape} onChange={event => updateSetting('panelShape', event.target.value as Appearance['panelShape'])}><option value="soft">Cantos suaves</option><option value="square">Cantos retos</option><option value="pill">Arredondados</option></select></label>
                <label className="setting-field"><span>Sombras</span><select value={appearance.shadows} onChange={event => updateSetting('shadows', event.target.value as Appearance['shadows'])}><option value="soft">Suaves</option><option value="none">Sem sombras</option><option value="deep">Mais profundas</option></select></label>
                <label className="setting-field"><span>Textura do papel</span><select value={appearance.paperTexture} onChange={event => updateSetting('paperTexture', event.target.value as Appearance['paperTexture'])}><option value="dots">Pontilhado</option><option value="lines">Pautado</option><option value="plain">Liso</option></select></label>
              </section>
              <section className="settings-group"><div className="settings-group-title"><span>05</span><div><h2>Comportamento</h2><p>Controla animações e modos de leitura.</p></div></div>
                <label className="setting-field"><span>Animação</span><select value={appearance.motion} onChange={event => updateSetting('motion', event.target.value as Appearance['motion'])}><option value="reveal">Revelar ao rolar</option><option value="gentle">Transições discretas</option><option value="minimal">Movimento mínimo</option></select></label>
                <label className="setting-field"><span>Layout bíblico</span><select value={appearance.bibleLayout} onChange={event => updateSetting('bibleLayout', event.target.value as Appearance['bibleLayout'])}><option value="study-notebook">Caderno de estudo</option><option value="spread">Livro aberto / duas páginas</option><option value="single-page">Página única</option><option value="classic">Clássico — página limpa</option></select></label>
                <label className="setting-field"><span>Falas de Jesus</span><select value={appearance.jesusStyle} onChange={event => updateSetting('jesusStyle', event.target.value as Appearance['jesusStyle'])}><option value="margin">Marca na margem</option><option value="red">Texto vermelho</option><option value="blue">Texto azul</option></select></label>
                <label className="setting-field"><span>Hábitos</span><select value={appearance.habitLayout} onChange={event => updateSetting('habitLayout', event.target.value as Appearance['habitLayout'])}><option value="journal">Bullet journal mensal</option><option value="weekly">Planner semanal</option><option value="pixels">Tracker pixel mensal</option></select></label>
              </section>
              <div className="settings-bottom-actions"><button className="button-primary" onClick={() => setPage('inicio')}>Concluído</button><button className="button-quiet" onClick={resetAppearance}>Restaurar padrões</button></div>
            </div>
            <aside className="settings-preview-column"><div className="settings-preview-sticky"><span className="room-eyebrow">PRÉ-VISUALIZAÇÃO AO VIVO</span><div className="settings-live-preview journal-surface"><div className="settings-preview-top"><img src="/star-logo.png" alt="" /><span>STAR ROOM</span></div><div className="settings-preview-spark">✳</div><span className="settings-preview-kicker">VERSÍCULO DO DIA</span><h2>Descansa um pouco.<br />Volta ao que importa.</h2><p>Um pequeno espaço para ler, pensar e escrever sem pressa.</p><span className="settings-preview-button">Guardar reflexão</span><div className="settings-preview-rule" /><div className="settings-preview-note"><strong>Notas de hoje</strong><span>Uma ideia que quero guardar…</span></div></div><p className="settings-preview-caption">A prévia usa a tua fonte, paleta, sombras e forma de painéis escolhidas.</p></div></aside>
          </div>
        </section>}
      </div>
      {focusedObject && <div className="object-zoom-overlay" role="presentation" onClick={() => setFocusedObject(null)}>
        <section className={`object-zoom-dialog zoomed-${focusedObject}`} role="dialog" aria-modal="true" aria-labelledby="object-zoom-title" onClick={event => event.stopPropagation()}>
          <button className="object-zoom-close" onClick={() => setFocusedObject(null)} aria-label="Voltar ao quarto">×</button>
          <div className="object-zoom-scene">
            {focusedObject === 'notes' && (webglAvailable === true
              ? <iframe className="pen-model-viewer" src={penModelViewerUrl} title="Modelo 3D interativo de caneta-tinteiro" allow="fullscreen" allowFullScreen />
              : <div className="webgl-unavailable-detail">
                  <div className="webgl-fallback-mark" aria-hidden="true">3D</div>
                  <h3>{webglAvailable === false ? 'O navegador não disponibilizou o WebGL.' : 'A verificar o suporte 3D…'}</h3>
                  <p>O modelo original precisa de WebGL. Ativa a aceleração gráfica nas definições do navegador e reinicia-o; esta área não vai mostrar um modelo falso no lugar do original.</p>
                  <a href="https://get.webgl.org/" target="_blank" rel="noreferrer">Testar WebGL neste navegador ↗</a>
                </div>)}
            {focusedObject === 'bible' && <span className="zoom-bible-model" aria-hidden="true"><span className="home-bible-pages"/><span className="home-bible-back"/><span className="home-bible-spine"/><span className="home-bible-cover"><span>HOLY BIBLE</span></span></span>}
            {focusedObject === 'goals' && <span className="zoom-star-model" aria-hidden="true"><img src="/pixel-star.png" alt=""/><i/><i/><i/></span>}
            {focusedObject === 'tracker' && <span className="zoom-tracker-model" aria-hidden="true"><span/><img src="/habit-tracker.svg" alt=""/></span>}
          </div>
          <div className="object-zoom-copy">
            <span className="story-kicker">{({ bible: 'A PALAVRA DE DEUS', notes: 'UM ESPAÇO PARA TI', goals: 'PEQUENOS PASSOS', tracker: 'O TEU CADERNO DE ROTINA' } as Record<FocusedObject,string>)[focusedObject]}</span>
            <h2 id="object-zoom-title">{({ bible: 'O livro sagrado.', notes: 'Coloca os teus pensamentos no papel.', goals: 'E as tuas metas e objetivos?', tracker: 'Constrói a tua rotina.' } as Record<FocusedObject,string>)[focusedObject]}</h2>
            <p>{({ bible: 'Gira o livro e entra na tua leitura, com anotações e grifamento.', notes: 'Roda a caneta 3D com o cursor ou com o toque. Quando estiveres pronto, abre o teu bloco de notas.', goals: 'Uma estrela para as coisas que queres construir, um dia de cada vez.', tracker: 'Marca os teus hábitos e consulta os lembretes do mês.' } as Record<FocusedObject,string>)[focusedObject]}</p>
            <div className="object-zoom-actions">
              <button className="object-zoom-enter" onClick={enterFocusedObject}>{({ bible: 'Entrar na Bíblia', notes: 'Abrir Anotações', goals: 'Abrir Hábitos', tracker: 'Abrir tracker' } as Record<FocusedObject,string>)[focusedObject]} <span>↗</span></button>
              <button className="object-zoom-back" onClick={() => setFocusedObject(null)}>Voltar ao quarto</button>
            </div>
            {focusedObject === 'notes' && webglAvailable === true && <small className="object-model-credit">Modelo 3D de caneta-tinteiro: Innerscene · CC0</small>}
          </div>
        </section>
      </div>}
      {toast && <div className="toast-message" role="status"><span>✓</span>{toast}</div>}
    </main>
  )
}

export default App
