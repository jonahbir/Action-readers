import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const oauthError = params.get('error_description') || params.get('error')

      if (oauthError) {
        setError(oauthError)
        setTimeout(() => navigate('/', { replace: true }), 4000)
        return
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Sign-in could not be completed. Please try again.')
          setTimeout(() => navigate('/', { replace: true }), 4000)
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_complete, is_banned')
          .eq('id', session.user.id)
          .single()

        window.history.replaceState({}, '', '/auth/callback')

        if (profile?.is_banned) {
          navigate('/suspended', { replace: true })
        } else if (!profile?.onboarding_complete) {
          navigate('/onboarding', { replace: true })
        } else {
          navigate('/home', { replace: true })
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err.message || 'Sign-in failed')
        setTimeout(() => navigate('/', { replace: true }), 4000)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-400 mb-2">Sign-in issue</p>
            <p className="text-text-muted text-sm">{error}</p>
            <p className="text-text-muted text-xs mt-2">Redirecting...</p>
          </>
        ) : (
          <p className="text-amber-400 animate-pulse font-serif">Welcome back — opening the book...</p>
        )}
      </div>
    </div>
  )
}
