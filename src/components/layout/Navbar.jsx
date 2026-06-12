import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Logo from '../ui/Logo'
import { APP_NAME } from '../../lib/constants'

export default function Navbar() {
  const { session, profile, signInWithGoogle, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = session
    ? [
        { to: '/home', label: 'Home' },
        { to: '/reviews', label: 'Reviews' },
        { to: '/profile', label: 'Profile' },
        ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : []

  const linkClass = (to) =>
    `block px-4 py-2.5 rounded-lg text-sm transition-colors ${
      location.pathname.startsWith(to)
        ? 'text-amber-400 bg-amber-500/10'
        : 'text-gray-400 hover:text-gray-200 hover:bg-surface-overlay'
    }`

  return (
    <nav className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link
          to={session ? '/home' : '/'}
          className="flex items-center gap-2 min-w-0 shrink"
          onClick={() => setMenuOpen(false)}
        >
          <Logo />
          <span className="font-serif font-bold text-amber-400 truncate">{APP_NAME}</span>
        </Link>

        {session && (
          <>
            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map(({ to, label }) => (
                <Link key={to} to={to} className={linkClass(to).replace('block ', '')}>
                  {label}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-border-subtle shrink-0">
              <Avatar src={profile?.avatar_url} handle={profile?.biblical_handle} size="sm" />
              <span className="text-sm text-amber-400/80 max-w-[8rem] truncate">@{profile?.biblical_handle}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>

            {/* Mobile: avatar + menu toggle */}
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <Avatar src={profile?.avatar_url} handle={profile?.biblical_handle} size="sm" />
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-overlay transition-colors"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </>
        )}

        {!session && (
          <Button size="sm" onClick={signInWithGoogle} className="shrink-0">Sign in with Google</Button>
        )}
      </div>

      {/* Mobile menu panel */}
      {session && menuOpen && (
        <div className="lg:hidden border-t border-border-subtle bg-surface/98 backdrop-blur-md animate-slide-down">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} className={linkClass(to)} onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-border-subtle flex items-center justify-between px-4 py-2">
              <span className="text-sm text-amber-400/80">@{profile?.biblical_handle}</span>
              <button
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
