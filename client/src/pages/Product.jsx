import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Photo, Stars } from '../components'
import { api } from '../api'
import { effective, money, when } from '../format'
import { toggleFav, useFavs } from '../favs'
import { useApp } from '../store'

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, refreshCart, cartCount } = useApp()
  const favs = useFavs()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [qty] = useState(1)
  const [variant, setVariant] = useState({})
  const [review, setReview] = useState({ rating: 5, text: '' })
  const [busy, setBusy] = useState(false)

  const load = () => api(`/products/${id}`).then((data) => {
    setProduct(data.product)
    const initial = {}
    for (const attribute of data.product.attributes || []) initial[attribute.name] = attribute.values[0]
    setVariant(initial)
  }).catch((err) => setError(err.message))

  useEffect(() => { setProduct(null); setError(''); load() }, [id])

  const add = async (buyNow = false) => {
    if (!product || product.stock < 1) return
    setBusy(true)
    try {
      if (buyNow) {
        sessionStorage.setItem('buynow', JSON.stringify({ productId: product.id, qty, variant }))
        navigate('/checkout')
      } else {
        await api('/cart', { method: 'POST', body: { productId: product.id, qty, variant } })
        await refreshCart()
        showToast('Ба сабад илова шуд')
      }
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusy(false)
    }
  }

  const sendReview = async (event) => {
    event.preventDefault()
    try {
      const data = await api(`/products/${id}/reviews`, { method: 'POST', body: review })
      setProduct(data.product)
      setReview({ rating: 5, text: '' })
      showToast('Шарҳ сабт шуд')
    } catch (err) {
      showToast(err.message)
    }
  }

  if (error) return <div className="page px-4 pt-16 text-center"><p className="font-bold">{error}</p><button className="btn mt-4" onClick={() => navigate('/')}>Ба асосӣ</button></div>
  if (!product) return <div className="page"><div className="aspect-square animate-pulse bg-line" /></div>

  const shots = product.images?.length ? product.images : [null]
  const liked = favs.includes(product.id)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, url })
      else {
        await navigator.clipboard.writeText(url)
        showToast('Пайванд нусха шуд')
      }
    } catch { /* бекор шуд */ }
  }

  return (
    <div className="product-page pb-28">
      <header className="product-top">
        <button type="button" onClick={() => navigate(-1)} aria-label="Бозгашт">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 5 8 12l7 7" /></svg>
        </button>
        <Link to="/cart" className="relative" aria-label="Сабад">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6.5 9h11l-.8 10.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6.5 9Zm2.2 0 1.2-3h4.2l1.2 3" /></svg>
          {cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#2f7bff] px-1 text-[9px] font-extrabold text-white">{cartCount}</span>}
        </Link>
      </header>
      <div className="product-layout">
      <div className="relative bg-white">
        <div className="no-scrollbar flex snap-x overflow-x-auto">
          {shots.map((src, index) => (
            <Photo key={index} src={src} emoji={product.emoji} hue={product.hue} alt={product.name} className="aspect-square w-full shrink-0 snap-center" />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-start gap-3">
          <h1 className="min-w-0 flex-1 text-[18px] font-extrabold leading-snug">{product.name}</h1>
          <button type="button" className="product-tool" aria-label="Дӯстдошта" onClick={() => toggleFav(product.id)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? '#2f7bff' : 'none'} stroke="#2f7bff" strokeWidth="1.8"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" /></svg>
          </button>
          <button type="button" className="product-tool" aria-label="Мубодила" onClick={share}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f7bff" strokeWidth="1.8"><path d="M12 4v10M8 8l4-4 4 4M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" /></svg>
          </button>
        </div>
        <div className="mt-3 text-sm">
          <div>Артикул: <b>{String(product.id).padStart(6, '0')}</b></div>
          <div className="mt-1">Миқдор: <b>{product.stock > 0 ? `Дар анбор (${product.stock})` : 'Нест'}</b></div>
        </div>
        <Link to={`/catalog?vendor=${product.vendor?.id || ''}`} className="mt-2 inline-block text-sm font-extrabold text-good">{product.vendor?.shopName}</Link>

        {(product.attributes || []).map((attribute) => (
          <div key={attribute.name} className="mt-4">
            <div className="text-sm">{attribute.name}: <b>{variant[attribute.name]}</b></div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {attribute.values.map((value, index) => (
                <button key={value} type="button" className={`variant-shot ${variant[attribute.name] === value ? 'on' : ''}`} onClick={() => setVariant({ ...variant, [attribute.name]: value })}>
                  <Photo src={shots[index] || shots[0]} emoji={product.emoji} hue={product.hue} alt={value} className="h-14 w-14" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

        <h2 className="mt-6 text-lg font-extrabold">Шарҳҳо</h2>
        <div className="mt-3 grid gap-2">
          {(product.reviews || []).length === 0 && <p className="text-sm text-muted">Ҳанӯз шарҳ нест. Аввалин бошед.</p>}
          {(product.reviews || []).map((item) => (
            <article key={item.id} className="card px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm">{item.author}</b>
                <Stars value={item.rating} />
              </div>
              {item.text && <p className="mt-1 text-sm">{item.text}</p>}
              <div className="mt-1 text-[11px] text-muted">{when(item.createdAt)}</div>
            </article>
          ))}
        </div>

        <form onSubmit={sendReview} className="card mt-3 grid gap-2 p-3">
          <div className="text-sm font-extrabold">Шарҳи шумо</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <button type="button" key={score} className={`chip ${review.rating === score ? 'on' : ''}`} onClick={() => setReview({ ...review, rating: score })}>{score}</button>
            ))}
          </div>
          <textarea rows={3} placeholder="Таҷрибаи харидро нависед" value={review.text} onChange={(event) => setReview({ ...review, text: event.target.value })} />
          <button className="btn" type="submit">Фиристодан</button>
        </form>
      </div>
      </div>

      <div className="buybar product-buy">
        <div>
          <div className="text-[22px] font-extrabold leading-none">{money(effective(product))}</div>
          {product.discountPrice && <div className="mt-1 text-sm font-bold text-[#e10600] line-through">{money(product.price)}</div>}
        </div>
        <button className="btn product-cart" disabled={busy || product.stock < 1} onClick={() => add(false)}>{product.stock < 1 ? 'Нест' : 'Ба сабад'}</button>
      </div>
    </div>
  )
}
