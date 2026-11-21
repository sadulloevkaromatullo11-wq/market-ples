import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { discountPercent, effective, mediaUrl, money, STATUS } from './format'
import { toggleFav, useFavs } from './favs'
import { useApp } from './store'

export function Photo({ src, emoji, hue = '#c44914', alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-line ${className}`} style={{ background: `linear-gradient(160deg, ${hue}, #2a2118)` }}>
      {src && !failed ? (
        <img src={mediaUrl(src)} alt={alt} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-4xl">{emoji || '📦'}</span>
      )}
    </div>
  )
}

export function Stars({ value = 0 }) {
  const width = `${(Math.max(0, Math.min(5, Number(value) || 0)) / 5) * 100}%`
  return (
    <span className="stars" role="img" aria-label={`${value} аз 5`}>
      <span aria-hidden="true" style={{ width }}>★★★★★</span>
      <span aria-hidden="true">★★★★★</span>
    </span>
  )
}

export function Price({ product, className = '' }) {
  const off = discountPercent(product)
  return (
    <div className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="font-extrabold text-brand">{money(effective(product))}</span>
      {off > 0 && <span className="text-xs text-muted line-through">{money(product.price)}</span>}
    </div>
  )
}

export function MarketCard({ product, action }) {
  const off = discountPercent(product)
  return (
    <div className="min-w-0">
      <Link to={`/product/${product.id}`} className="block min-w-0">
        <div className="relative">
          <Photo src={product.images?.[0]} emoji={product.emoji} hue={product.hue} alt={product.name} className="aspect-square rounded-2xl bg-white" />
          {off > 0 && <span className="absolute left-2 top-2 rounded-lg bg-[#ff2d2d] px-1.5 py-0.5 text-[11px] font-extrabold text-white">-{off}%</span>}
        </div>
        <div className="px-0.5 pt-2">
          <div className="text-[18px] font-extrabold leading-none text-[#2f7bff]">{money(effective(product))}</div>
          {off > 0 && <span className="text-xs text-muted line-through">{money(product.price)}</span>}
          <div className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug">{product.name}</div>
          <div className="mt-1 text-[11px] font-bold text-muted">✓ {product.sold || 0} фурӯхта шуд</div>
        </div>
      </Link>
      {action}
    </div>
  )
}

export function ProductCard({ product }) {
  const off = discountPercent(product)
  const favs = useFavs()
  const liked = favs.includes(product.id)
  return (
    <div className="relative min-w-0">
      <button type="button" className="fav-btn" aria-label="Дӯстдошта" onClick={() => toggleFav(product.id)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" /></svg>
      </button>
      <Link to={`/product/${product.id}`} className="block min-w-0">
      <div className="relative">
        <Photo src={product.images?.[0]} emoji={product.emoji} hue={product.hue} alt={product.name} className="aspect-square rounded-2xl" />
        {off > 0 && <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-[11px] font-extrabold text-white">-{off}%</span>}
        {product.stock === 0 && <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/80 py-1 text-center text-[11px] font-bold text-bg">Нест</span>}
      </div>
      <div className="px-0.5 pt-2">
        <div className="line-clamp-2 text-[13px] font-semibold leading-tight">{product.name}</div>
        <Price product={product} className="mt-1 text-[15px]" />
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
          <Stars value={product.rating} />
          <span>{product.reviewCount || 0}</span>
        </div>
      </div>
      </Link>
    </div>
  )
}

export function Qty({ value, onChange, max = 20 }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-surface">
      <button type="button" className="h-9 w-9 text-lg font-bold" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Кам кардан">−</button>
      <span className="w-6 text-center text-sm font-extrabold">{value}</span>
      <button type="button" className="h-9 w-9 text-lg font-bold" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Зиёд кардан">+</button>
    </div>
  )
}

export function Pill({ status, map = STATUS }) {
  return <span className={`pill ${status}`}>{map[status] || status}</span>
}

export function Sheet({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <>
      <button className="scrim" onClick={onClose} aria-label="Пӯшидан" />
      <div className="sheet">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && <h3 className="mb-3 text-lg font-extrabold">{title}</h3>}
        {children}
      </div>
    </>
  )
}

const DISTRICTS = [
  { id: 'somoni', name: 'И. Сомонӣ', full: 'Исмоили Сомонӣ', lat: 38.573, lng: 68.786 },
  { id: 'sino', name: 'Сино', full: 'Сино', lat: 38.555, lng: 68.748 },
  { id: 'firdavsi', name: 'Фирдавсӣ', full: 'Фирдавсӣ', lat: 38.52, lng: 68.75 },
  { id: 'shoh', name: 'Шоҳмансур', full: 'Шоҳмансур', lat: 38.585, lng: 68.8 },
]

export function CityMap({ value, onChange }) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold">Харитаи Душанбе</div>
      <div className="relative grid grid-cols-2 gap-2 rounded-3xl bg-[#d5efe3] p-2 dark:bg-[#1a2b24]">
        <div className="pointer-events-none absolute inset-y-3 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-[#f4f0e8]/80" />
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#f4f0e8]/80" />
        {DISTRICTS.map((district) => (
          <button
            key={district.id}
            type="button"
            onClick={() => onChange(district)}
            className={`relative z-10 h-[72px] rounded-2xl text-sm font-extrabold ${value === district.full ? 'bg-brand text-brandInk' : 'bg-surface/90'}`}
          >
            {district.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function NavIcon({ name, filled = false }) {
  const common = { fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: filled ? 0 : 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      {name === 'home' && <path {...common} d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />}
      {name === 'globe' && <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-6-3.8-9S9.5 5.8 12 3Z" />}
      {name === 'grid' && <path {...common} d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" />}
      {name === 'basket' && <path fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} d="M6.5 9h11l-.8 10.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6.5 9Zm2.2 0 1.2-3h4.2l1.2 3M9 13v4M12 13v4M15 13v4" />}
      {name === 'heart' && <path fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />}
      {name === 'bag' && <path {...common} d="M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0" />}
      {name === 'box' && <path {...common} d="M4 8l8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8M12 12v8" />}
      {name === 'user' && (filled
        ? <path fill="currentColor" d="M12 12.2a3.3 3.3 0 1 0-3.3-3.3A3.3 3.3 0 0 0 12 12.2Zm-6.1 7.2a6.1 6.1 0 0 1 12.2 0Z" />
        : <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Zm-6.5 8a6.5 6.5 0 0 1 13 0" />)}
      {name === 'chart' && <path {...common} d="M5 19V10M12 19V5M19 19v-7" />}
    </svg>
  )
}

export function BottomNav() {
  const { pathname } = useLocation()
  const { cartCount, user, vendor } = useApp()
  const vendorMode = pathname.startsWith('/vendor') && vendor?.status === 'approved'
  const adminMode = pathname.startsWith('/admin') && user?.role === 'admin'
  const items = adminMode
    ? [
        ['/admin', 'Омор', 'chart'],
        ['/admin/vendors', 'Дӯконҳо', 'box'],
        ['/admin/products', 'Молҳо', 'grid'],
        ['/admin/users', 'Корбарон', 'user'],
      ]
    : vendorMode
      ? [
          ['/vendor', 'Обзор', 'chart'],
          ['/vendor/products', 'Молҳо', 'grid'],
          ['/vendor/orders', 'Фармоиш', 'box'],
          ['/profile', 'Профил', 'user'],
        ]
      : [
          ['/', 'Асосӣ', 'home'],
          ['/catalog', 'Каталог', 'globe'],
          ['/cart', 'Сабад', 'basket'],
          ['/saved', 'Дӯстдошта', 'heart'],
          ['/profile', 'Профил', 'user'],
        ]
  const activeFor = (to) => {
    if (to === '/' || to === '/vendor' || to === '/admin') return pathname === to
    if (to === '/catalog') return pathname === '/catalog' || pathname.startsWith('/category')
    if (to === '/vendor/products') return pathname.startsWith('/vendor/products') || pathname.startsWith('/vendor/edit')
    return pathname === to || pathname.startsWith(`${to}/`)
  }
  const market = !adminMode && !vendorMode
  if (market) {
    return (
      <nav className="dock">
        {items.map(([to, label, icon]) => {
          const active = activeFor(to)
          return (
            <Link key={to} to={to} className={`dock-link ${active ? 'active' : ''}`} aria-label={label}>
              <span className="bubble"><NavIcon name={icon} filled={active && ['home', 'basket', 'heart', 'user'].includes(icon)} /></span>
              {to === '/catalog' && <span className="absolute right-1 top-0 rounded-full bg-[#ff2d2d] px-1 text-[8px] font-extrabold leading-3 text-white">NEW</span>}
              {to === '/cart' && cartCount > 0 && <span className="absolute right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff2d2d] px-1 text-[9px] font-extrabold text-white">{cartCount}</span>}
            </Link>
          )
        })}
      </nav>
    )
  }
  return (
    <nav className="bottom-nav">
      {items.map(([to, label, icon]) => {
        return (
          <Link key={to} to={to} className={`nav-link ${activeFor(to) ? 'active' : ''}`}>
            <span className="relative">
              <NavIcon name={icon} />
              {to === '/cart' && cartCount > 0 && (
                <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-brandInk">{cartCount}</span>
              )}
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function PageHead({ title, back, action }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg/90 px-3 backdrop-blur">
      {back ? (
        <button type="button" onClick={back} className="grid h-10 w-10 place-items-center rounded-full bg-surface" aria-label="Бозгашт">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 5 8 12l7 7" /></svg>
        </button>
      ) : <span className="w-2" />}
      <h1 className="truncate text-lg font-extrabold">{title}</h1>
      <div className="ml-auto">{action}</div>
    </header>
  )
}

export function Empty({ title, text, action }) {
  return (
    <div className="card mx-4 mt-8 px-5 py-8 text-center">
      <div className="text-3xl">🧺</div>
      <h2 className="mt-2 text-lg font-extrabold">{title}</h2>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
