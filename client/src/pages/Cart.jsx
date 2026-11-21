import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MarketCard, PageHead, Photo, Qty } from '../components'
import { api } from '../api'
import { money, variantText } from '../format'
import { useApp } from '../store'

export default function Cart() {
  const navigate = useNavigate()
  const { refreshCart, showToast } = useApp()
  const [cart, setCart] = useState(null)

  const load = async () => {
    const data = await refreshCart()
    setCart(data)
  }

  useEffect(() => { load().catch((err) => showToast(err.message)) }, [])

  const setQty = async (item, qty) => {
    try {
      const data = await api('/cart', { method: 'PATCH', body: { itemId: item.id, qty } })
      setCart(data)
      await refreshCart()
    } catch (err) {
      showToast(err.message)
    }
  }

  if (!cart) return <div className="page"><PageHead title="Сабад" /><div className="mx-4 mt-4 h-28 animate-pulse rounded-2xl bg-line" /></div>
  if (!cart.items.length) {
    return (
      <div className="page cart-page">
        <h1 className="cart-title">Сабад</h1>
        <div className="cart-empty">
          <CartArt />
          <h2>Сабад холӣ аст</h2>
          <p>Молро тавассути ҷустуҷӯ ё акс ёбед.</p>
        </div>
        <Recommend onAdded={load} />
      </div>
    )
  }

  const groups = []
  for (const item of cart.items) {
    const name = item.product?.vendor?.shopName || 'Дастнорас'
    let group = groups.find((row) => row.name === name)
    if (!group) groups.push(group = { name, items: [] })
    group.items.push(item)
  }

  return (
    <div className="page">
      <PageHead title="Сабад" />
      <div className="grid gap-3 px-4 pt-4">
        {groups.map((group) => (
          <section key={group.name} className="card p-3">
            <h2 className="text-sm font-extrabold">{group.name}</h2>
            <div className="mt-2 grid gap-3">
              {group.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <Photo src={item.product?.images?.[0]} emoji={item.product?.emoji || '📦'} hue={item.product?.hue} alt="" className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-bold">{item.product?.name || 'Маҳсулот нест карда шуд'}</div>
                    {variantText(item.variant) && <div className="text-xs text-muted">{variantText(item.variant)}</div>}
                    <div className="mt-2 flex items-center justify-between">
                      <b>{item.product ? money(item.line) : '—'}</b>
                      <Qty value={item.qty} max={item.product?.stock || item.qty} onChange={(qty) => setQty(item, qty)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="card mx-4 mt-4 p-4">
        <Row label="Молҳо" value={money(cart.subtotal)} />
        <Row label="Расонидан" value={cart.delivery ? money(cart.delivery) : 'Ройгон'} />
        <div className="mt-2 text-xs text-muted">Аз 200 сомонӣ расонидан ройгон аст.</div>
        <div className="mt-3 flex items-center justify-between text-lg font-extrabold">
          <span>Ҷамъ</span><span>{money(cart.total)}</span>
        </div>
        <button className="btn mt-4" onClick={() => { sessionStorage.removeItem('buynow'); navigate('/checkout') }}>Ба фармоиш</button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between text-sm"><span className="text-muted">{label}</span><b>{value}</b></div>
}

function CartArt() {
  return (
    <svg viewBox="0 0 220 160" className="mx-auto h-36 w-52" aria-hidden="true">
      <path d="M46 118h132" fill="none" stroke="#c5d0de" strokeWidth="8" strokeLinecap="round" />
      <path d="M58 118l18-62h108" fill="none" stroke="#9aafc4" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="92" cy="132" r="10" fill="#9aafc4" />
      <circle cx="154" cy="132" r="10" fill="#9aafc4" />
      <circle cx="92" cy="132" r="4" fill="#fff" />
      <circle cx="154" cy="132" r="4" fill="#fff" />
      <rect x="78" y="48" width="42" height="52" rx="8" fill="#2f7bff" />
      <path d="M90 48c0-10 18-10 18 0" fill="none" stroke="#fff" strokeWidth="3" />
      <rect x="112" y="40" width="46" height="60" rx="8" fill="#16325c" />
      <path d="M126 40c0-12 20-12 20 0" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="132" cy="70" r="6" fill="#ff4d6d" />
      <circle cx="146" cy="78" r="5" fill="#ffe14a" />
    </svg>
  )
}

function Recommend({ onAdded }) {
  const { showToast, refreshCart } = useApp()
  const [items, setItems] = useState([])

  useEffect(() => {
    api('/home').then((data) => setItems((data.sales?.length ? data.sales : data.top || []).slice(0, 4))).catch(() => {})
  }, [])

  const add = async (product) => {
    if (!product.stock) {
      showToast('Дар анбор нест')
      return
    }
    try {
      await api('/cart', { method: 'POST', body: { productId: product.id, qty: 1 } })
      await refreshCart()
      onAdded?.()
      showToast('Ба сабад илова шуд')
    } catch (err) {
      showToast(err.message)
    }
  }

  if (!items.length) return null
  return (
    <section className="mt-2">
      <h2 className="px-4 text-lg font-extrabold">Барои шумо тавсия медиҳем</h2>
      <div className="shelf grid grid-cols-2 gap-x-3 gap-y-4 px-4 pt-3">
        {items.map((product) => (
          <MarketCard
            key={product.id}
            product={product}
            action={(
              <button type="button" className="day-btn" disabled={!product.stock} onClick={() => add(product)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6.5 9h11l-.8 10.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6.5 9Zm2.2 0 1.2-3h4.2l1.2 3" /></svg>
                {product.stock ? 'Расонидан дар як рӯз' : 'Нест'}
              </button>
            )}
          />
        ))}
      </div>
    </section>
  )
}
