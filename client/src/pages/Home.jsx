import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductCard } from '../components'
import { api } from '../api'
import { useApp } from '../store'

function Section({ title, to, children }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-end justify-between px-4">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {to && <Link to={to} className="text-sm font-extrabold text-brand">Ҳама</Link>}
      </div>
      {children}
    </section>
  )
}

function TravelArt() {
  return (
    <svg viewBox="0 0 120 90" className="h-[86px] w-[108px]" aria-hidden="true">
      <rect x="8" y="18" width="46" height="58" rx="8" fill="#7CFF6B" transform="rotate(-8 31 47)" />
      <rect x="22" y="22" width="46" height="58" rx="8" fill="#FFE14A" transform="rotate(6 45 51)" />
      <rect x="18" y="28" width="52" height="54" rx="10" fill="#3aa0ff" />
      <rect x="30" y="18" width="28" height="12" rx="4" fill="#7ec8ff" />
      <circle cx="32" cy="74" r="5" fill="#16325c" />
      <circle cx="56" cy="74" r="5" fill="#16325c" />
      <path d="M78 34h28l-6 8h-16l8 6 10 18-8 3-12-16-8 5 2-10-10-6 8-3 4-5z" fill="#eaf6ff" />
    </svg>
  )
}

function BagsArt() {
  return (
    <svg viewBox="0 0 120 110" className="h-[92px] w-[100px]" aria-hidden="true">
      <path d="M28 48h34l-4 48H32L28 48z" fill="#2f7bff" />
      <path d="M38 48c0-8 14-8 14 0" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M58 42h36l-4 56H62L58 42z" fill="#16325c" />
      <path d="M70 42c0-9 16-9 16 0" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="78" cy="70" r="8" fill="#ff4d6d" />
      <circle cx="92" cy="78" r="6" fill="#ffe14a" />
    </svg>
  )
}

export default function Home() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    api('/home').then(setData).catch((err) => setError(err.message))
  }, [])

  const roots = (data?.categories || []).filter((category) => !category.parentId)
  const search = (event) => {
    event.preventDefault()
    const text = query.trim()
    navigate(text ? `/catalog?q=${encodeURIComponent(text)}` : '/catalog')
  }

  return (
    <div className="page bg-bg">
      <div className="lak-top">
        <div className="flex items-center gap-2">
          <button type="button" className="lak-menu" aria-label="Категорияҳо" onClick={() => navigate('/categories')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
          </button>
          <form className="lak-search" onSubmit={search}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa6b5" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input readOnly value={query} onClick={() => navigate('/search')} placeholder="Ҷустуҷӯ дар Дукон..." aria-label="Ҷустуҷӯ" />
            <button type="button" className="lak-cam" aria-label="Ҷустуҷӯ бо акс" onClick={() => showToast('Ҷустуҷӯ бо акс ба зудӣ')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8"><path d="M4 8h3l2-2h6l2 2h3v11H4V8z" /><circle cx="12" cy="13" r="3.2" /></svg>
            </button>
          </form>
        </div>

        <div
          className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth || 1
            setSlide(Math.round(event.currentTarget.scrollLeft / width))
          }}
        >
          <Link to="/catalog" className="promo flex min-w-full snap-start items-center gap-2 bg-gradient-to-r from-[#3d95ff] to-[#67b4ff] px-3 py-3 text-white">
            <TravelArt />
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-[#ff3b5c] px-2 py-0.5 text-[11px] font-extrabold">Нав</span>
              <div className="mt-1 text-[22px] font-extrabold leading-none">Дукон Сафар</div>
              <div className="mt-1 text-[13px] text-white/90">Сафари шумо аз ин ҷо оғоз мешавад</div>
            </div>
            <span className="shrink-0 rounded-full bg-white/25 px-3 py-2 text-sm font-extrabold">Гузаштан ›</span>
          </Link>
          <Link to="/catalog?sale=1" className="promo sale-slide relative min-w-full snap-start">
            <div className="sale-band" />
            <span className="sale-chip left-3 top-2">90%</span>
            <span className="sale-chip right-3 top-2">78%</span>
            <span className="sale-chip left-4 bottom-2.5">55%</span>
            <span className="sale-chip left-[34%] bottom-2">30%</span>
            <div className="sale-word">ТАХФИФ</div>
            <div className="sale-bags"><BagsArt /></div>
          </Link>
        </div>
        <div className="flex justify-center gap-1 pb-1">
          {[0, 1].map((index) => <span key={index} className={`h-1.5 rounded-full ${slide === index ? 'w-4 bg-white' : 'w-1.5 bg-white/55'}`} />)}
        </div>
      </div>

      {error && <p className="px-4 pt-4 text-sm font-semibold text-sale">{error}</p>}
      {!data && !error && <div className="mx-4 mt-4 h-28 animate-pulse rounded-3xl bg-line" />}

      {data && (
        <>
          <div className="home-cats mt-4 grid grid-cols-4 gap-2 px-4">
            {roots.map((category) => (
              <Link key={category.id} to={`/category/${category.id}`} className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface text-2xl shadow-card">{category.icon}</div>
                <div className="mt-1 text-[11px] font-bold leading-tight">{category.name}</div>
              </Link>
            ))}
          </div>

          <Section title="Аксияҳо" to="/catalog?sale=1">
            <div className="sale-row no-scrollbar flex gap-3 overflow-x-auto px-4">
              {data.sales.map((product) => <div key={product.id} className="w-36 shrink-0"><ProductCard product={product} /></div>)}
            </div>
          </Section>

          <Section title="Маҳсулоти топ" to="/catalog?sort=rating">
            <div className="shelf grid grid-cols-2 gap-x-3 gap-y-4 px-4">
              {data.top.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </Section>

          <Section title="Навтаринҳо" to="/catalog?sort=new">
            <div className="shelf grid grid-cols-2 gap-x-3 gap-y-4 px-4">
              {data.fresh.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </Section>
        </>
      )}

    </div>
  )
}
