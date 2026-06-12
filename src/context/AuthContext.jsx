import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function getOAuthParams() {
  const url = new URL(window.location.href)
  const fromQuery = {
    code: url.searchParams.get('code'),
    error: url.searchParams.get('error_description') || url.searchParams.get('error'),
  }
  if (fromQuery.code || fromQuery.error) return fromQuery

  // Legacy implicit flow hash tokens
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const hashParams = new URLSearchParams(hash)
  return {
    code: hashParams.get('code'),
    error: hashParams.get('error_description') || hashParams.get('error'),
  }
}

function cleanOAuthFromUrl() {
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
      const { code, error: oauthError } = getOAuthParams()

      if (oauthError) {
        if (mounted) {
          setAuthError(decodeURIComponent(oauthError.replace(/\+/g, ' ')))
          setLoading(false)
        }
        cleanOAuthFromUrl()
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        cleanOAuthFromUrl()
        if (exchangeError) {
          console.error('OAuth code exchange failed:', exchangeError)
          if (mounted) {
            setAuthError(exchangeError.message || 'Sign-in failed. Please try again.')
            setLoading(false)
          }
          return
        }
      }

      const { data: { session: s } } = await supabase.auth.getSession()
      if (!mounted) return

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
      if (!mounted) return
      if (event === 'INITIAL_SESSION') return

      setSession(s)
      if (s?.user) {
        await fetchProfile(s.user.id)
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
    const redirectTo = `${window.location.origin}/`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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
