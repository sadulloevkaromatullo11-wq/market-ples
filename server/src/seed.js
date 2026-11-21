import { db, save } from './db.js'

function daysAgo(days, hour = 11) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 15, 0, 0)
  return date.toISOString()
}

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`

const SEED_VERSION = 3

export function seedIfEmpty() {
  if (db.meta?.seedVersion === SEED_VERSION && db.users.length) return
  db.meta = { seedVersion: SEED_VERSION }
  db.seq = { user: 20, vendor: 10, product: 100, order: 10050, review: 100, notif: 100, address: 20, cartItem: 50, group: 50 }
  db.users = []
  db.vendors = []
  db.categories = []
  db.products = []
  db.reviews = []
  db.carts = []
  db.orders = []
  db.banners = []
  db.notifications = []
  db.addresses = []

  db.users.push(
    { id: 1, telegramId: 1001, firstName: 'Азиза', lastName: 'Каримова', username: 'aziza', phone: '+992900112233', photo: '', role: 'buyer', status: 'active', createdAt: daysAgo(40) },
    { id: 2, telegramId: 1002, firstName: 'Фаррух', lastName: 'Собир', username: 'farrukh', phone: '+992900220011', photo: '', role: 'vendor', status: 'active', createdAt: daysAgo(50) },
    { id: 3, telegramId: 1003, firstName: 'Мадина', lastName: 'Раҳимова', username: 'madina', phone: '+992900330022', photo: '', role: 'vendor', status: 'active', createdAt: daysAgo(48) },
    { id: 4, telegramId: 1004, firstName: 'Комрон', lastName: 'Ҷураев', username: 'komron', phone: '+992900440033', photo: '', role: 'buyer', status: 'active', createdAt: daysAgo(3) },
    { id: 5, telegramId: 1005, firstName: 'Нигора', lastName: 'Админ', username: 'admin', phone: '+992900550044', photo: '', role: 'admin', status: 'active', createdAt: daysAgo(80) },
    { id: 6, telegramId: 1006, firstName: 'Шабнам', lastName: 'Юсуфӣ', username: 'shabnam', phone: '+992900660055', photo: '', role: 'buyer', status: 'active', createdAt: daysAgo(20) },
    { id: 7, telegramId: 1007, firstName: 'Саид', lastName: 'Назар', username: 'said', phone: '+992900770066', photo: '', role: 'buyer', status: 'active', createdAt: daysAgo(15) },
    { id: 8, telegramId: 1008, firstName: 'Рустам', lastName: 'Қодирӣ', username: 'rustam', phone: '', photo: '', role: 'buyer', status: 'blocked', createdAt: daysAgo(12) },
    { id: 9, telegramId: 1009, firstName: 'Барзу', lastName: 'Камол', username: 'barzu', phone: '+992900880077', photo: '', role: 'vendor', status: 'active', createdAt: daysAgo(30) },
  )

  db.vendors.push(
    { id: 1, userId: 2, shopName: 'Дӯкони Заррина', description: 'Маҳсулоти табиӣ, чой, асал ва асбобҳои хона.', status: 'approved', commission: 0.08, createdAt: daysAgo(50) },
    { id: 2, userId: 3, shopName: 'Либоси Тоҷик', description: 'Либоси атлас, пойафзол ва бозичаҳои кӯдакона.', status: 'approved', commission: 0.1, createdAt: daysAgo(48) },
    { id: 3, userId: 4, shopName: 'Гаджет Хоум', description: 'Дархости нав барои фурӯши гӯшмонак ва лавозимот.', status: 'pending', commission: 0.08, createdAt: daysAgo(1) },
    { id: 4, userId: 9, shopName: 'Техно Душанбе', description: 'Телефон, гӯшмонак ва лавозимоти барқӣ.', status: 'approved', commission: 0.09, createdAt: daysAgo(30) },
  )

  db.categories.push(
    { id: 1, parentId: null, name: 'Хӯрокворӣ', slug: 'food', icon: '🍯' },
    { id: 2, parentId: null, name: 'Либос', slug: 'clothes', icon: '👗' },
    { id: 3, parentId: null, name: 'Электроника', slug: 'electronics', icon: '📱' },
    { id: 4, parentId: null, name: 'Хона', slug: 'home', icon: '🏠' },
    { id: 5, parentId: null, name: 'Зебоӣ', slug: 'beauty', icon: '✨' },
    { id: 6, parentId: null, name: 'Кӯдакон', slug: 'kids', icon: '🧸' },
    { id: 7, parentId: 2, name: 'Занона', slug: 'women', icon: '👚' },
    { id: 8, parentId: 2, name: 'Мардона', slug: 'men', icon: '👕' },
    { id: 9, parentId: 2, name: 'Пойафзол', slug: 'shoes', icon: '👟' },
  )

  const product = (row) => ({ status: 'published', discountPrice: null, featured: false, attributes: [], images: [], ...row })

  db.products.push(
    product({ id: 1, vendorId: 1, categoryId: 1, name: 'Асали кӯҳии Бадахшон', description: 'Асали табиии баландкӯҳ, ғафс ва хушбӯй. Бе иловаи шакар ҷамъоварӣ шудааст. Барои чой, нон ва тӯҳфа мувофиқ аст.', price: 95, discountPrice: 76, stock: 40, featured: true, emoji: '🍯', hue: '#E7A21A', images: [img('photo-1558642452-9d2a7deb7f62')], attributes: [{ name: 'Вазн', values: ['250 г', '500 г', '1 кг'] }], createdAt: daysAgo(2) }),
    product({ id: 2, vendorId: 1, categoryId: 1, name: 'Нони танурии гарм', description: 'Нон аз орди гандуми маҳаллӣ, субҳ дар танур пухта мешавад. Фармоиш то соати 16 барои расонидани ҳамон рӯз.', price: 6, stock: 80, featured: true, emoji: '🍞', hue: '#C47A3A', images: [img('photo-1509440159596-0249088772ff')], createdAt: daysAgo(1) }),
    product({ id: 3, vendorId: 1, categoryId: 1, name: 'Чойи сабзи навшун', description: 'Чойи барги дастчин, бӯи сабук дорад ва ранги шаффоф медиҳад. Дар қуттии 100-граммагӣ.', price: 28, discountPrice: 22, stock: 50, emoji: '🍵', hue: '#3E7A45', images: [img('photo-1564890369478-c89ca6d9cde9')], createdAt: daysAgo(6) }),
    product({ id: 4, vendorId: 1, categoryId: 1, name: 'Равғани зағири хонагӣ', description: 'Равғани хунукфишурда барои салат ва таомҳои хонагӣ. Дар шишаи тира нигоҳ дошта мешавад.', price: 34, stock: 30, emoji: '🫙', hue: '#C6A15B', images: [img('photo-1474979266404-7eaacbcd87c5')], createdAt: daysAgo(18) }),
    product({ id: 5, vendorId: 1, categoryId: 5, name: 'Креми намноккунанда', description: 'Креми сабуки рӯз барои ҳавои хушки шаҳр. Бе бӯи тез, зуд мечаспад.', price: 65, discountPrice: 52, stock: 20, emoji: '🧴', hue: '#E7C2B5', images: [img('photo-1608248543803-ba4f8c70ae0b')], createdAt: daysAgo(4) }),
    product({ id: 6, vendorId: 1, categoryId: 5, name: 'Атри гули асал', description: 'Атри пардадори гулӣ бо охири ширин. Ҳаҷми 50 мл, барои рӯз мувофиқ аст.', price: 120, stock: 15, featured: true, emoji: '🌸', hue: '#D9899A', images: [img('photo-1588405748880-12d1d2a59f75')], createdAt: daysAgo(9) }),
    product({ id: 7, vendorId: 1, categoryId: 4, name: 'Чойҷӯши барқӣ', description: 'Чойҷӯши 1.7-литра бо хомӯшии худкор. Дастаки гармнашаванда ва сарпӯши қулфшаванда дорад.', price: 240, discountPrice: 199, stock: 10, emoji: '🫖', hue: '#8AA0B4', images: [], createdAt: daysAgo(8) }),
    product({ id: 8, vendorId: 1, categoryId: 4, name: 'Маҷмӯаи пиёлаи чой', description: 'Чор пиёла ва чойникчаи сафолӣ бо нақши оддӣ. Барои меҳмонӣ мувофиқ аст.', price: 88, stock: 12, emoji: '☕', hue: '#A98467', images: [img('photo-1544787219-7f47ccb76574')], createdAt: daysAgo(21) }),
    product({ id: 9, vendorId: 2, categoryId: 7, name: 'Куртаи атласи занона', description: 'Атласи тобнок бо гулдӯзии сабук. Барои тӯй ва ид дӯхта шудааст. Андоза ва рангро интихоб кунед.', price: 280, discountPrice: 210, stock: 8, featured: true, emoji: '👗', hue: '#7A2F4B', images: [img('photo-1595777457583-95e059d581b8')], attributes: [{ name: 'Ранг', values: ['Бунафш', 'Сурх', 'Сабз'] }, { name: 'Андоза', values: ['S', 'M', 'L', 'XL'] }], createdAt: daysAgo(3) }),
    product({ id: 10, vendorId: 2, categoryId: 2, name: 'Тоқии чакандӯзӣ', description: 'Тоқии дастдӯз бо гули анъанавӣ. Туҳфаи хуб барои меҳмонон.', price: 45, stock: 25, featured: true, emoji: '🧢', hue: '#1F4E45', images: [], createdAt: daysAgo(11) }),
    product({ id: 11, vendorId: 2, categoryId: 8, name: 'Куртаи мардонаи пахтагӣ', description: 'Куртаи сабуки рӯзона аз пахта. Дар об намешинавад ва барои ҳавои гарм мувофиқ аст.', price: 95, stock: 18, emoji: '👕', hue: '#D8D2C8', images: [img('photo-1596755094514-f87e34085b2c')], attributes: [{ name: 'Ранг', values: ['Сафед', 'Кабуд', 'Хокӣ'] }, { name: 'Андоза', values: ['M', 'L', 'XL'] }], createdAt: daysAgo(7) }),
    product({ id: 12, vendorId: 2, categoryId: 9, name: 'Пойафзоли варзишӣ', description: 'Пойафзоли сабук барои роҳравии ҳаррӯза. Ҳоло дар анбор нест — ба зудӣ меояд.', price: 220, discountPrice: 175, stock: 0, emoji: '👟', hue: '#E4572E', images: [img('photo-1560769629-975ec94e6a86')], attributes: [{ name: 'Андоза', values: ['40', '41', '42', '43'] }], createdAt: daysAgo(5) }),
    product({ id: 13, vendorId: 2, categoryId: 6, name: 'Бозичаи чӯбии кӯдакона', description: 'Маҷмӯаи чӯби рангкардашуда, бе қисмҳои майда. Барои синни аз 3 сола.', price: 54, stock: 14, emoji: '🧸', hue: '#E0B15A', images: [img('photo-1596461404969-9ae70f2830c1')], createdAt: daysAgo(4) }),
    product({ id: 14, vendorId: 4, categoryId: 3, name: 'Смартфони Nova X', description: 'Экрани равшан, батареяи якрӯза ва хотираи васеъ. Кафолати мағоза 12 моҳ.', price: 1890, discountPrice: 1690, stock: 6, featured: true, emoji: '📱', hue: '#243044', images: [img('photo-1598327105666-5b89351aff97')], attributes: [{ name: 'Ранг', values: ['Сиёҳ', 'Кабуд'] }, { name: 'Хотира', values: ['128 ГБ', '256 ГБ'] }], createdAt: daysAgo(2) }),
    product({ id: 15, vendorId: 4, categoryId: 3, name: 'Гӯшмонаки бесим', description: 'Гӯшмонак бо қуттии заряд ва микрофони равшан. То 18 соат бо қуттӣ кор мекунад.', price: 160, stock: 22, featured: true, emoji: '🎧', hue: '#2C2C34', images: [img('photo-1505740420928-5e560c06d30e')], createdAt: daysAgo(1, 9) }),
    product({ id: 16, vendorId: 4, categoryId: 3, name: 'Зарядники зуд', description: 'Зарядники 20Вт бо сими навъи C. Барои телефонҳои нав мувофиқ аст.', price: 39, stock: 40, emoji: '🔌', hue: '#F2F2F2', images: [], createdAt: daysAgo(12) }),
    product({ id: 17, vendorId: 1, categoryId: 1, name: 'Муррабои тут', description: 'Муррабои хонагӣ аз тути тобистона. Пеш аз нашр мунтазири тасдиқи админ аст.', price: 18, stock: 20, emoji: '🫐', hue: '#6A3A72', images: [], status: 'pending', createdAt: daysAgo(0, 8) }),
    product({ id: 18, vendorId: 3, categoryId: 3, name: 'Гӯшмонаки ибтидоӣ', description: 'Маҳсулоти фурӯшандаи нав. Пас аз тасдиқи профил ва модерасия нашр мешавад.', price: 70, stock: 10, emoji: '🎧', hue: '#444', images: [], status: 'pending', createdAt: daysAgo(0, 7) }),
  )

  db.reviews.push(
    { id: 1, productId: 1, userId: 6, rating: 5, text: 'Асал хеле ғафс ва хушбӯй буд. Бачаҳо бевосита бо нон хӯрданд.', createdAt: daysAgo(1) },
    { id: 2, productId: 1, userId: 7, rating: 4, text: 'Таъмаш хуб аст, бастабандӣ тоза омад.', createdAt: daysAgo(2) },
    { id: 3, productId: 9, userId: 6, rating: 5, text: 'Атлас сифати баланд дорад, андоза рост омад.', createdAt: daysAgo(2) },
    { id: 4, productId: 14, userId: 7, rating: 4, text: 'Телефон зуд аст, расонидан як рӯз кашид.', createdAt: daysAgo(3) },
    { id: 5, productId: 10, userId: 1, rating: 5, text: 'Тоқӣ зебо дӯхта шудааст. Туҳфа кардам.', createdAt: daysAgo(5) },
    { id: 6, productId: 15, userId: 6, rating: 4, text: 'Садо равшан аст, қуттӣ каме харошида буд.', createdAt: daysAgo(1, 15) },
  )

  db.banners.push(
    { id: 1, title: 'Тахфифи ҳафта', subtitle: 'То 40% ба маҳсулоти мунтахаб', tone: 'terra', href: '/catalog?sale=1' },
    { id: 2, title: 'Расонидан ройгон', subtitle: 'Аз 200 сомонӣ дар дохили Душанбе', tone: 'green', href: '/catalog' },
    { id: 3, title: 'Дӯкони худро кушоед', subtitle: 'Фурӯшанда шавед ва фармоиш гиред', tone: 'ink', href: '/profile' },
  )

  db.addresses.push(
    { id: 1, userId: 1, district: 'Сино', text: 'кӯчаи Рӯдакӣ, хонаи 18, ҳуҷраи 4', lat: 38.555, lng: 68.748 },
  )

  const address = { district: 'Сино', text: 'кӯчаи Рӯдакӣ, хонаи 18, ҳуҷраи 4', lat: 38.555, lng: 68.748 }
  const makeOrder = ({ id, userId, vendorId, status, paymentMethod, paymentStatus, day, hour, items, where = address }) => {
    const vendor = db.vendors.find((item) => item.id === vendorId)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
    const delivery = subtotal >= 200 ? 0 : 15
    const commission = Math.round(subtotal * vendor.commission * 100) / 100
    return {
      id,
      groupId: `G${id}`,
      userId,
      vendorId,
      status,
      paymentMethod,
      paymentStatus,
      cardLast4: paymentMethod === 'card' ? '4242' : null,
      address: where,
      items,
      subtotal,
      delivery,
      commission,
      total: subtotal + delivery,
      note: '',
      createdAt: daysAgo(day, hour),
    }
  }

  db.orders.push(
    makeOrder({ id: 10041, userId: 1, vendorId: 1, status: 'delivered', paymentMethod: 'cash', paymentStatus: 'cod', day: 6, items: [{ productId: 1, name: 'Асали кӯҳии Бадахшон', price: 76, qty: 1, variant: { Вазн: '500 г' }, emoji: '🍯' }] }),
    makeOrder({ id: 10042, userId: 6, vendorId: 2, status: 'delivered', paymentMethod: 'card', paymentStatus: 'paid', day: 4, items: [{ productId: 13, name: 'Бозичаи чӯбии кӯдакона', price: 54, qty: 1, variant: {}, emoji: '🧸' }] }),
    makeOrder({ id: 10043, userId: 1, vendorId: 2, status: 'delivered', paymentMethod: 'card', paymentStatus: 'paid', day: 3, items: [{ productId: 9, name: 'Куртаи атласи занона', price: 210, qty: 1, variant: { Ранг: 'Бунафш', Андоза: 'M' }, emoji: '👗' }] }),
    makeOrder({ id: 10044, userId: 7, vendorId: 4, status: 'delivered', paymentMethod: 'cash', paymentStatus: 'cod', day: 2, items: [{ productId: 15, name: 'Гӯшмонаки бесим', price: 160, qty: 1, variant: {}, emoji: '🎧' }] }),
    makeOrder({ id: 10045, userId: 1, vendorId: 2, status: 'shipping', paymentMethod: 'cash', paymentStatus: 'cod', day: 1, items: [{ productId: 11, name: 'Куртаи мардонаи пахтагӣ', price: 95, qty: 1, variant: { Ранг: 'Кабуд', Андоза: 'L' }, emoji: '👕' }] }),
    makeOrder({ id: 10046, userId: 1, vendorId: 1, status: 'processing', paymentMethod: 'cash', paymentStatus: 'cod', day: 0, hour: 9, items: [{ productId: 4, name: 'Равғани зағири хонагӣ', price: 34, qty: 1, variant: {}, emoji: '🫙' }, { productId: 3, name: 'Чойи сабзи навшун', price: 22, qty: 1, variant: {}, emoji: '🍵' }] }),
  )

  db.carts.push({
    userId: 1,
    items: [
      { id: 1, productId: 6, qty: 1, variant: {} },
      { id: 2, productId: 2, qty: 2, variant: {} },
    ],
  })

  db.notifications.push(
    { id: 1, userId: 2, title: 'Фармоиши нав №10046', body: 'Фармоиши нав №10046 ворид шуд.', read: false, createdAt: daysAgo(0, 9) },
    { id: 2, userId: 1, title: 'Фармоиш дар роҳ аст', body: 'Фармоиши №10045 дар роҳ аст.', read: false, createdAt: daysAgo(1, 16) },
    { id: 3, userId: 1, title: 'Фармоиш қабул шуд', body: 'Фармоиши шумо №10046 қабул шуд.', read: true, createdAt: daysAgo(0, 9) },
  )

  save()
  console.log('Маълумоти намунавӣ бор шуд')
}
