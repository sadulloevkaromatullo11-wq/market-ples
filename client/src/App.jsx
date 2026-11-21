import { useState } from 'react'
import { Link, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from './components'
import { useApp } from './store'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import Search from './pages/Search'
import Categories from './pages/Categories'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout, { Pay } from './pages/Checkout'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Saved from './pages/Saved'
import Notifications from './pages/Notifications'
import Vendor from './pages/Vendor'
import Admin from './pages/Admin'

function Mark() {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-extrabold text-brandInk">Д</span>
  )
}

function Splash() {
  return (
    <div className="app-frame grid place-items-center">
      <div className="text-center">
        <Mark />
        <div className="mt-3 text-2xl font-extrabold">Дукон</div>
      </div>
    </div>
  )
}

function Welcome() {
  const { loginDemo } = useApp()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const enter = async (role) => {
    setBusy(true)
    setError('')
    try { await loginDemo(role) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return (
    <div className="app-frame page px-5 pt-16">
      <Mark />
      <h1 className="mt-5 text-4xl font-extrabold leading-none">Дукон</h1>
      <p className="mt-3 max-w-sm text-base text-muted">Бозори бисёрфурӯшандагӣ дар дохили Telegram. Молро ёбед, ба сабад андозед ва бе баромадан фармоиш диҳед.</p>
      <div className="mt-6 flex gap-2 text-sm font-bold">
        {['Хӯрокворӣ', 'Либос', 'Техника'].map((item) => <span key={item} className="chip">{item}</span>)}
      </div>
      <div className="mt-8 grid gap-3">
        <button className="btn" disabled={busy} onClick={() => enter('buyer')}>Идома ҳамчун харидор</button>
        <button className="btn secondary" disabled={busy} onClick={() => enter('vendor')}>Кабинети фурӯшанда</button>
        <button className="btn ghost" disabled={busy} onClick={() => enter('admin')}>Панели админ</button>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-sale">{error}</p>}
      <p className="mt-6 text-xs leading-relaxed text-muted">Дар Telegram воридшавӣ худкор аст. Ин ҷо барои санҷиш нақшро интихоб кунед.</p>
    </div>
  )
}

function Frame() {
  const { pathname } = useLocation()
  const hide = pathname.startsWith('/product') || pathname.startsWith('/checkout') || pathname.startsWith('/pay')
  return (
    <div className="app-frame">
      <Outlet />
      {!hide && <BottomNav />}
    </div>
  )
}

function Missing() {
  const navigate = useNavigate()
  return (
    <div className="page px-5 pt-16 text-center">
      <h1 className="text-2xl font-extrabold">Саҳифа ёфт нашуд</h1>
      <button className="btn mt-6" onClick={() => navigate('/')}>Ба асосӣ</button>
    </div>
  )
}

export function Bell() {
  const { unread } = useApp()
  return (
    <Link to="/notifications" className="relative grid h-10 w-10 place-items-center rounded-full bg-surface" aria-label="Огоҳиномаҳо">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Zm4 11a2 2 0 0 0 4 0" /></svg>
      {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />}
    </Link>
  )
}

export default function App() {
  const { ready, user } = useApp()
  if (!ready) return <Splash />
  if (!user) return <Welcome />
  return (
    <Routes>
      <Route element={<Frame />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/category/:id" element={<Catalog />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pay/:groupId" element={<Pay />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/vendor/edit/:id" element={<Vendor />} />
        <Route path="/vendor/*" element={<Vendor />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Missing />} />
      </Route>
    </Routes>
  )
}
