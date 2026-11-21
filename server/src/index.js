import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { loadEnv } from './env.js'
import { db, flush, nextId, openDatabase, save, storeKind } from './db.js'
import { auth, sign, verifyInitData } from './auth.js'
import { initQueue, notify, orderStatusCopy } from './notify.js'
import { seedIfEmpty } from './seed.js'
import { chargeCard, createPayment } from './payments.js'
import { requestPhone, startBot } from './bot.js'

loadEnv()
await openDatabase()
seedIfEmpty()
await flush()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 8) || '.jpg'
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(new Error('Танҳо аксҳои JPG, PNG ё WEBP'))
    cb(null, true)
  },
})

const app = express()
const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((item) => item.trim()).filter(Boolean)
app.use(cors(origins.length ? { origin: origins } : undefined))
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(uploadDir))

const fail = (res, code, error) => res.status(code).json({ error })

function publicUser(user) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username || '',
    phone: user.phone || '',
    photo: user.photo || '',
    role: user.role,
    status: user.status,
  }
}

function vendorRating(vendorId) {
  const ids = db.products.filter((product) => product.vendorId === vendorId).map((product) => product.id)
  const reviews = db.reviews.filter((review) => ids.includes(review.productId))
  if (!reviews.length) return 0
  return +(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
}

function publicVendor(vendor) {
  if (!vendor) return null
  return {
    id: vendor.id,
    userId: vendor.userId,
    shopName: vendor.shopName,
    description: vendor.description,
    status: vendor.status,
    commission: vendor.commission,
    rating: vendorRating(vendor.id),
  }
}

function sessionOf(user) {
  const vendor = db.vendors.find((item) => item.userId === user.id) || null
  const unread = db.notifications.filter((item) => item.userId === user.id && !item.read).length
  return { token: sign(user.id), user: publicUser(user), vendor: publicVendor(vendor), unread }
}

function productRating(productId) {
  const reviews = db.reviews.filter((review) => review.productId === productId)
  if (!reviews.length) return { rating: 0, reviewCount: 0 }
  return {
    rating: +(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1),
    reviewCount: reviews.length,
  }
}

function priceOf(product) {
  return product.discountPrice ?? product.price
}

function shapeProduct(product, { detail = false, full = false } = {}) {
  const vendor = db.vendors.find((item) => item.id === product.vendorId)
  const category = db.categories.find((item) => item.id === product.categoryId)
  const score = productRating(product.id)
  const shaped = {
    id: product.id,
    name: product.name,
    price: product.price,
    discountPrice: product.discountPrice,
    images: product.images || [],
    emoji: product.emoji,
    hue: product.hue,
    stock: product.stock,
    featured: product.featured,
    status: product.status,
    categoryId: product.categoryId,
    vendorId: product.vendorId,
    createdAt: product.createdAt,
    ...score,
    vendor: vendor ? { id: vendor.id, shopName: vendor.shopName, rating: vendorRating(vendor.id), status: vendor.status } : null,
    category: category ? { id: category.id, name: category.name, parentId: category.parentId } : null,
    sold: db.orders
      .filter((order) => order.status !== 'cancelled')
      .flatMap((order) => order.items || [])
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
  }
  if (detail || full) {
    shaped.description = product.description
    shaped.attributes = product.attributes || []
  }
  if (detail) {
    shaped.reviews = db.reviews
      .filter((review) => review.productId === product.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((review) => {
        const author = db.users.find((user) => user.id === review.userId)
        return {
          id: review.id,
          rating: review.rating,
          text: review.text,
          createdAt: review.createdAt,
          author: author ? `${author.firstName} ${author.lastName}`.trim() : 'Харидор',
        }
      })
  }
  return shaped
}

function visibleProducts() {
  return db.products.filter((product) => {
    if (product.status !== 'published') return false
    const vendor = db.vendors.find((item) => item.id === product.vendorId)
    return vendor && vendor.status === 'approved'
  })
}

function categoryIds(id) {
  const numeric = Number(id)
  const children = db.categories.filter((category) => category.parentId === numeric).map((category) => category.id)
  return [numeric, ...children]
}

function variantKey(variant = {}) {
  return JSON.stringify(Object.keys(variant).sort().reduce((acc, key) => ({ ...acc, [key]: variant[key] }), {}))
}

function getCart(userId) {
  let cart = db.carts.find((item) => item.userId === userId)
  if (!cart) {
    cart = { userId, items: [] }
    db.carts.push(cart)
  }
  return cart
}

function shapeCart(userId) {
  const cart = getCart(userId)
  const items = cart.items.map((item) => {
    const product = db.products.find((row) => row.id === item.productId && row.status === 'published')
    const price = product ? priceOf(product) : 0
    return {
      ...item,
      price,
      line: price * item.qty,
      product: product ? shapeProduct(product) : null,
    }
  })
  const subtotal = items.reduce((sum, item) => sum + (item.product ? item.line : 0), 0)
  const delivery = subtotal === 0 || subtotal >= 200 ? 0 : 15
  return { items, subtotal, delivery, total: subtotal + delivery }
}

function shapeOrder(order, { withBuyer = false } = {}) {
  const vendor = db.vendors.find((item) => item.id === order.vendorId)
  const shaped = {
    ...order,
    vendor: vendor ? { id: vendor.id, shopName: vendor.shopName } : null,
  }
  if (withBuyer) {
    const buyer = db.users.find((user) => user.id === order.userId)
    shaped.buyer = buyer ? { firstName: buyer.firstName, lastName: buyer.lastName, phone: buyer.phone } : null
  }
  return shaped
}

function approvedVendor(userId) {
  return db.vendors.find((vendor) => vendor.userId === userId && vendor.status === 'approved') || null
}

function restoreStock(order) {
  for (const item of order.items) {
    const product = db.products.find((row) => row.id === item.productId)
    if (product) product.stock += item.qty
  }
}

function takeStock(lines) {
  const need = new Map()
  for (const line of lines) need.set(line.product.id, (need.get(line.product.id) || 0) + line.qty)
  for (const line of lines) {
    if (line.product.stock < need.get(line.product.id)) {
      const error = new Error(`«${line.product.name}» ба қадри кофӣ нест`)
      error.status = 400
      throw error
    }
  }
  for (const [id, qty] of need) {
    const product = db.products.find((row) => row.id === id)
    product.stock -= qty
  }
}

function buildOrders({ user, rawItems, address, paymentMethod, note }) {
  const lines = rawItems.map((item) => {
    const product = db.products.find((row) => row.id === Number(item.productId))
    const vendor = product && db.vendors.find((row) => row.id === product.vendorId)
    if (!product || product.status !== 'published' || !vendor || vendor.status !== 'approved') {
      const error = new Error('Яке аз молҳо дастрас нест')
      error.status = 400
      throw error
    }
    const qty = Math.max(1, Math.min(20, Number(item.qty) || 1))
    return { product, vendor, qty, variant: item.variant || {} }
  })
  takeStock(lines)
  const groups = new Map()
  for (const line of lines) {
    const bucket = groups.get(line.vendor.id) || []
    bucket.push(line)
    groups.set(line.vendor.id, bucket)
  }
  const groupId = `G${nextId('group')}`
  const subtotalAll = lines.reduce((sum, line) => sum + priceOf(line.product) * line.qty, 0)
  const deliveryFee = subtotalAll >= 200 ? 0 : 15
  let deliveryUsed = false
  const created = []
  for (const [vendorId, bucket] of groups) {
    const vendor = bucket[0].vendor
    const items = bucket.map((line) => ({
      productId: line.product.id,
      name: line.product.name,
      price: priceOf(line.product),
      qty: line.qty,
      variant: line.variant,
      emoji: line.product.emoji,
      image: line.product.images?.[0] || '',
    }))
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
    const delivery = !deliveryUsed ? deliveryFee : 0
    deliveryUsed = true
    const commission = Math.round(subtotal * vendor.commission * 100) / 100
    const order = {
      id: nextId('order'),
      groupId,
      userId: user.id,
      vendorId,
      status: 'processing',
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'unpaid' : 'cod',
      cardLast4: null,
      address,
      items,
      subtotal,
      delivery,
      commission,
      total: subtotal + delivery,
      note: note || '',
      createdAt: new Date().toISOString(),
    }
    db.orders.unshift(order)
    created.push(order)
  }
  return created
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'dukon', store: storeKind() })
})

app.post('/api/auth/demo', (req, res) => {
  const map = { buyer: 1, vendor: 2, admin: 5 }
  const user = db.users.find((item) => item.id === map[req.body?.role])
  if (!user) return fail(res, 400, 'Нақш нодуруст аст')
  res.json(sessionOf(user))
})

app.post('/api/auth/telegram', (req, res) => {
  const initData = req.body?.initData || ''
  const checked = verifyInitData(initData, process.env.BOT_TOKEN)
  if (process.env.BOT_TOKEN) {
    if (!checked.ok) return fail(res, 401, checked.expired ? 'Сессияи Telegram кӯҳна шуд' : 'initData нодуруст аст')
  } else if (process.env.NODE_ENV === 'production') {
    return fail(res, 500, 'BOT_TOKEN танзим нашудааст')
  }
  let tgUser
  try {
    tgUser = JSON.parse(checked.params.get('user') || '')
  } catch {
    return fail(res, 400, 'Маълумоти корбар ёфт нашуд')
  }
  const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map((item) => item.trim()).filter(Boolean)
  let user = db.users.find((item) => String(item.telegramId) === String(tgUser.id))
  if (!user) {
    user = {
      id: nextId('user'),
      telegramId: tgUser.id,
      firstName: tgUser.first_name || 'Корбар',
      lastName: tgUser.last_name || '',
      username: tgUser.username || '',
      photo: tgUser.photo_url || '',
      phone: '',
      role: adminIds.includes(String(tgUser.id)) ? 'admin' : 'buyer',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
  } else {
    user.firstName = tgUser.first_name || user.firstName
    user.lastName = tgUser.last_name || user.lastName
    user.username = tgUser.username || user.username
    user.photo = tgUser.photo_url || user.photo
    if (adminIds.includes(String(tgUser.id))) user.role = 'admin'
  }
  if (user.status === 'blocked') return fail(res, 403, 'Ҳисоби шумо баста шудааст')
  save()
  res.json(sessionOf(user))
})

app.get('/api/me', auth, (req, res) => {
  const payload = sessionOf(req.user)
  delete payload.token
  res.json(payload)
})

app.patch('/api/me', auth, (req, res) => {
  const phone = String(req.body?.phone || '').trim()
  if (phone && !/^[+\d][\d\s()-]{7,18}$/.test(phone)) return fail(res, 400, 'Рақами телефон нодуруст аст')
  if (phone) req.user.phone = phone
  if (typeof req.body?.firstName === 'string' && req.body.firstName.trim()) req.user.firstName = req.body.firstName.trim().slice(0, 40)
  save()
  const payload = sessionOf(req.user)
  delete payload.token
  res.json(payload)
})

app.post('/api/me/request-phone', auth, async (req, res) => {
  try {
    await requestPhone(req.user)
    res.json({ ok: true })
  } catch (error) {
    fail(res, error.status || 500, error.message)
  }
})

app.get('/api/home', (req, res) => {
  const all = visibleProducts().map((product) => shapeProduct(product))
  res.json({
    banners: db.banners,
    categories: db.categories,
    top: all.filter((product) => product.featured).sort((a, b) => b.rating - a.rating).slice(0, 8),
    fresh: [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    sales: all.filter((product) => product.discountPrice).slice(0, 8),
  })
})

app.get('/api/categories', (req, res) => {
  res.json({ categories: db.categories })
})

app.get('/api/products', (req, res) => {
  let rows = visibleProducts()
  const { q, category, min, max, rating, sort, sale, vendor } = req.query
  if (q) {
    const query = String(q).trim().toLowerCase()
    rows = rows.filter((product) => product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query))
  }
  if (category) {
    const ids = categoryIds(category)
    rows = rows.filter((product) => ids.includes(product.categoryId))
  }
  if (vendor) rows = rows.filter((product) => product.vendorId === Number(vendor))
  if (sale === '1') rows = rows.filter((product) => product.discountPrice)
  if (min) rows = rows.filter((product) => priceOf(product) >= Number(min))
  if (max) rows = rows.filter((product) => priceOf(product) <= Number(max))
  if (rating) {
    rows = rows.filter((product) => productRating(product.id).rating >= Number(rating) || (Number(rating) <= 0))
  }
  const shaped = rows.map((product) => shapeProduct(product))
  const filtered = rating ? shaped.filter((product) => product.rating >= Number(rating)) : shaped
  if (sort === 'price_asc') filtered.sort((a, b) => priceOf(a) - priceOf(b))
  else if (sort === 'price_desc') filtered.sort((a, b) => priceOf(b) - priceOf(a))
  else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating)
  else filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ products: filtered })
})

app.get('/api/products/:id', (req, res) => {
  const product = db.products.find((item) => item.id === Number(req.params.id))
  if (!product) return fail(res, 404, 'Маҳсулот ёфт нашуд')
  const vendor = db.vendors.find((item) => item.id === product.vendorId)
  const published = product.status === 'published' && vendor?.status === 'approved'
  if (!published) return fail(res, 404, 'Маҳсулот ёфт нашуд')
  res.json({ product: shapeProduct(product, { detail: true }) })
})

app.post('/api/products/:id/reviews', auth, (req, res) => {
  const product = db.products.find((item) => item.id === Number(req.params.id) && item.status === 'published')
  if (!product) return fail(res, 404, 'Маҳсулот ёфт нашуд')
  const rating = Number(req.body?.rating)
  const text = String(req.body?.text || '').trim().slice(0, 600)
  if (!(rating >= 1 && rating <= 5)) return fail(res, 400, 'Рейтинг аз 1 то 5 бошад')
  const existing = db.reviews.find((review) => review.productId === product.id && review.userId === req.user.id)
  if (existing) {
    existing.rating = rating
    existing.text = text
    existing.createdAt = new Date().toISOString()
  } else {
    db.reviews.push({ id: nextId('review'), productId: product.id, userId: req.user.id, rating, text, createdAt: new Date().toISOString() })
  }
  save()
  res.json({ product: shapeProduct(product, { detail: true }) })
})

app.get('/api/cart', auth, (req, res) => {
  res.json(shapeCart(req.user.id))
})

app.post('/api/cart', auth, (req, res) => {
  const product = db.products.find((item) => item.id === Number(req.body?.productId) && item.status === 'published')
  if (!product) return fail(res, 404, 'Маҳсулот ёфт нашуд')
  const qty = Math.max(1, Math.min(20, Number(req.body?.qty) || 1))
  const variant = req.body?.variant || {}
  const cart = getCart(req.user.id)
  const key = variantKey(variant)
  const existing = cart.items.find((item) => item.productId === product.id && variantKey(item.variant) === key)
  const others = cart.items
    .filter((item) => item.productId === product.id && item.id !== existing?.id)
    .reduce((sum, item) => sum + item.qty, 0)
  const nextQty = (existing?.qty || 0) + qty
  if (others + nextQty > product.stock) return fail(res, 400, 'Дар анбор ин қадар нест')
  if (existing) existing.qty = nextQty
  else cart.items.push({ id: nextId('cartItem'), productId: product.id, qty, variant })
  save()
  res.json(shapeCart(req.user.id))
})

app.patch('/api/cart', auth, (req, res) => {
  const cart = getCart(req.user.id)
  const item = cart.items.find((row) => row.id === Number(req.body?.itemId))
  if (!item) return fail(res, 404, 'Мол дар сабад нест')
  const qty = Number(req.body?.qty)
  if (qty <= 0) cart.items = cart.items.filter((row) => row.id !== item.id)
  else {
    const product = db.products.find((row) => row.id === item.productId)
    const others = cart.items.filter((row) => row.productId === item.productId && row.id !== item.id).reduce((sum, row) => sum + row.qty, 0)
    if (product && others + qty > product.stock) return fail(res, 400, 'Дар анбор ин қадар нест')
    item.qty = Math.min(20, qty)
  }
  save()
  res.json(shapeCart(req.user.id))
})

app.get('/api/addresses', auth, (req, res) => {
  res.json({ addresses: db.addresses.filter((item) => item.userId === req.user.id) })
})

app.post('/api/addresses', auth, (req, res) => {
  const district = String(req.body?.district || '').trim()
  const text = String(req.body?.text || '').trim()
  if (!district || text.length < 4) return fail(res, 400, 'Ноҳия ва суроғаро пурра нависед')
  const address = {
    id: nextId('address'),
    userId: req.user.id,
    district,
    text: text.slice(0, 180),
    lat: Number(req.body?.lat) || null,
    lng: Number(req.body?.lng) || null,
  }
  db.addresses.push(address)
  save()
  res.json({ address })
})

app.delete('/api/addresses/:id', auth, (req, res) => {
  db.addresses = db.addresses.filter((item) => !(item.id === Number(req.params.id) && item.userId === req.user.id))
  save()
  res.json({ ok: true })
})

app.post('/api/orders', auth, async (req, res) => {
  try {
    const address = req.body?.address || {}
    const paymentMethod = req.body?.paymentMethod
    if (!address.district || !String(address.text || '').trim()) return fail(res, 400, 'Суроғаро интихоб кунед')
    if (!['cash', 'card'].includes(paymentMethod)) return fail(res, 400, 'Тарзи пардохтро интихоб кунед')
    let rawItems
    if (req.body?.buyNow?.productId) rawItems = [{ productId: req.body.buyNow.productId, qty: req.body.buyNow.qty || 1, variant: req.body.buyNow.variant || {} }]
    else rawItems = getCart(req.user.id).items
    if (!rawItems.length) return fail(res, 400, 'Сабад холӣ аст')
    const created = buildOrders({
      user: req.user,
      rawItems,
      address: { district: address.district, text: String(address.text).trim(), lat: address.lat || null, lng: address.lng || null },
      paymentMethod,
      note: String(req.body?.note || '').slice(0, 240),
    })
    if (!req.body?.buyNow) {
      const cart = getCart(req.user.id)
      cart.items = []
    }
    save()
    await notify({ userId: req.user.id, title: 'Фармоиш қабул шуд', body: created.map((order) => `Фармоиши шумо №${order.id} қабул шуд.`).join('\n') })
    for (const order of created) {
      const vendor = db.vendors.find((item) => item.id === order.vendorId)
      if (vendor) await notify({ userId: vendor.userId, title: `Фармоиши нав №${order.id}`, body: `Фармоиши нав №${order.id} ворид шуд.` })
    }
    const orders = created.map((order) => shapeOrder(order))
    const payment = paymentMethod === 'card' ? createPayment(orders[0]) : null
    res.json({ orders, groupId: orders[0].groupId, payment })
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Хато')
  }
})

app.get('/api/orders', auth, (req, res) => {
  const orders = db.orders.filter((order) => order.userId === req.user.id).map((order) => shapeOrder(order))
  res.json({ orders })
})

app.get('/api/orders/group/:groupId', auth, (req, res) => {
  const orders = db.orders.filter((order) => order.groupId === req.params.groupId && order.userId === req.user.id).map((order) => shapeOrder(order))
  if (!orders.length) return fail(res, 404, 'Фармоиш ёфт нашуд')
  res.json({ orders, amount: orders.reduce((sum, order) => sum + order.total, 0) })
})

app.get('/api/orders/:id', auth, (req, res) => {
  const order = db.orders.find((item) => item.id === Number(req.params.id) && item.userId === req.user.id)
  if (!order) return fail(res, 404, 'Фармоиш ёфт нашуд')
  res.json({ order: shapeOrder(order) })
})

app.post('/api/orders/:id/cancel', auth, async (req, res) => {
  const order = db.orders.find((item) => item.id === Number(req.params.id) && item.userId === req.user.id)
  if (!order) return fail(res, 404, 'Фармоиш ёфт нашуд')
  if (order.status !== 'processing') return fail(res, 400, 'Ин фармоишро дигар бекор кардан мумкин нест')
  order.status = 'cancelled'
  restoreStock(order)
  save()
  const vendor = db.vendors.find((item) => item.id === order.vendorId)
  if (vendor) await notify({ userId: vendor.userId, title: `Фармоиши №${order.id}`, body: 'Харидор фармоишро бекор кард.' })
  res.json({ order: shapeOrder(order) })
})

app.post('/api/pay/:groupId', auth, (req, res) => {
  const orders = db.orders.filter((order) => order.groupId === req.params.groupId && order.userId === req.user.id && order.paymentMethod === 'card')
  if (!orders.length) return fail(res, 404, 'Пардохт ёфт нашуд')
  const result = chargeCard(req.body || {})
  if (!result.ok) return fail(res, 400, result.error)
  for (const order of orders) {
    if (order.status !== 'cancelled') {
      order.paymentStatus = 'paid'
      order.cardLast4 = result.last4
    }
  }
  save()
  res.json({ ok: true, provider: result.provider, last4: result.last4, orders: orders.map((order) => shapeOrder(order)) })
})

app.get('/api/notifications', auth, (req, res) => {
  const items = db.notifications.filter((item) => item.userId === req.user.id).slice(0, 40)
  res.json({ notifications: items })
})

app.post('/api/notifications/read', auth, (req, res) => {
  db.notifications.forEach((item) => {
    if (item.userId === req.user.id) item.read = true
  })
  save()
  res.json({ ok: true })
})

app.post('/api/vendor/apply', auth, async (req, res) => {
  if (req.user.role === 'admin') return fail(res, 400, 'Админ наметавонад дӯкон кушояд')
  const shopName = String(req.body?.shopName || '').trim().slice(0, 60)
  const description = String(req.body?.description || '').trim().slice(0, 280)
  if (shopName.length < 2) return fail(res, 400, 'Номи дӯконро нависед')
  let vendor = db.vendors.find((item) => item.userId === req.user.id)
  if (vendor && (vendor.status === 'approved' || vendor.status === 'pending')) return fail(res, 400, 'Дархост аллакай вуҷуд дорад')
  if (vendor) {
    vendor.shopName = shopName
    vendor.description = description
    vendor.status = 'pending'
  } else {
    vendor = { id: nextId('vendor'), userId: req.user.id, shopName, description, status: 'pending', commission: 0.08, createdAt: new Date().toISOString() }
    db.vendors.push(vendor)
  }
  save()
  const admin = db.users.find((user) => user.role === 'admin')
  if (admin) await notify({ userId: admin.id, title: 'Дархости фурӯшанда', body: `${shopName} мунтазири тасдиқ аст.` })
  const payload = sessionOf(req.user)
  delete payload.token
  res.json(payload)
})

function requireVendor(req, res, next) {
  const vendor = approvedVendor(req.user.id)
  if (!vendor) return fail(res, 403, 'Кабинети фурӯшанда дастрас нест')
  req.vendor = vendor
  next()
}

app.get('/api/vendor/orders', auth, requireVendor, (req, res) => {
  const orders = db.orders.filter((order) => order.vendorId === req.vendor.id).map((order) => shapeOrder(order, { withBuyer: true }))
  res.json({ orders })
})

app.get('/api/vendor/products', auth, requireVendor, (req, res) => {
  const products = db.products.filter((product) => product.vendorId === req.vendor.id && product.status !== 'archived').map((product) => shapeProduct(product, { full: true }))
  res.json({ products })
})

app.get('/api/vendor/stats', auth, requireVendor, (req, res) => {
  const orders = db.orders.filter((order) => order.vendorId === req.vendor.id && order.status !== 'cancelled')
  res.json({
    orders: orders.length,
    sales: orders.reduce((sum, order) => sum + order.subtotal, 0),
    processing: db.orders.filter((order) => order.vendorId === req.vendor.id && order.status === 'processing').length,
    products: db.products.filter((product) => product.vendorId === req.vendor.id && product.status === 'published').length,
  })
})

function readProductBody(body) {
  const name = String(body.name || '').trim().slice(0, 80)
  const description = String(body.description || '').trim().slice(0, 800)
  const price = Number(body.price)
  const discountPrice = body.discountPrice === '' || body.discountPrice == null ? null : Number(body.discountPrice)
  const stock = Number(body.stock)
  const categoryId = Number(body.categoryId)
  const attributes = Array.isArray(body.attributes) ? body.attributes.filter((item) => item?.name && Array.isArray(item.values) && item.values.length).slice(0, 4) : []
  const images = Array.isArray(body.images) ? body.images.filter((item) => typeof item === 'string').slice(0, 6) : []
  if (name.length < 2) return { error: 'Номи маҳсулотро нависед' }
  if (!db.categories.some((category) => category.id === categoryId)) return { error: 'Категорияро интихоб кунед' }
  if (!(price > 0)) return { error: 'Нарх нодуруст аст' }
  if (discountPrice != null && (!(discountPrice > 0) || discountPrice >= price)) return { error: 'Нархи бо тахфиф бояд аз нархи асосӣ камтар бошад' }
  if (!(stock >= 0)) return { error: 'Миқдор нодуруст аст' }
  return { value: { name, description, price, discountPrice, stock: Math.min(10000, Math.round(stock)), categoryId, attributes, images } }
}

app.post('/api/vendor/products', auth, requireVendor, (req, res) => {
  const parsed = readProductBody(req.body || {})
  if (parsed.error) return fail(res, 400, parsed.error)
  const product = {
    id: nextId('product'),
    vendorId: req.vendor.id,
    ...parsed.value,
    emoji: '📦',
    hue: '#C44914',
    featured: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  db.products.push(product)
  save()
  res.json({ product: shapeProduct(product, { full: true }) })
})

app.patch('/api/vendor/products/:id', auth, requireVendor, (req, res) => {
  const product = db.products.find((item) => item.id === Number(req.params.id) && item.vendorId === req.vendor.id)
  if (!product || product.status === 'archived') return fail(res, 404, 'Маҳсулот ёфт нашуд')
  const parsed = readProductBody({ ...product, ...req.body })
  if (parsed.error) return fail(res, 400, parsed.error)
  Object.assign(product, parsed.value)
  if (product.status === 'rejected') product.status = 'pending'
  save()
  res.json({ product: shapeProduct(product, { full: true }) })
})

app.delete('/api/vendor/products/:id', auth, requireVendor, (req, res) => {
  const product = db.products.find((item) => item.id === Number(req.params.id) && item.vendorId === req.vendor.id)
  if (!product) return fail(res, 404, 'Маҳсулот ёфт нашуд')
  product.status = 'archived'
  save()
  res.json({ ok: true })
})

app.patch('/api/vendor/orders/:id', auth, requireVendor, async (req, res) => {
  const order = db.orders.find((item) => item.id === Number(req.params.id) && item.vendorId === req.vendor.id)
  if (!order) return fail(res, 404, 'Фармоиш ёфт нашуд')
  const status = req.body?.status
  const allowed = { processing: ['shipping', 'cancelled'], shipping: ['delivered', 'cancelled'], delivered: [], cancelled: [] }
  if (!allowed[order.status]?.includes(status)) return fail(res, 400, 'Ин тағйири статус мумкин нест')
  if (status === 'shipping' && order.paymentMethod === 'card' && order.paymentStatus !== 'paid') {
    return fail(res, 400, 'Пардохти кортӣ ҳанӯз нашудааст')
  }
  order.status = status
  if (status === 'cancelled') restoreStock(order)
  save()
  const copy = orderStatusCopy(order, status)
  await notify({ userId: order.userId, ...copy })
  res.json({ order: shapeOrder(order, { withBuyer: true }) })
})

app.post('/api/vendor/orders/:id/message', auth, requireVendor, async (req, res) => {
  const order = db.orders.find((item) => item.id === Number(req.params.id) && item.vendorId === req.vendor.id)
  if (!order) return fail(res, 404, 'Фармоиш ёфт нашуд')
  const text = String(req.body?.text || '').trim().slice(0, 500)
  if (text.length < 2) return fail(res, 400, 'Матнро нависед')
  await notify({ userId: order.userId, title: `Паём аз ${req.vendor.shopName}`, body: `Фармоиши №${order.id}: ${text}` })
  res.json({ ok: true })
})

app.post('/api/upload', auth, (req, res) => {
  const vendor = approvedVendor(req.user.id)
  if (req.user.role !== 'admin' && !vendor) return fail(res, 403, 'Иҷозат нест')
  upload.array('images', 6)(req, res, (error) => {
    if (error) return fail(res, 400, error.message || 'Боркунӣ нашуд')
    res.json({ urls: (req.files || []).map((file) => `/uploads/${file.filename}`) })
  })
})

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return fail(res, 403, 'Дастрасӣ танҳо барои админ')
  next()
}

function dayKey(value) {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function analytics() {
  const live = db.orders.filter((order) => order.status !== 'cancelled')
  const days = [...Array(7)].map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = dayKey(date)
    const total = live.filter((order) => dayKey(order.createdAt) === key).reduce((sum, order) => sum + order.total, 0)
    return { date: key.slice(5), total: Math.round(total) }
  })
  return {
    gmv: Math.round(live.reduce((sum, order) => sum + order.total, 0)),
    commission: Math.round(live.reduce((sum, order) => sum + order.commission, 0) * 100) / 100,
    orders: live.length,
    users: db.users.filter((user) => user.status === 'active').length,
    vendors: db.vendors.filter((vendor) => vendor.status === 'approved').length,
    pendingVendors: db.vendors.filter((vendor) => vendor.status === 'pending').length,
    pendingProducts: db.products.filter((product) => product.status === 'pending').length,
    days,
  }
}

app.get('/api/admin/stats', auth, requireAdmin, (req, res) => {
  res.json(analytics())
})

app.get('/api/admin/vendors', auth, requireAdmin, (req, res) => {
  const vendors = db.vendors.map((vendor) => {
    const owner = db.users.find((user) => user.id === vendor.userId)
    return { ...publicVendor(vendor), owner: owner ? publicUser(owner) : null }
  })
  res.json({ vendors })
})

app.patch('/api/admin/vendors/:id', auth, requireAdmin, async (req, res) => {
  const vendor = db.vendors.find((item) => item.id === Number(req.params.id))
  if (!vendor) return fail(res, 404, 'Фурӯшанда ёфт нашуд')
  const status = req.body?.status
  if (!['approved', 'rejected', 'blocked'].includes(status)) return fail(res, 400, 'Статус нодуруст аст')
  vendor.status = status
  const owner = db.users.find((user) => user.id === vendor.userId)
  if (owner && owner.role !== 'admin') {
    if (status === 'approved') owner.role = 'vendor'
    if (status === 'blocked') owner.status = 'blocked'
    if (status === 'rejected' && owner.role === 'vendor') owner.role = 'buyer'
  }
  save()
  if (owner) {
    const text = status === 'approved' ? `Дӯкони «${vendor.shopName}» тасдиқ шуд.` : status === 'rejected' ? `Дархости «${vendor.shopName}» рад шуд.` : `Дӯкони «${vendor.shopName}» баста шуд.`
    await notify({ userId: owner.id, title: 'Статуси дӯкон', body: text })
  }
  res.json({ ok: true })
})

app.get('/api/admin/products', auth, requireAdmin, (req, res) => {
  const status = req.query.status
  let rows = db.products.filter((product) => product.status !== 'archived')
  if (status) rows = rows.filter((product) => product.status === status)
  res.json({ products: rows.map((product) => shapeProduct(product, { full: true })) })
})

app.patch('/api/admin/products/:id', auth, requireAdmin, async (req, res) => {
  const product = db.products.find((item) => item.id === Number(req.params.id))
  if (!product) return fail(res, 404, 'Маҳсулот ёфт нашуд')
  const status = req.body?.status
  if (!['published', 'rejected'].includes(status)) return fail(res, 400, 'Статус нодуруст аст')
  product.status = status
  save()
  const vendor = db.vendors.find((item) => item.id === product.vendorId)
  if (vendor) {
    await notify({
      userId: vendor.userId,
      title: 'Модерасияи маҳсулот',
      body: status === 'published' ? `«${product.name}» нашр шуд.` : `«${product.name}» рад шуд.`,
    })
  }
  res.json({ product: shapeProduct(product, { full: true }) })
})

app.get('/api/admin/users', auth, requireAdmin, (req, res) => {
  res.json({ users: db.users.map(publicUser) })
})

app.patch('/api/admin/users/:id', auth, requireAdmin, async (req, res) => {
  const user = db.users.find((item) => item.id === Number(req.params.id))
  if (!user) return fail(res, 404, 'Корбар ёфт нашуд')
  if (user.id === req.user.id) return fail(res, 400, 'Худро бастан мумкин нест')
  const status = req.body?.status
  if (!['active', 'blocked'].includes(status)) return fail(res, 400, 'Статус нодуруст аст')
  user.status = status
  const vendor = db.vendors.find((item) => item.userId === user.id)
  if (vendor && vendor.status === 'approved' && status === 'blocked') vendor.status = 'blocked'
  if (vendor && vendor.status === 'blocked' && status === 'active') vendor.status = 'approved'
  save()
  res.json({ user: publicUser(user) })
})

app.get('/api/admin/orders', auth, requireAdmin, (req, res) => {
  res.json({ orders: db.orders.map((order) => shapeOrder(order, { withBuyer: true })) })
})

const dist = path.join(__dirname, '..', '..', 'client', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ error: 'Хатои дохилии сервер' })
})

const port = Number(process.env.PORT || 4000)
app.listen(port, '0.0.0.0', async () => {
  console.log(`API: http://localhost:${port}`)
  await initQueue()
  startBot()
})
