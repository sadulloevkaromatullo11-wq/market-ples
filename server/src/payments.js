export function createPayment(order) {
  return {
    provider: process.env.PAYMENT_PROVIDER || 'mock',
    status: 'requires_confirmation',
    orderId: order.id,
    amount: order.total,
    currency: 'TJS',
  }
}

export function chargeCard({ cardNumber, expiry, cvc }) {
  const digits = String(cardNumber || '').replace(/\s+/g, '')
  if (!/^\d{16}$/.test(digits)) return { ok: false, error: 'Рақами корт бояд 16 рақам бошад' }
  if (!/^\d{2}\/\d{2}$/.test(expiry || '')) return { ok: false, error: 'Мӯҳлатро чун 12/28 нависед' }
  if (!/^\d{3}$/.test(cvc || '')) return { ok: false, error: 'CVC нодуруст аст' }
  return { ok: true, last4: digits.slice(-4), provider: process.env.PAYMENT_PROVIDER || 'mock' }
}
