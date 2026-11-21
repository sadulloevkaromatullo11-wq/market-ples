import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Empty, MarketCard, PageHead, ProductCard, Sheet } from '../components'
import { api } from '../api'
import { useApp } from '../store'

const sorts = [
  ['new', 'Нав'],
  ['price_asc', 'Арзон'],
  ['price_desc', 'Қимат'],
  ['rating', 'Рейтинг'],
]

function DevicesArt() {
  return (
    <svg viewBox="0 0 180 120" className="h-[108px] w-[160px]" aria-hidden="true">
      <rect x="8" y="28" width="78" height="52" rx="8" fill="#ff8a3d" />
      <rect x="14" y="34" width="66" height="36" rx="4" fill="#ffe7c2" />
      <rect x="36" y="80" width="22" height="6" rx="2" fill="#ff8a3d" />
      <rect x="96" y="18" width="72" height="46" rx="6" fill="#2f7bff" />
      <rect x="102" y="24" width="60" height="34" rx="3" fill="#d7e8ff" />
      <rect x="118" y="66" width="28" height="5" rx="2" fill="#2f7bff" />
      <rect x="70" y="70" width="46" height="34" rx="8" fill="#16325c" />
      <circle cx="93" cy="84" r="6" fill="#ffd36a" />
    </svg>
  )
}

function Market() {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [source, setSource] = useState(params.get('source') === 'bozor' || params.get('source') === 'shop' ? params.get('source') : 'opt')
  const [chip, setChip] = useState('all')
  const [error, setError] = useState('')
  const q = params.get('q') || ''

  useEffect(() => {
    api('/categories').then((data) => setCategories(data.categories || [])).catch(() => {})
    api('/products')
      .then((data) => setProducts(data.products || []))
      .catch((err) => setError(err.message))
  }, [])

  const roots = categories.filter((category) => !category.parentId)
  const chips = [{ id: 'all', name: 'Барои шумо' }, ...roots.map((category) => ({ id: String(category.id), name: category.name }))]

  const shown = useMemo(() => {
    const sourceRoots = source === 'bozor' ? [1, 4, 5, 6] : source === 'shop' ? [2, 3] : null
    return (products || []).filter((product) => {
      if (params.get('sale') === '1' && !product.discountPrice) return false
      if (q && !product.name.toLowerCase().includes(q.toLowerCase())) return false
      const category = categories.find((item) => item.id === product.categoryId)
      const root = category?.parentId || category?.id
      if (sourceRoots && !sourceRoots.includes(root)) return false
      if (chip !== 'all' && String(root) !== chip && String(product.categoryId) !== chip) return false
      return true
    })
  }, [products, categories, source, chip, q, params])

  const search = (event) => {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('q')
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    setParams(next)
  }

  return (
    <div className="page market">
      <div className="market-hero">
        <div>
          <div className="market-brand">ОПТ</div>
          <div className="market-sub">Нархи яклухт</div>
        </div>
        <DevicesArt />
      </div>
      <form className="market-search" onSubmit={search}>
        <span className="grid h-9 w-9 place-items-center text-[#98a2b3]" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" /></svg>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa6b5" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input name="q" defaultValue={q} key={q} placeholder="Ҷустуҷӯ" aria-label="Ҷустуҷӯ" onFocus={() => navigate('/search')} />
        <button type="button" className="grid h-9 w-9 place-items-center" aria-label="Ҷустуҷӯ бо акс" onClick={() => showToast('Ҷустуҷӯ бо акс ба зудӣ')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8"><path d="M4 8h3l2-2h6l2 2h3v11H4V8z" /><circle cx="12" cy="13" r="3.2" /></svg>
        </button>
      </form>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        {[
          ['opt', 'Опт'],
          ['bozor', 'Бозор'],
          ['shop', 'Дӯкон'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={`source-pill ${source === id ? 'on' : ''}`} onClick={() => setSource(id)}>
            {id === 'opt' && <span className="source-mark">О</span>}
            {label}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto px-4">
        {chips.map((item) => (
          <button key={item.id} type="button" className={`market-chip ${chip === item.id ? 'on' : ''}`} onClick={() => setChip(item.id)}>{item.name}</button>
        ))}
      </div>

      {error && <p className="px-4 pt-4 text-sm font-semibold text-sale">{error}</p>}
      {!products && !error && <div className="grid grid-cols-2 gap-3 px-4 pt-4">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[3/4] animate-pulse rounded-2xl bg-line" />)}</div>}
      {products && shown.length === 0 && <Empty title="Чизе ёфт нашуд" text="Ном ё бахшро иваз кунед." />}
      {products && shown.length > 0 && (
        <div className="shelf grid grid-cols-2 gap-x-3 gap-y-5 px-4 pt-4">
          {shown.map((product) => <MarketCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  )
}

function CatalogList() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ min: '', max: '', rating: '', sort: 'new' })
  const [error, setError] = useState('')

  const queryKey = `${id || ''}|${params.toString()}`

  useEffect(() => {
    api('/categories').then((data) => setCategories(data.categories)).catch(() => {})
  }, [])

  useEffect(() => {
    const qs = new URLSearchParams(params)
    if (id) qs.set('category', id)
    setError('')
    setProducts(null)
    api(`/products?${qs.toString()}`)
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
  }, [queryKey])

  const current = categories.find((category) => String(category.id) === String(id))
  const subs = categories.filter((category) => String(category.parentId) === String(id))
  const q = params.get('q') || ''
  const title = current?.name || (params.get('sale') === '1' ? 'Аксияҳо' : q ? `«${q}»` : 'Каталог')

  const apply = () => {
    const next = new URLSearchParams(params)
    ;['min', 'max', 'rating', 'sort'].forEach((key) => {
      if (draft[key]) next.set(key, draft[key])
      else next.delete(key)
    })
    if (draft.sort === 'new') next.delete('sort')
    setParams(next)
    setOpen(false)
  }

  const clearFilters = () => {
    const next = new URLSearchParams(params)
    ;['min', 'max', 'rating', 'sort'].forEach((key) => next.delete(key))
    setDraft({ min: '', max: '', rating: '', sort: 'new' })
    setParams(next)
    setOpen(false)
  }

  return (
    <div className="page">
      <PageHead
        title={title}
        back={() => navigate(-1)}
        action={<button className="chip" onClick={() => { setDraft({ min: params.get('min') || '', max: params.get('max') || '', rating: params.get('rating') || '', sort: params.get('sort') || 'new' }); setOpen(true) }}>Филтр</button>}
      />
      <form className="px-4 pt-3" onSubmit={(event) => {
        event.preventDefault()
        const value = new FormData(event.currentTarget).get('q')
        const next = new URLSearchParams(params)
        if (value) next.set('q', value)
        else next.delete('q')
        setParams(next)
      }}>
        <input name="q" defaultValue={q} key={q} placeholder="Номи маҳсулот" aria-label="Ҷустуҷӯ" />
      </form>

      {subs.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
          <button className={`chip ${!subs.some((item) => params.get('sub') === String(item.id)) ? 'on' : ''}`} onClick={() => navigate(`/category/${id}`)}>Ҳама</button>
          {subs.map((category) => (
            <button key={category.id} className="chip" onClick={() => navigate(`/category/${category.id}`)}>{category.icon} {category.name}</button>
          ))}
        </div>
      )}

      {error && <p className="px-4 pt-4 text-sm font-semibold text-sale">{error}</p>}
      {products && <p className="px-4 pt-3 text-xs font-bold text-muted">{products.length} маҳсулот</p>}
      {!products && !error && <div className="grid grid-cols-2 gap-3 px-4 pt-4">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[3/4] animate-pulse rounded-2xl bg-line" />)}</div>}
      {products && products.length === 0 && <Empty title="Чизе ёфт нашуд" text="Филтр ё номро иваз кунед." />}
      {products && products.length > 0 && (
        <div className="shelf grid grid-cols-2 gap-x-3 gap-y-4 px-4 pt-3">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}

      <Sheet open={open} title="Филтрҳо" onClose={() => setOpen(false)}>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm font-bold">Аз нарх<input className="mt-1" inputMode="numeric" value={draft.min} onChange={(event) => setDraft({ ...draft, min: event.target.value.replace(/\D/g, '') })} /></label>
          <label className="text-sm font-bold">То нарх<input className="mt-1" inputMode="numeric" value={draft.max} onChange={(event) => setDraft({ ...draft, max: event.target.value.replace(/\D/g, '') })} /></label>
        </div>
        <div className="mt-4 text-sm font-bold">Рейтинг</div>
        <div className="mt-2 flex gap-2">
          {[['', 'Ҳама'], ['3', '3+'], ['4', '4+']].map(([value, label]) => (
            <button key={label} className={`chip ${draft.rating === value ? 'on' : ''}`} onClick={() => setDraft({ ...draft, rating: value })}>{label}</button>
          ))}
        </div>
        <div className="mt-4 text-sm font-bold">Мураттаб</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {sorts.map(([value, label]) => (
            <button key={value} className={`chip ${draft.sort === value ? 'on' : ''}`} onClick={() => setDraft({ ...draft, sort: value })}>{label}</button>
          ))}
        </div>
        <button className="btn mt-5" onClick={apply}>Нишон додан</button>
        <button className="btn ghost mt-2" onClick={clearFilters}>Тоза кардан</button>
      </Sheet>
    </div>
  )
}

export default function Catalog() {
  const { id } = useParams()
  return id ? <CatalogList /> : <Market />
}
