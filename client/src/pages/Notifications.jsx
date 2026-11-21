import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, PageHead } from '../components'
import { api } from '../api'
import { when } from '../format'
import { useApp } from '../store'

export default function Notifications() {
  const navigate = useNavigate()
  const { refreshMe } = useApp()
  const [items, setItems] = useState(null)

  useEffect(() => {
    api('/notifications').then(async (data) => {
      setItems(data.notifications)
      await api('/notifications/read', { method: 'POST', body: {} })
      refreshMe().catch(() => {})
    }).catch(() => setItems([]))
  }, [])

  return (
    <div className="page">
      <PageHead title="Огоҳиномаҳо" back={() => navigate(-1)} />
      {items && items.length === 0 && <Empty title="Огоҳинома нест" text="Фармоишҳои нав ва статуси расонидан ин ҷо меоянд." />}
      <div className="grid gap-2 px-4 pt-4">
        {(items || []).map((item) => (
          <article key={item.id} className="card p-3">
            <div className="flex items-start justify-between gap-3">
              <b className="text-sm">{item.title}</b>
              {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </div>
            <p className="mt-1 text-sm text-muted">{item.body}</p>
            <div className="mt-1 text-[11px] text-muted">{when(item.createdAt)}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
