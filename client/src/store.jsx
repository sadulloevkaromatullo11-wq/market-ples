import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

function waitTelegram() {
  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      const webapp = window.Telegram?.WebApp
      if ((webapp && webapp.initData) || Date.now() - started > 700) resolve(webapp)
      else setTimeout(tick, 40)
    }
    tick()
  })
}

export function Provider({ children }) {
  const [user, setUser] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [unread, setUnread] = useState(0)
  const [ready, setReady] = useState(false)
  const [theme, setThemeState] = useState('light')
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast] = useState(null)
  const [inTelegram, setInTelegram] = useState(false)

  const showToast = useCallback((text) => {
    setToast(text)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToast(null), 2200)
  }, [])

  const applyTheme = useCallback((mode) => {
    setThemeState(mode)
    document.documentElement.classList.toggle('dark', mode === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#101311' : '#2f86ff')
    const webapp = window.Telegram?.WebApp
    try {
      webapp?.setHeaderColor(mode === 'dark' ? '#101311' : '#2f86ff')
      webapp?.setBackgroundColor(mode === 'dark' ? '#101311' : '#f3f6fb')
    } catch {
      /* older Telegram clients */
    }
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      const data = await api('/cart')
      setCartCount(data.items.reduce((sum, item) => sum + item.qty, 0))
      return data
    } catch {
      setCartCount(0)
      return { items: [], subtotal: 0, delivery: 0, total: 0 }
    }
  }, [])

  const adopt = useCallback(async (data, keepToken = false) => {
    if (!keepToken && data.token) localStorage.setItem('token', data.token)
    setUser(data.user)
    setVendor(data.vendor || null)
    setUnread(data.unread || 0)
    await refreshCart()
  }, [refreshCart])

  useEffect(() => {
    let detach = () => {}
    ;(async () => {
      const webapp = await waitTelegram()
      const inside = !!(webapp && webapp.initData)
      setInTelegram(inside)
      webapp?.ready?.()
      webapp?.expand?.()
      const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const scheme = inside ? (webapp.colorScheme || 'light') : (localStorage.getItem('theme') || preferred)
      applyTheme(scheme)
      if (inside && webapp.onEvent) {
        const onTheme = () => applyTheme(webapp.colorScheme || 'light')
        webapp.onEvent('themeChanged', onTheme)
        detach = () => webapp.offEvent?.('themeChanged', onTheme)
      }
      try {
        if (inside) await adopt(await api('/auth/telegram', { method: 'POST', body: { initData: webapp.initData } }))
        else if (localStorage.getItem('token')) await adopt(await api('/me'), true)
      } catch {
        localStorage.removeItem('token')
      } finally {
        setReady(true)
      }
    })()
    return () => detach()
  }, [adopt, applyTheme])

  const loginDemo = async (role) => {
    await adopt(await api('/auth/demo', { method: 'POST', body: { role } }))
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setVendor(null)
    setUnread(0)
    setCartCount(0)
  }

  const setTheme = (mode) => {
    localStorage.setItem('theme', mode)
    applyTheme(mode)
  }

  const refreshMe = async () => {
    const data = await api('/me')
    setUser(data.user)
    setVendor(data.vendor || null)
    setUnread(data.unread || 0)
    return data
  }

  return (
    <Ctx.Provider value={{ user, setUser, vendor, setVendor, unread, ready, theme, setTheme, cartCount, refreshCart, refreshMe, toast, showToast, inTelegram, loginDemo, logout }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </Ctx.Provider>
  )
}
