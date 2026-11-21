import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Empty, PageHead, Photo, Pill } from '../components'
import { api } from '../api'
import { money, STATUS, variantText, when } from '../format'
import { useApp } from '../store'

const steps = ['processing', 'shipping', 'delivered']

export default function Orders() {
  const { id } = useParams()
  return id ? <Detail id={id} /> : <List />
}

function List() {
  const [params] = useSearchParams()
  const returns = params.get('tab') === 'return'
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api('/orders').then((data) => setOrders(data.orders)).catch((err) => setError(err.message))
  }, [])
  const visible = (orders || []).filter((order) => (returns ? order.status === 'cancelled' : true))

  const groups = []
  for (const order of visible) {
    let group = groups.find((item) => item.groupId === order.groupId)
    if (!group) groups.push(group = { groupId: order.groupId, createdAt: order.createdAt, orders: [] })
    group.orders.push(order)
  }

  return (
    <div className="page">
      <PageHead title={returns ? 'Бозгашт' : 'Фармоишҳо'} />
      {error && <p className="px-4 pt-4 text-sm text-sale">{error}</p>}
      {orders && visible.length === 0 && <Empty title={returns ? 'Бозгашт нест' : 'Ҳанӯз харид нест'} text={returns ? 'Фармоиши бекоршуда ин ҷо меояд.' : 'Аввалин фармоишро аз каталог оғоз кунед.'} action={<Link to="/catalog" className="btn">Ба каталог</Link>} />}
      <div className="grid gap-3 px-4 pt-4">
        {groups.map((group) => (
          <section key={group.groupId} className="card p-3">
            <div className="text-xs font-bold text-muted">{when(group.createdAt)}</div>
            {group.orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="mt-2 block border-t border-line pt-2">
                <div className="flex items-center justify-between gap-2">
                  <b>№{order.id}</b>
                  <Pill status={order.status} />
                </div>
                <div className="text-sm text-muted">{order.vendor?.shopName} · {money(order.total)}</div>
                {order.paymentStatus === 'unpaid' && <div className="text-xs font-bold text-sale">Пардохт нашудааст</div>}
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

function Detail({ id }) {
  const navigate = useNavigate()
  const { showToast } = useApp()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  const load = () => api(`/orders/${id}`).then((data) => setOrder(data.order)).catch((err) => setError(err.message))
  useEffect(() => { load() }, [id])

  const cancel = async () => {
    try {
      const data = await api(`/orders/${id}/cancel`, { method: 'POST', body: {} })
      setOrder(data.order)
      showToast('Фармоиш бекор шуд')
    } catch (err) {
      showToast(err.message)
    }
  }

  if (error) return <div className="page px-4 pt-10"><PageHead title="Фармоиш" back={() => navigate('/orders')} /><p className="pt-4">{error}</p></div>
  if (!order) return <div className="page"><PageHead title="Фармоиш" back={() => navigate(-1)} /></div>
  const index = steps.indexOf(order.status)

  return (
    <div className="page">
      <PageHead title={`№${order.id}`} back={() => navigate('/orders')} />
      <div className="grid gap-3 px-4 pt-4">
        <section className="card p-3">
          <div className="flex items-center justify-between">
            <b>{order.vendor?.shopName}</b>
            <Pill status={order.status} />
          </div>
          {order.status !== 'cancelled' && (
            <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[11px] font-bold">
              {steps.map((step, stepIndex) => (
                <div key={step} className={stepIndex <= index ? 'text-good' : 'text-muted'}>
                  <div className={`mb-1 h-1 rounded-full ${stepIndex <= index ? 'bg-good' : 'bg-line'}`} />
                  {STATUS[step]}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-sm text-muted">{when(order.createdAt)} · {STATUS[order.paymentStatus] || order.paymentMethod}</div>
        </section>
        <section className="card p-3">
          {order.items.map((item, itemIndex) => (
            <div key={itemIndex} className="flex items-center gap-3 py-1">
              <Photo src={item.image} emoji={item.emoji} alt="" className="h-12 w-12 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{item.name}</div>
                <div className="text-xs text-muted">{variantText(item.variant)} · {item.qty} × {money(item.price)}</div>
              </div>
            </div>
          ))}
          <div className="mt-2 flex justify-between font-extrabold"><span>Ҷамъ</span><span>{money(order.total)}</span></div>
        </section>
        <section className="card p-3 text-sm">
          <div className="font-extrabold">Суроға</div>
          <p className="mt-1">{order.address?.district}, {order.address?.text}</p>
          {order.note && <p className="mt-2 text-muted">Эзоҳ: {order.note}</p>}
        </section>
        {order.paymentStatus === 'unpaid' && <button className="btn" onClick={() => navigate(`/pay/${order.groupId}`)}>Пардохтан</button>}
        {order.status === 'processing' && <button className="btn danger" onClick={cancel}>Бекор кардани фармоиш</button>}
      </div>
    </div>
  )
}
