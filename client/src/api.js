export async function api(path, { method = 'GET', body, form = false } = {}) {
  const headers = {}
  const token = localStorage.getItem('token')
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const root = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const response = await fetch(`${root}/api${path}`, { method, headers, body: payload })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Хатогӣ рӯй дод')
  return data
}
