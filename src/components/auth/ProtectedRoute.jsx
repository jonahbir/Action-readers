import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { session, loading, isBanned, isAdmin, needsOnboarding } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-400 animate-pulse font-serif text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />
  if (isBanned) return <Navigate to="/suspended" replace />
  if (needsOnboarding) return <Navigate to="/onboarding" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/home" replace />

  return children
}
