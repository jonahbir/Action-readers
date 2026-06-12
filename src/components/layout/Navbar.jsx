import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { FELLOWSHIP_NAME } from '../../lib/constants'

export default function Navbar() {
  const { session, profile, signInWithGoogle, signOut, isAdmin } = useAuth()
  const location = useLocation()

  const links = session
    ? [
        { to: '/home', label: 'Home' },
        { to: '/reviews', label: 'Reviews' },
        { to: '/profile', label: 'Profile' },
        ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : []

  return (
    <nav className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={session ? '/home' : '/'} className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <span className="font-serif font-bold text-amber-400 hidden sm:block">{FELLOWSHIP_NAME}</span>
        </Link>

        {session && (
          <div className="flex items-center gap-1 sm:gap-4">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  location.pathname.startsWith(to)
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border-subtle">
              <Avatar src={profile?.avatar_url} handle={profile?.biblical_handle} size="sm" />
              <span className="text-sm text-amber-400/80 hidden md:block">@{profile?.biblical_handle}</span>
              <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-300 ml-1">Sign out</button>
            </div>
          </div>
        )}

        {!session && location.pathname === '/' && (
          <Button size="sm" onClick={signInWithGoogle}>Sign in with Google</Button>
        )}
      </div>
    </nav>
  )
}
