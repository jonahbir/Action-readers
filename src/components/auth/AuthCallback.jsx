import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// OAuth is handled globally in AuthContext. This route just waits for session then redirects.
export default function AuthCallback() {
  const navigate = useNavigate()
  const { session, loading, needsOnboarding, isBanned, authError } = useAuth()

  useEffect(() => {
    if (loading) return
    if (authError) {
      navigate('/', { replace: true })
      return
    }
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    if (isBanned) {
      navigate('/suspended', { replace: true })
      return
    }
    navigate(needsOnboarding ? '/onboarding' : '/home', { replace: true })
  }, [loading, session, needsOnboarding, isBanned, authError, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-amber-400 animate-pulse font-serif">Welcome back — opening the book...</p>
    </div>
  )
}
