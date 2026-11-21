import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const tiles = [
  { name: 'Электроника', to: '/category/3', emoji: '⌚' },
  { name: 'Варзиш', to: '/category/9', emoji: '⚽' },
  { name: 'Зебоӣ', to: '/category/5', emoji: '💄' },
  { name: 'Хона', to: '/category/4', emoji: '🏠' },
  { name: 'Кӯдакон', to: '/category/6', emoji: '🧸' },
  { name: 'Техникаи хона', to: '/category/4', emoji: '🧺' },
  { name: 'Тӯҳфа', to: '/catalog', emoji: '🎁' },
  { name: 'Аксессуар', to: '/category/2', emoji: '🕶️' },
  { name: 'Дини', to: '/catalog', emoji: '🌙' },
  { name: 'Мошин', to: '/catalog', emoji: '🚗' },
  { name: 'Пойафзол', to: '/category/9', emoji: '👟' },
  { name: 'Мебел', to: '/category/4', emoji: '🛋️' },
  { name: 'Ҳайвонот', to: '/catalog', emoji: '🐾' },
  { name: 'Заргарӣ', to: '/category/5', emoji: '💍' },
  { name: 'Таъмир', to: '/category/3', emoji: '🔧' },
  { name: 'Хӯрокворӣ', to: '/category/1', emoji: '🍯' },
  { name: 'Либос', to: '/category/2', emoji: '👗' },
]

export default function Categories() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return tiles
    return tiles.filter((tile) => tile.name.toLowerCase().includes(text))
  }, [query])

  return (
    <div className="page cats-page">
      <header className="cats-head">
        <button type="button" aria-label="Бозгашт" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 5 8 12l7 7" /></svg>
        </button>
        <h1>Категория</h1>
      </header>
      <form className="cats-search" onSubmit={(event) => event.preventDefault()}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ҷустуҷӯи категория" aria-label="Ҷустуҷӯи категория" />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </form>
      {shown.length === 0 && <p className="search-empty">Категория ёфт нашуд</p>}
      <div className="cats-grid">
        {shown.map((tile) => (
          <Link key={tile.name} to={tile.to} className="cat-tile">
            <span>{tile.emoji}</span>
            {tile.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
