import { useEffect, useState } from 'react'

const KEY = 'dukon-favs'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function toggleFav(id) {
  const current = read()
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('dukon-favs'))
  return next
}

export function useFavs() {
  const [ids, setIds] = useState(read)
  useEffect(() => {
    const sync = () => setIds(read())
    window.addEventListener('dukon-favs', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('dukon-favs', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return ids
}
