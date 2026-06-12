import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function readOAuthError() {
  const url = new URL(window.location.href)
  const fromQuery =
    url.searchParams.get('error_description') ||
    url.searchParams.get('error')
  if (fromQuery) return decodeURIComponent(fromQuery.replace(/\+/g, ' '))

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  if (!hash) return null
  const hashParams = new URLSearchParams(hash)
  const fromHash =
    hashParams.get('error_description') ||
    hashParams.get('error')
  return fromHash ? decodeURIComponent(fromHash.replace(/\+/g, ' ')) : null
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

    // Supabase docs: rely on onAuthStateChange — it parses OAuth tokens from the URL
    // before firing INITIAL_SESSION. Do NOT call getSession() or clean the URL manually.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setSession(s)

        if (s?.user) {
          await fetchProfile(s.user.id)
          setAuthError(null)
        } else {
          setProfile(null)
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
            const err = readOAuthError()
            if (err) setAuthError(err)
          }
        }

        setLoading(false)
      }
    })

    // Fallback if INITIAL_SESSION never fires (slow network, etc.)
    const timeout = setTimeout(async () => {
      if (!mounted || !loading) return
      const { data: { session: s } } = await supabase.auth.getSession()
      if (s) {
        setSession(s)
        await fetchProfile(s.user.id)
      } else {
        const err = readOAuthError()
        if (err) setAuthError(err)
      }
      setLoading(false)
    }, 8000)

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile, loading])

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
