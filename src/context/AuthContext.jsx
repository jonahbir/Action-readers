import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function readOAuthError() {
  const url = new URL(window.location.href)
  const err =
    url.searchParams.get('error_description') ||
    url.searchParams.get('error')
  if (err) return decodeURIComponent(err.replace(/\+/g, ' '))

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  if (!hash) return null
  const hashParams = new URLSearchParams(hash)
  const hashErr = hashParams.get('error_description') || hashParams.get('error')
  return hashErr ? decodeURIComponent(hashErr.replace(/\+/g, ' ')) : null
}

function cleanOAuthFromUrl() {
  if (!window.location.search && !window.location.hash) return
  window.history.replaceState({}, document.title, window.location.pathname)
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data)
      return data
    }
    return null
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id)
    }
  }, [session, fetchProfile])

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      const oauthError = readOAuthError()
      if (oauthError) {
        if (mounted) {
          setAuthError(oauthError)
          setLoading(false)
        }
        cleanOAuthFromUrl()
        return
      }

      // Single call — Supabase exchanges ?code= via PKCE using authStorage (cookies + localStorage).
      // Do NOT also call exchangeCodeForSession() manually (that causes double-exchange bugs).
      const { data: { session: s }, error } = await supabase.auth.getSession()

      cleanOAuthFromUrl()

      if (!mounted) return

      if (error) {
        console.error('Auth session error:', error)
        setAuthError(error.message)
        setLoading(false)
        return
      }

      setSession(s)
      if (s?.user) {
        await fetchProfile(s.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted || event === 'INITIAL_SESSION') return

      setSession(s)
      if (s?.user) {
        await fetchProfile(s.user.id)
        setAuthError(null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signInWithGoogle = async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  const clearAuthError = () => setAuthError(null)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isSuperAdmin = profile?.role === 'super_admin'
  const isBanned = profile?.is_banned === true
  const needsOnboarding = profile ? !profile.onboarding_complete : false

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user,
      profile,
      loading,
      authError,
      clearAuthError,
      signInWithGoogle,
      signOut,
      refreshProfile,
      isAdmin,
      isSuperAdmin,
      isBanned,
      needsOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
