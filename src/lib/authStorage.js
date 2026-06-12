/**
 * Hybrid storage: localStorage + cookies.
 * Cookies survive OAuth redirects better on mobile Safari / in-app browsers
 * where localStorage can be cleared during the Google redirect.
 */
const canUseCookies = typeof document !== 'undefined'

function cookieGet(key) {
  if (!canUseCookies) return null
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function cookieSet(key, value) {
  if (!canUseCookies) return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  // 10 min — long enough for any OAuth round-trip
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=600; SameSite=Lax${secure}`
}

function cookieRemove(key) {
  if (!canUseCookies) return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax${secure}`
}

export const authStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key) ?? cookieGet(key)
    } catch {
      return cookieGet(key)
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // localStorage blocked (private mode, etc.)
    }
    cookieSet(key, value)
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    cookieRemove(key)
  },
}
