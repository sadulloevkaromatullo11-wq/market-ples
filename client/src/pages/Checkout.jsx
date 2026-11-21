import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CityMap, PageHead, Photo } from '../components'
import { api } from '../api'
import { effective, money, variantText } from '../format'
import { useApp } from '../store'

export default function Checkout() {
  const navigate = useNavigate()
  const { refreshCart, showToast } = useApp()
  const [cart, setCart] = useState(null)
  const [buyNow, setBuyNow] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [district, setDistrict] = useState('')
  const [coords, setCoords] = useState({ lat: null, lng: null })
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [pay, setPay] = useState('cash')
  const [keep, setKeep] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('buynow')
    api('/addresses').then((data) => {
      setAddresses(data.addresses)
      const first = data.addresses[0]
      if (first) {
        setDistrict(first.district)
        setText(first.text)
        setCoords({ lat: first.lat, lng: first.lng })
      }
    }).catch(() => {})
    if (raw) {
      const parsed = JSON.parse(raw)
      api(`/products/${parsed.productId}`).then((data) => setBuyNow({ ...parsed, product: data.product })).catch((err) => showToast(err.message))
    } else {
      refreshCart().then(setCart)
    }
  }, [])

  const lines = buyNow
    ? [{ id: 'now', name: buyNow.product.name, emoji: buyNow.product.emoji, hue: buyNow.product.hue, image: buyNow.product.images?.[0], qty: buyNow.qty, variant: buyNow.variant, line: effective(buyNow.product) * buyNow.qty }]
    : (cart?.items || []).filter((item) => item.product).map((item) => ({ ...item, name: item.product.name, emoji: item.product.emoji, hue: item.product.hue, image: item.product.images?.[0] }))
  const subtotal = lines.reduce((sum, item) => sum + item.line, 0)
  const delivery = subtotal === 0 || subtotal >= 200 ? 0 : 15

  const chooseSaved = (address) => {
    setDistrict(address.district)
    setText(address.text)
    setCoords({ lat: address.lat, lng: address.lng })
  }

  const submit = async () => {
    if (!district || text.trim().length < 4) return showToast('Суроғаро пурра кунед')
    if (!lines.length) return showToast('Сабад холӣ аст')
    setBusy(true)
    try {
      const address = { district, text: text.trim(), lat: coords.lat, lng: coords.lng }
      if (keep && !addresses.some((item) => item.district === district && item.text === address.text)) {
        await api('/addresses', { method: 'POST', body: address })
      }
      const result = await api('/orders', {
        method: 'POST',
        body: { address, paymentMethod: pay, note, buyNow: buyNow ? { productId: buyNow.productId, qty: buyNow.qty, variant: buyNow.variant } : undefined },
      })
      sessionStorage.removeItem('buynow')
      await refreshCart()
      showToast('Фармоиш қабул шуд')
      navigate(pay === 'card' ? `/pay/${result.groupId}` : '/orders')
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHead title="Фармоиш" back={() => navigate(-1)} />
      <div className="grid gap-3 px-4 pt-4">
        <section className="card p-3">
          {lines.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-1">
              <Photo src={item.image} emoji={item.emoji} hue={item.hue} alt="" className="h-12 w-12 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{item.name}</div>
                <div className="text-xs text-muted">{variantText(item.variant)} · {item.qty} адад</div>
              </div>
              <b className="text-sm">{money(item.line)}</b>
            </div>
          ))}
          <div className="mt-2 flex justify-between font-extrabold"><span>Ҷамъ</span><span>{money(subtotal + delivery)}</span></div>
          <div className="text-xs text-muted">Расонидан: {delivery ? money(delivery) : 'ройгон'}</div>
        </section>

        <section className="card grid gap-3 p-3">
          <CityMap value={district} onChange={(item) => { setDistrict(item.full); setCoords({ lat: item.lat, lng: item.lng }) }} />
          {addresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {addresses.map((address) => (
                <button key={address.id} className={`chip ${text === address.text ? 'on' : ''}`} onClick={() => chooseSaved(address)}>{address.district}</button>
              ))}
            </div>
          )}
          <label className="text-sm font-bold">Суроғаи матнӣ
            <textarea className="mt-1" rows={2} placeholder="кӯча, хона, ҳуҷра" value={text} onChange={(event) => setText(event.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-4 w-4" checked={keep} onChange={(event) => setKeep(event.target.checked)} />
            Суроғаро нигоҳ дор
          </label>
          <label className="text-sm font-bold">Эзоҳ барои фурӯшанда
            <input className="mt-1" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Масалан, пеш аз омадан занг занед" />
          </label>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <button className={`card p-3 text-left ${pay === 'cash' ? 'outline outline-2 outline-brand' : ''}`} onClick={() => setPay('cash')}>
            <b>Нақд</b>
            <div className="text-xs text-muted">Ҳангоми расонидан</div>
          </button>
          <button className={`card p-3 text-left ${pay === 'card' ? 'outline outline-2 outline-brand' : ''}`} onClick={() => setPay('card')}>
            <b>Корти бонкӣ</b>
            <div className="text-xs text-muted">Дарвозаи пардохт</div>
          </button>
        </section>
        <button className="btn" disabled={busy} onClick={submit}>{busy ? 'Интизор шавед…' : 'Тасдиқи фармоиш'}</button>
      </div>
    </div>
  )
}

export function Pay() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useApp()
  const [info, setInfo] = useState(null)
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvc: '' })
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/orders/group/${groupId}`).then(setInfo).catch((err) => showToast(err.message))
  }, [groupId])

  const formatCard = (value) => value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  }

  const pay = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await api(`/pay/${groupId}`, { method: 'POST', body: { ...card, cardNumber: card.cardNumber.replace(/\s/g, '') } })
      setDone(true)
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="page px-5 pt-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-good text-3xl text-white">✓</div>
        <h1 className="mt-4 text-2xl font-extrabold">Пардохт шуд</h1>
        <p className="mt-2 text-sm text-muted">Фурӯшанда огоҳ шуд. Статусро дар таърихи фармоиш бинед.</p>
        <button className="btn mt-6" onClick={() => navigate('/orders')}>Ба фармоишҳо</button>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead title="Пардохт" back={() => navigate('/orders')} />
      <form className="grid gap-3 px-4 pt-4" onSubmit={pay}>
        <div className="rounded-3xl bg-ink p-5 text-bg">
          <div className="text-xs font-bold opacity-70">Маблағ</div>
          <div className="text-3xl font-extrabold">{info ? money(info.amount) : '…'}</div>
          <div className="mt-6 font-mono text-lg tracking-widest">{card.cardNumber || '•••• •••• •••• ••••'}</div>
        </div>
        <input inputMode="numeric" placeholder="Рақами корт" value={card.cardNumber} onChange={(event) => setCard({ ...card, cardNumber: formatCard(event.target.value) })} />
        <div className="grid grid-cols-2 gap-2">
          <input inputMode="numeric" placeholder="ММ/СС" value={card.expiry} onChange={(event) => setCard({ ...card, expiry: formatExpiry(event.target.value) })} />
          <input inputMode="numeric" placeholder="CVC" value={card.cvc} onChange={(event) => setCard({ ...card, cvc: event.target.value.replace(/\D/g, '').slice(0, 3) })} />
        </div>
        <p className="text-xs text-muted">Санҷиш: ҳар 16 рақам, масалан 8600 0000 0000 0000, мӯҳлат 12/28, CVC 123. Маблағи ҳақиқӣ гирифта намешавад.</p>
        <button className="btn" disabled={busy || !info}>{busy ? 'Пардохт…' : 'Пардохтан'}</button>
      </form>
    </div>
  )
}
