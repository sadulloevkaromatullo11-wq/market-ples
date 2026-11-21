import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sheet } from '../components'
import { api } from '../api'
import { useFavs } from '../favs'
import { useApp } from '../store'

export default function Profile() {
  const { user, vendor, theme, setTheme, inTelegram, loginDemo, logout, setUser, setVendor, showToast } = useApp()
  const favs = useFavs()
  const navigate = useNavigate()
  const [phone, setPhone] = useState(user.phone || '')
  const [shopName, setShopName] = useState(vendor?.shopName || '')
  const [description, setDescription] = useState(vendor?.description || '')
  const [busy, setBusy] = useState(false)
  const [orders, setOrders] = useState([])
  const [sheet, setSheet] = useState('')

  useEffect(() => {
    api('/orders').then((data) => setOrders(data.orders || [])).catch(() => {})
  }, [])

  const savePhone = async (event) => {
    event.preventDefault()
    try {
      const data = await api('/me', { method: 'PATCH', body: { phone } })
      setUser(data.user)
      showToast('Рақам сабт шуд')
      setSheet('')
    } catch (err) {
      showToast(err.message)
    }
  }

  const askTelegram = async () => {
    try {
      await api('/me/request-phone', { method: 'POST', body: {} })
      showToast('Дар чати бот тугмаи рақамро пахш кунед')
    } catch (err) {
      showToast(err.message)
    }
  }

  const apply = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const data = await api('/vendor/apply', { method: 'POST', body: { shopName, description } })
      setUser(data.user)
      setVendor(data.vendor)
      showToast('Дархост фиристода шуд')
      setSheet('')
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusy(false)
    }
  }

  const enter = async (role, path) => {
    await loginDemo(role)
    navigate(path)
  }

  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Корбар'
  const returns = orders.filter((order) => order.status === 'cancelled').length

  return (
    <div className="page prof">
      <div className="prof-top">
        <div className="flex items-center gap-3">
          <div className="prof-avatar">
            {user.photo ? <img src={user.photo} alt="" className="h-full w-full object-cover" /> : <UserMark />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-extrabold">{name}</div>
            <div className="text-sm text-white/80">{user.phone || 'Рақам нест'}</div>
          </div>
          <Link to="/notifications" className="prof-icon" aria-label="Огоҳӣ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Zm4 11a2 2 0 0 0 4 0" /></svg>
          </Link>
          <button type="button" className="prof-icon" aria-label="Паём" onClick={() => setSheet('chat')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 17.5 4 21l3.6-1.2A8.5 8.5 0 1 0 5 17.5Z" /></svg>
          </button>
        </div>

        <div className="wallet">
          <div className="relative z-10">
            <div className="text-sm font-bold">Ҳамён</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[28px] font-extrabold leading-none">0.00 сом</span>
              <button type="button" className="wallet-plus" aria-label="Пур кардан" onClick={() => setSheet('wallet')}>+</button>
            </div>
            <div className="mt-1 text-xs text-muted">Баланси шумо</div>
          </div>
          <BagArt />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4">
        <Link to="/orders" className="stat-tile">
          <BagMini />
          <b>Фармоишҳо</b>
          <span>{orders.length} фармоиш</span>
        </Link>
        <Link to="/saved" className="stat-tile">
          <HeartMini />
          <b>Дӯстдошта</b>
          <span>{favs.length} мол</span>
        </Link>
        <Link to="/orders?tab=return" className="stat-tile">
          <BoxMini />
          <b>Бозгашт</b>
          <span>{returns} мол</span>
        </Link>
      </div>

      <section className="seller-card">
        <div className="min-w-0">
          <div className="text-[17px] font-extrabold leading-tight">Имрӯз фурӯшро оғоз кунед</div>
          {vendor?.status === 'approved' ? (
            <Link to="/vendor" className="seller-btn">Кабинети фурӯшанда</Link>
          ) : (
            <button type="button" className="seller-btn" onClick={() => setSheet('seller')}>Фурӯшанда шавед</button>
          )}
        </div>
        <StallArt />
      </section>

      <section className="info-card">
        <h2>Маълумот</h2>
        <button type="button" onClick={() => setSheet('sell-info')}>Чӣ гуна дар Дукон фурӯхтан <Chevron /></button>
        <button type="button" onClick={() => setSheet('delivery')}>Шартҳои расонидан <Chevron /></button>
        <button type="button" onClick={() => setSheet('returns')}>Бозгашти мол <Chevron /></button>
        <button type="button" onClick={() => setSheet('settings')}>Танзимот <Chevron /></button>
      </section>

      <Sheet open={sheet === 'wallet'} title="Ҳамён" onClose={() => setSheet('')}>
        <p className="text-sm text-muted">Пуркунии ҳамён ба зудӣ меояд. Ҳоло молро ҳангоми фармоиш бо нақд ё корт пардохт мекунед.</p>
      </Sheet>

      <Sheet open={sheet === 'chat'} title="Паём" onClose={() => setSheet('')}>
        <p className="text-sm text-muted">Барои дастгирӣ ба боти @minimarket1bot нависед. Мо дар ҳамон чат ҷавоб медиҳем.</p>
      </Sheet>

      <Sheet open={sheet === 'sell-info'} title="Чӣ гуна фурӯхтан" onClose={() => setSheet('')}>
        <p className="text-sm leading-relaxed text-muted">Дар профил «Фурӯшанда шавед»-ро пахш кунед ва номи дӯконро нависед. Пас аз тасдиқи админ мол илова мекунед, фармоишҳоро мебинед ва ба харидор паём мефиристед.</p>
      </Sheet>

      <Sheet open={sheet === 'delivery'} title="Шартҳои расонидан" onClose={() => setSheet('')}>
        <p className="text-sm leading-relaxed text-muted">Расонидан дар Душанбе. То 200 сомонӣ ҳаққи расонидан 15 сомонӣ аст, аз 200 сомонӣ ройгон. Пардохт нақд ҳангоми расонидан ё бо корт.</p>
      </Sheet>

      <Sheet open={sheet === 'returns'} title="Бозгашти мол" onClose={() => setSheet('')}>
        <p className="text-sm leading-relaxed text-muted">То расидани мол фармоишро бекор кардан мумкин аст. Моли расонидашударо бо фурӯшанда мувофиқа кунед. Фармоишҳои бекоршуда дар «Бозгашт» мемонанд.</p>
      </Sheet>

      <Sheet open={sheet === 'seller'} title="Фурӯшанда шавед" onClose={() => setSheet('')}>
        {user.role === 'admin' ? (
          <p className="text-sm text-muted">Админ дархости дӯкон намедиҳад.</p>
        ) : vendor?.status === 'pending' ? (
          <p className="text-sm font-semibold">Дархости «{vendor.shopName}» дар баррасӣ аст.</p>
        ) : (
          <form onSubmit={apply} className="grid gap-2">
            <p className="text-sm text-muted">Пас аз тасдиқи админ каталог ва фармоишҳо кушода мешаванд.</p>
            <input value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="Номи дӯкон" />
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Чӣ мефурӯшед?" />
            <button className="btn" disabled={busy}>Фиристодани дархост</button>
          </form>
        )}
      </Sheet>

      <Sheet open={sheet === 'settings'} title="Танзимот" onClose={() => setSheet('')}>
        <form onSubmit={savePhone} className="grid gap-2">
          <div className="text-sm font-extrabold">Рақами телефон</div>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+992 90 000 0000" />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" type="submit">Сабт</button>
            <button className="btn secondary" type="button" onClick={askTelegram}>Аз Telegram</button>
          </div>
        </form>
        {!inTelegram && (
          <>
            <div className="mt-4 text-sm font-extrabold">Мавзӯъ</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" className={`chip ${theme === 'light' ? 'on' : ''}`} onClick={() => setTheme('light')}>Рӯшно</button>
              <button type="button" className={`chip ${theme === 'dark' ? 'on' : ''}`} onClick={() => setTheme('dark')}>Торик</button>
            </div>
            <div className="mt-4 text-sm font-extrabold">Санҷиши нақш</div>
            <div className="mt-2 grid gap-2">
              <button type="button" className="btn ghost" onClick={() => enter('buyer', '/')}>Харидор</button>
              <button type="button" className="btn ghost" onClick={() => enter('vendor', '/vendor')}>Фурӯшанда</button>
              <button type="button" className="btn ghost" onClick={() => enter('admin', '/admin')}>Админ</button>
            </div>
            <button type="button" className="btn danger mt-3" onClick={logout}>Баромад</button>
          </>
        )}
        {user.role === 'admin' && <Link className="btn mt-3" to="/admin" onClick={() => setSheet('')}>Панели админ</Link>}
      </Sheet>
    </div>
  )
}

function Chevron() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
}

function UserMark() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12 12.2a3.4 3.4 0 1 0-3.4-3.4A3.4 3.4 0 0 0 12 12.2Zm-6.4 7.4a6.4 6.4 0 0 1 12.8 0Z" /></svg>
}

function BagArt() {
  return (
    <svg viewBox="0 0 120 90" className="wallet-art" aria-hidden="true">
      <ellipse cx="78" cy="46" rx="34" ry="26" fill="#2f7bff" />
      <path d="M58 46c0-16 40-16 40 0" fill="none" stroke="#9ec4ff" strokeWidth="4" />
      <circle cx="78" cy="50" r="8" fill="#fff" />
      <circle cx="96" cy="18" r="6" fill="#ffd36a" />
      <circle cx="108" cy="30" r="5" fill="#ffe7a3" />
      <circle cx="100" cy="10" r="4" fill="#ffb703" />
    </svg>
  )
}

function StallArt() {
  return (
    <svg viewBox="0 0 110 80" className="h-16 w-24 shrink-0" aria-hidden="true">
      <path d="M18 34h74l-8 10H26L18 34z" fill="#2f7bff" />
      <path d="M28 44h54v22H28z" fill="#d7e6ff" />
      <path d="M46 50h18v16H46z" fill="#2f7bff" />
      <circle cx="78" cy="58" r="6" fill="#ffd36a" />
    </svg>
  )
}

function BagMini() {
  return <span className="tile-ico bag"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7bff" strokeWidth="1.8"><path d="M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0" /></svg></span>
}
function HeartMini() {
  return <span className="tile-ico heart"><svg width="18" height="18" viewBox="0 0 24 24" fill="#ff3b5c"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" /></svg></span>
}
function BoxMini() {
  return <span className="tile-ico box"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="1.8"><path d="M4 8l8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8M12 12v8" /></svg></span>
}
