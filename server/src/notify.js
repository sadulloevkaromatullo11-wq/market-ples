import { db, nextId, save } from './db.js'

let redisPromise = null

async function getRedis() {
  if (!process.env.REDIS_URL) return null
  if (!redisPromise) {
    redisPromise = (async () => {
      try {
        const { createClient } = await import('redis')
        const client = createClient({ url: process.env.REDIS_URL })
        client.on('error', () => {})
        await client.connect()
        console.log('Redis пайваст шуд')
        return client
      } catch (error) {
        console.log('Redis дастрас нест, навбат дар хотира мемонад:', error.message)
        return null
      }
    })()
  }
  return redisPromise
}

export async function initQueue() {
  await getRedis()
}

export async function notify({ userId, title, body }) {
  const user = db.users.find((item) => item.id === userId)
  const entry = {
    id: nextId('notif'),
    userId,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  }
  db.notifications.unshift(entry)
  save()

  const redis = await getRedis()
  if (redis) {
    await redis.lPush('dukon:notifications', JSON.stringify({ ...entry, telegramId: user?.telegramId || null })).catch(() => {})
  }

  if (process.env.BOT_TOKEN && user?.telegramId) {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegramId,
        text: `${title}\n${body}`,
      }),
    }).catch(() => {})
  }
  return entry
}

export function orderStatusCopy(order, status) {
  if (status === 'processing') return { title: 'Фармоиш қабул шуд', body: `Фармоиши шумо №${order.id} қабул шуд.` }
  if (status === 'shipping') return { title: 'Фармоиш дар роҳ аст', body: `Фармоиши №${order.id} дар роҳ аст.` }
  if (status === 'delivered') return { title: 'Фармоиш расонида шуд', body: `Фармоиши №${order.id} расонида шуд.` }
  return { title: 'Фармоиш бекор шуд', body: `Фармоиши №${order.id} бекор карда шуд.` }
}
