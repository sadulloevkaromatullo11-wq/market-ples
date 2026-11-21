export function mediaUrl(src) {
  if (!src || /^(https?:|data:|blob:)/i.test(src)) return src
  const root = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  return `${root}${src.startsWith('/') ? src : `/${src}`}`
}

export function money(value) {
  const amount = Math.round(Number(value) || 0)
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} сом`
}

export function effective(product) {
  if (!product) return 0
  return product.discountPrice ?? product.price ?? 0
}

export function discountPercent(product) {
  if (!product?.discountPrice || !product.price) return 0
  return Math.round((1 - product.discountPrice / product.price) * 100)
}

export function when(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const STATUS = {
  processing: 'Дар коркард',
  shipping: 'Дар роҳ',
  delivered: 'Расонида шуд',
  cancelled: 'Бекор шуд',
  pending: 'Дар интизор',
  published: 'Нашр шуда',
  rejected: 'Рад шуд',
  approved: 'Тасдиқ шуд',
  blocked: 'Баста',
  active: 'Фаъол',
  unpaid: 'Пардохт нашудааст',
  paid: 'Пардохт шуд',
  cod: 'Нақд ҳангоми расонидан',
}

export function variantText(variant) {
  if (!variant) return ''
  return Object.entries(variant).map(([key, value]) => `${key}: ${value}`).join(' · ')
}
