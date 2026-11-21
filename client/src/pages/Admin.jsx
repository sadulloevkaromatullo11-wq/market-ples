import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead, Photo, Pill } from '../components'
import { api } from '../api'
import { money } from '../format'
import { useApp } from '../store'

export default function Admin() {
  const { user } = useApp()
  const path = window.location.pathname
  if (user.role !== 'admin') {
    return (
      <div className="page px-4 pt-8">
        <div className="card p-4">
          <h1 className="text-xl font-extrabold">Дастрасӣ нест</h1>
          <Link to="/" className="btn mt-4">Ба асосӣ</Link>
        </div>
      </div>
    )
  }
  if (path.endsWith('/vendors')) return <Vendors />
  if (path.endsWith('/products')) return <Moderation />
  if (path.endsWith('/users')) return <Users />
  return <Stats />
}

function Stats() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api('/admin/stats').then(setStats).catch(() => {}) }, [])
  const max = Math.max(...(stats?.days || []).map((day) => day.total), 1)
  return (
    <div className="page">
      <PageHead title="Омор" />
      <div className="grid grid-cols-2 gap-2 px-4 pt-4">
        <Tile label="Маблағи умумӣ" value={stats ? money(stats.gmv) : '…'} />
        <Tile label="Комиссия" value={stats ? money(stats.commission) : '…'} />
        <Tile label="Фармоишҳо" value={stats?.orders ?? '…'} />
        <Tile label="Фурӯшандагон" value={stats?.vendors ?? '…'} />
      </div>
      <section className="card mx-4 mt-3 p-3">
        <div className="text-sm font-extrabold">7 рӯзи охир</div>
        <div className="mt-3 flex h-36 items-end gap-2">
          {(stats?.days || []).map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-brand" style={{ height: `${Math.max(6, (day.total / max) * 112)}px` }} />
              <span className="text-[10px] font-bold text-muted">{day.date}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-2 px-4 pt-3 text-sm">
        <Link className="card flex items-center justify-between p-3 font-bold" to="/admin/vendors">Дархости дӯконҳо <b>{stats?.pendingVendors || 0}</b></Link>
        <Link className="card flex items-center justify-between p-3 font-bold" to="/admin/products">Модерасияи молҳо <b>{stats?.pendingProducts || 0}</b></Link>
        <Link className="card flex items-center justify-between p-3 font-bold" to="/admin/users">Корбарон <b>{stats?.users || 0}</b></Link>
      </div>
    </div>
  )
}

function Tile({ label, value }) {
  return <div className="card p-3"><div className="text-xs font-bold text-muted">{label}</div><div className="mt-1 text-xl font-extrabold">{value}</div></div>
}

function Vendors() {
  const { showToast } = useApp()
  const [vendors, setVendors] = useState(null)
  const load = () => api('/admin/vendors').then((data) => setVendors(data.vendors))
  useEffect(() => { load().catch((err) => showToast(err.message)) }, [])
  const setStatus = async (id, status) => {
    try {
      await api(`/admin/vendors/${id}`, { method: 'PATCH', body: { status } })
      load()
    } catch (err) { showToast(err.message) }
  }
  return (
    <div className="page">
      <PageHead title="Фурӯшандагон" />
      <div className="grid gap-2 px-4 pt-4">
        {(vendors || []).map((vendor) => (
          <article key={vendor.id} className="card p-3">
            <div className="flex items-center justify-between gap-2">
              <b>{vendor.shopName}</b>
              <Pill status={vendor.status} />
            </div>
            <p className="text-sm text-muted">{vendor.description}</p>
            <div className="text-xs text-muted">{vendor.owner ? `${vendor.owner.firstName} ${vendor.owner.lastName} · ${vendor.owner.phone || 'бе рақам'}` : ''} · комиссия {Math.round(vendor.commission * 100)}%</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {vendor.status !== 'approved' && <button className="chip on" onClick={() => setStatus(vendor.id, 'approved')}>Тасдиқ</button>}
              {vendor.status === 'pending' && <button className="chip" onClick={() => setStatus(vendor.id, 'rejected')}>Рад</button>}
              {vendor.status === 'approved' && <button className="chip" onClick={() => setStatus(vendor.id, 'blocked')}>Блок</button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Moderation() {
  const { showToast } = useApp()
  const [onlyPending, setOnlyPending] = useState(true)
  const [products, setProducts] = useState(null)
  const load = () => api(`/admin/products${onlyPending ? '?status=pending' : ''}`).then((data) => setProducts(data.products))
  useEffect(() => { load().catch((err) => showToast(err.message)) }, [onlyPending])
  const setStatus = async (id, status) => {
    try {
      await api(`/admin/products/${id}`, { method: 'PATCH', body: { status } })
      showToast(status === 'published' ? 'Нашр шуд' : 'Рад шуд')
      load()
    } catch (err) { showToast(err.message) }
  }
  return (
    <div className="page">
      <PageHead title="Модерасия" action={<button className="chip" onClick={() => setOnlyPending((value) => !value)}>{onlyPending ? 'Ҳама' : 'Нав'}</button>} />
      <div className="grid gap-2 px-4 pt-4">
        {(products || []).map((product) => (
          <article key={product.id} className="card flex gap-3 p-3">
            <Photo src={product.images?.[0]} emoji={product.emoji} hue={product.hue} alt="" className="h-16 w-16 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2"><b className="text-sm">{product.name}</b><Pill status={product.status} /></div>
              <div className="text-xs text-muted">{product.vendor?.shopName} · {money(product.price)}</div>
              <p className="line-clamp-2 text-sm">{product.description}</p>
              {product.status === 'pending' && (
                <div className="mt-2 flex gap-2">
                  <button className="chip on" onClick={() => setStatus(product.id, 'published')}>Нашр</button>
                  <button className="chip" onClick={() => setStatus(product.id, 'rejected')}>Рад</button>
                </div>
              )}
            </div>
          </article>
        ))}
        {products && products.length === 0 && <p className="text-sm text-muted">Рӯйхат холӣ аст.</p>}
      </div>
    </div>
  )
}

function Users() {
  const { showToast, user } = useApp()
  const [users, setUsers] = useState(null)
  const load = () => api('/admin/users').then((data) => setUsers(data.users))
  useEffect(() => { load().catch((err) => showToast(err.message)) }, [])
  const setStatus = async (id, status) => {
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body: { status } })
      load()
    } catch (err) { showToast(err.message) }
  }
  return (
    <div className="page">
      <PageHead title="Корбарон" />
      <div className="grid gap-2 px-4 pt-4">
        {(users || []).map((item) => (
          <article key={item.id} className="card flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <b className="text-sm">{item.firstName} {item.lastName}</b>
              <div className="text-xs text-muted">{item.role} · {item.phone || 'бе рақам'}</div>
            </div>
            <Pill status={item.status} />
            {item.id !== user.id && (
              item.status === 'blocked'
                ? <button className="chip" onClick={() => setStatus(item.id, 'active')}>Кушодан</button>
                : <button className="chip" onClick={() => setStatus(item.id, 'blocked')}>Блок</button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
