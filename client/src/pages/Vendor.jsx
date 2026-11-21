import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHead, Photo, Pill } from '../components'
import { api } from '../api'
import { money, STATUS, variantText, when } from '../format'
import { useApp } from '../store'

export default function Vendor() {
  const { vendor } = useApp()
  const params = useParams()
  const path = window.location.pathname
  if (!vendor || vendor.status !== 'approved') return <Locked />
  if (params.id) return <Editor />
  if (path.endsWith('/products')) return <Products />
  if (path.endsWith('/orders')) return <VendorOrders />
  return <Overview />
}

function Locked() {
  return (
    <div className="page px-4 pt-8">
      <PageHead title="Фурӯшанда" />
      <div className="card mt-4 p-4">
        <h1 className="text-xl font-extrabold">Кабинет ҳанӯз кушода нест</h1>
        <p className="mt-2 text-sm text-muted">Аввал дархост диҳед. Админ профилро тасдиқ мекунад.</p>
        <Link to="/profile" className="btn mt-4">Ба профил</Link>
      </div>
    </div>
  )
}

function Overview() {
  const { vendor } = useApp()
  const [stats, setStats] = useState(null)
  useEffect(() => { api('/vendor/stats').then(setStats).catch(() => {}) }, [])
  const tiles = [
    ['Фурӯш', stats ? money(stats.sales) : '…'],
    ['Фармоиш', stats?.orders ?? '…'],
    ['Дар коркард', stats?.processing ?? '…'],
    ['Молҳои фаъол', stats?.products ?? '…'],
  ]
  return (
    <div className="page">
      <PageHead title={vendor.shopName} action={<Link to="/notifications" className="text-sm font-extrabold text-brand">Огоҳӣ</Link>} />
      <div className="grid grid-cols-2 gap-2 px-4 pt-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="card p-3">
            <div className="text-xs font-bold text-muted">{label}</div>
            <div className="mt-1 text-xl font-extrabold">{value}</div>
          </div>
        ))}
      </div>
      <p className="px-4 pt-3 text-sm text-muted">{vendor.description}</p>
      <div className="grid gap-2 px-4 pt-4">
        <Link className="btn" to="/vendor/products">Идораи молҳо</Link>
        <Link className="btn secondary" to="/vendor/orders">Фармоишҳои воридшуда</Link>
      </div>
    </div>
  )
}

function Products() {
  const [products, setProducts] = useState(null)
  const [armed, setArmed] = useState(null)
  const { showToast } = useApp()
  const load = () => api('/vendor/products').then((data) => setProducts(data.products))
  useEffect(() => { load().catch((err) => showToast(err.message)) }, [])

  const remove = async (id) => {
    if (armed !== id) return setArmed(id)
    await api(`/vendor/products/${id}`, { method: 'DELETE' })
    setArmed(null)
    load()
  }

  return (
    <div className="page">
      <PageHead title="Молҳо" action={<Link to="/vendor/edit/new" className="text-sm font-extrabold text-brand">Илова</Link>} />
      <div className="grid gap-2 px-4 pt-4">
        {(products || []).map((product) => (
          <article key={product.id} className="card flex gap-3 p-3">
            <Photo src={product.images?.[0]} emoji={product.emoji} hue={product.hue} alt="" className="h-16 w-16 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <b className="text-sm">{product.name}</b>
                <Pill status={product.status} />
              </div>
              <div className="text-sm text-muted">{money(product.discountPrice || product.price)} · {product.stock} адад</div>
              <div className="mt-2 flex gap-2">
                <Link className="chip" to={`/vendor/edit/${product.id}`}>Таҳрир</Link>
                <button className="chip" onClick={() => remove(product.id)}>{armed === product.id ? 'Тасдиқ' : 'Нест'}</button>
              </div>
            </div>
          </article>
        ))}
        {products && products.length === 0 && <p className="text-sm text-muted">Ҳанӯз мол нест.</p>}
      </div>
    </div>
  )
}

function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useApp()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', description: '', price: '', discountPrice: '', stock: '', categoryId: '', images: [], attributes: [] })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/categories').then((data) => setCategories(data.categories))
    if (id !== 'new') {
      api('/vendor/products').then((data) => {
        const product = data.products.find((item) => String(item.id) === String(id))
        if (!product) return showToast('Маҳсулот ёфт нашуд')
        setForm({
          name: product.name,
          description: product.description || '',
          price: String(product.price),
          discountPrice: product.discountPrice ?? '',
          stock: String(product.stock),
          categoryId: String(product.categoryId),
          images: product.images || [],
          attributes: (product.attributes || []).map((item) => ({ name: item.name, values: item.values.join(', ') })),
        })
      })
    }
  }, [id])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const upload = async (files) => {
    const body = new FormData()
    ;[...files].slice(0, 6).forEach((file) => body.append('images', file))
    const data = await api('/upload', { method: 'POST', body, form: true })
    set('images', [...form.images, ...data.urls].slice(0, 6))
  }

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
        attributes: form.attributes
          .map((item) => ({ name: item.name.trim(), values: item.values.split(',').map((value) => value.trim()).filter(Boolean) }))
          .filter((item) => item.name && item.values.length),
      }
      if (id === 'new') await api('/vendor/products', { method: 'POST', body: payload })
      else await api(`/vendor/products/${id}`, { method: 'PATCH', body: payload })
      showToast(id === 'new' ? 'Ба модерасия фиристода шуд' : 'Сабт шуд')
      navigate('/vendor/products')
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHead title={id === 'new' ? 'Моли нав' : 'Таҳрир'} back={() => navigate('/vendor/products')} />
      <form className="grid gap-3 px-4 pt-4" onSubmit={save}>
        <input placeholder="Ном" value={form.name} onChange={(event) => set('name', event.target.value)} />
        <textarea rows={4} placeholder="Тавсиф" value={form.description} onChange={(event) => set('description', event.target.value)} />
        <select className="rounded-[14px] border border-line bg-surface px-3 py-3" value={form.categoryId} onChange={(event) => set('categoryId', event.target.value)}>
          <option value="">Категория</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.parentId ? '— ' : ''}{category.name}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input inputMode="decimal" placeholder="Нарх" value={form.price} onChange={(event) => set('price', event.target.value)} />
          <input inputMode="decimal" placeholder="Бо тахфиф" value={form.discountPrice} onChange={(event) => set('discountPrice', event.target.value)} />
          <input inputMode="numeric" placeholder="Анбор" value={form.stock} onChange={(event) => set('stock', event.target.value)} />
        </div>
        <div>
          <div className="mb-2 text-sm font-extrabold">Аксҳо</div>
          <div className="flex gap-2 overflow-x-auto">
            {form.images.map((src) => <Photo key={src} src={src} className="h-20 w-20 shrink-0 rounded-xl" />)}
          </div>
          <input className="mt-2" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => upload(event.target.files).catch((err) => showToast(err.message))} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <b className="text-sm">Параметрҳо</b>
            <button type="button" className="chip" onClick={() => set('attributes', [...form.attributes, { name: '', values: '' }])}>Илова</button>
          </div>
          {form.attributes.map((attribute, index) => (
            <div key={index} className="mb-2 grid grid-cols-2 gap-2">
              <input placeholder="Ранг" value={attribute.name} onChange={(event) => {
                const next = [...form.attributes]
                next[index] = { ...attribute, name: event.target.value }
                set('attributes', next)
              }} />
              <input placeholder="Сурх, Кабуд" value={attribute.values} onChange={(event) => {
                const next = [...form.attributes]
                next[index] = { ...attribute, values: event.target.value }
                set('attributes', next)
              }} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Моли нав пеш аз нашр аз модерасия мегузарад.</p>
        <button className="btn" disabled={busy}>{busy ? 'Сабт…' : 'Сабт кардан'}</button>
      </form>
    </div>
  )
}

function VendorOrders() {
  const { showToast } = useApp()
  const [orders, setOrders] = useState(null)
  const [texts, setTexts] = useState({})
  const load = () => api('/vendor/orders').then((data) => setOrders(data.orders))
  useEffect(() => { load().catch((err) => showToast(err.message)) }, [])

  const update = async (id, status) => {
    try {
      await api(`/vendor/orders/${id}`, { method: 'PATCH', body: { status } })
      showToast(STATUS[status])
      load()
    } catch (err) {
      showToast(err.message)
    }
  }

  const send = async (id) => {
    try {
      await api(`/vendor/orders/${id}/message`, { method: 'POST', body: { text: texts[id] || '' } })
      setTexts({ ...texts, [id]: '' })
      showToast('Ба харидор фиристода шуд')
    } catch (err) {
      showToast(err.message)
    }
  }

  return (
    <div className="page">
      <PageHead title="Фармоишҳо" />
      <div className="grid gap-3 px-4 pt-4">
        {(orders || []).map((order) => (
          <article key={order.id} className="card p-3">
            <div className="flex items-center justify-between gap-2">
              <b>№{order.id}</b>
              <Pill status={order.status} />
            </div>
            <div className="text-xs text-muted">{when(order.createdAt)} · {order.buyer ? `${order.buyer.firstName} · ${order.buyer.phone || 'бе рақам'}` : ''}</div>
            {order.items.map((item, index) => (
              <div key={index} className="mt-2 text-sm">{item.name} · {variantText(item.variant)} · {item.qty} × {money(item.price)}</div>
            ))}
            <div className="mt-1 text-sm font-extrabold">{money(order.total)} · {order.address?.district}, {order.address?.text}</div>
            {order.paymentStatus === 'unpaid' && <div className="text-xs font-bold text-sale">Пардохти кортӣ нашудааст</div>}
            <div className="mt-2 flex flex-wrap gap-2">
              {order.status === 'processing' && <button className="chip on" onClick={() => update(order.id, 'shipping')}>Дар роҳ</button>}
              {order.status === 'shipping' && <button className="chip on" onClick={() => update(order.id, 'delivered')}>Расонида шуд</button>}
              {order.status !== 'delivered' && order.status !== 'cancelled' && <button className="chip" onClick={() => update(order.id, 'cancelled')}>Бекор</button>}
            </div>
            {order.status !== 'cancelled' && (
              <div className="mt-2 flex gap-2">
                <input placeholder="Паём ба харидор" value={texts[order.id] || ''} onChange={(event) => setTexts({ ...texts, [order.id]: event.target.value })} />
                <button className="chip" onClick={() => send(order.id)}>Фиристодан</button>
              </div>
            )}
          </article>
        ))}
        {orders && orders.length === 0 && <p className="text-sm text-muted">Фармоиш нест.</p>}
      </div>
    </div>
  )
}
