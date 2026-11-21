import crypto from 'crypto'
import { db } from './db.js'

const secret = () => process.env.JWT_SECRET || 'dukon-dev-secret'

export function sign(userId) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 30 * 864e5 })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function readToken(token) {
  if (!token || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  const expect = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expect)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data?.userId || data.exp < Date.now()) return null
    return db.users.find((user) => user.id === data.userId) || null
  } catch {
    return null
  }
}

export function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const user = readToken(header.startsWith('Bearer ') ? header.slice(7) : '')
  if (!user) return res.status(401).json({ error: 'Ворид шавед' })
  if (user.status === 'blocked') return res.status(403).json({ error: 'Ҳисоби шумо баста шудааст' })
  req.user = user
  next()
}

export function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return { ok: false, params }
  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  if (!botToken) return { ok: false, params, unsigned: true }
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  if (hmac !== hash) return { ok: false, params }
  const authDate = Number(params.get('auth_date') || 0)
  if (!authDate || Date.now() / 1000 - authDate > 86400) return { ok: false, params, expired: true }
  return { ok: true, params }
}
