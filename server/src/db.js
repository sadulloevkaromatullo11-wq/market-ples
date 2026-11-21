import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, '..', 'data', 'db.json')

function empty() {
  return {
    seq: { user: 20, vendor: 10, product: 100, order: 10050, review: 100, notif: 100, address: 20, cartItem: 50, group: 50 },
    users: [],
    vendors: [],
    categories: [],
    products: [],
    reviews: [],
    carts: [],
    orders: [],
    banners: [],
    notifications: [],
    addresses: [],
  }
}

function readFile() {
  if (!fs.existsSync(file)) return empty()
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch {
    return empty()
  }
}

function applyState(next) {
  const data = { ...empty(), ...next }
  for (const key of Object.keys(db)) delete db[key]
  Object.assign(db, data)
}

export const db = empty()

let pool = null
let chain = Promise.resolve()

export function storeKind() {
  return pool ? 'postgres' : 'file'
}

function writeFile() {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, file)
}

export async function openDatabase() {
  const url = process.env.DATABASE_URL
  if (!url) {
    applyState(readFile())
    return
  }
  const ssl = /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }
  pool = new pg.Pool({ connectionString: url, ssl, max: 5 })
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  const { rows } = await pool.query('SELECT data FROM app_state WHERE id = 1')
  if (rows[0]?.data) applyState(rows[0].data)
  else applyState(empty())
}

export function save() {
  if (!pool) {
    writeFile()
    return
  }
  const snapshot = structuredClone(db)
  chain = chain.then(() => pool.query(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES (1, $1::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(snapshot)],
  )).catch((error) => {
    console.error('База сабт нашуд:', error.message)
  })
}

export function flush() {
  return chain
}

export function nextId(key) {
  db.seq[key] = (db.seq[key] || 1) + 1
  return db.seq[key]
}
