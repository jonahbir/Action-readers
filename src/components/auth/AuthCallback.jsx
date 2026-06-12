import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Legacy route — redirect to home once session is ready (implicit flow lands on / anyway)
export default function AuthCallback() {
  const navigate = useNavigate()
  const { session, loading, needsOnboarding, isBanned } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    if (isBanned) {
      navigate('/suspended', { replace: true })
      return
    }
    navigate(needsOnboarding ? '/onboarding' : '/home', { replace: true })
  }, [loading, session, needsOnboarding, isBanned, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-amber-400 animate-pulse font-serif">Signing you in...</p>
    </div>
  )
}
