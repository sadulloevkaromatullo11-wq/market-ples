import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const HISTORY = 'dukon-search'
const platforms = [
  { id: 'opt', name: 'Опт', color: '#ff7a18', mark: 'О' },
  { id: 'bozor', name: 'Бозор', color: '#e11d48', mark: 'Б' },
  { id: 'shop', name: 'Дӯкон', color: '#16a34a', mark: 'Д' },
  { id: 'dukon', name: 'Дукон', color: '#2f7bff', mark: 'Д' },
]

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY) || '[]') }
  catch { return [] }
}

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('dukon')
  const [history, setHistory] = useState([])

  useEffect(() => { setHistory(readHistory()) }, [])

  const go = (text) => {
    const value = text.trim()
    if (!value) return
    const next = [value, ...readHistory().filter((item) => item !== value)].slice(0, 8)
    localStorage.setItem(HISTORY, JSON.stringify(next))
    const source = platform === 'dukon' ? 'opt' : platform
    navigate(`/catalog?source=${source}&q=${encodeURIComponent(value)}`)
  }

  return (
    <div className="page search-page">
      <form className="search-bar" onSubmit={(event) => { event.preventDefault(); go(query) }}>
        <button type="button" className="search-back" aria-label="Бозгашт" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 5 8 12l7 7" /></svg>
        </button>
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ҷустуҷӯ дар Дукон..." aria-label="Ҷустуҷӯ" />
        {query && (
          <button type="button" className="search-clear" aria-label="Тоза кардан" onClick={() => setQuery('')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        )}
      </form>

      <div className="search-banner">
        <div className="min-w-0 flex-1">
          <p>Платформаеро интихоб кунед, ки дар он мол меҷӯед.</p>
          <div className="mt-3 flex gap-2">
            {platforms.map((item) => (
              <button key={item.id} type="button" className={`platform ${platform === item.id ? 'on' : ''}`} onClick={() => setPlatform(item.id)} aria-label={item.name}>
                <span style={{ background: item.color }}>{item.mark}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <BagsMark />
      </div>

      {history.length === 0 ? (
        <p className="search-empty">Таърихи ҷустуҷӯ нест</p>
      ) : (
        <div className="grid gap-1 px-4 pt-4">
          {history.map((item) => (
            <button key={item} type="button" className="search-history" onClick={() => { setQuery(item); go(item) }}>{item}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function BagsMark() {
  return (
    <svg viewBox="0 0 90 80" className="h-16 w-20 shrink-0" aria-hidden="true">
      <rect x="8" y="28" width="34" height="40" rx="8" fill="#dbeafe" />
      <path d="M18 28c0-8 14-8 14 0" fill="none" stroke="#2f7bff" strokeWidth="3" />
      <rect x="36" y="18" width="40" height="50" rx="8" fill="#2f7bff" />
      <path d="M48 18c0-9 16-9 16 0" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="56" cy="44" r="5" fill="#ffd36a" />
    </svg>
  )
}
