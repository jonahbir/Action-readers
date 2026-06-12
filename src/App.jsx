import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/auth/ProtectedRoute'
import BannedScreen from './components/auth/BannedScreen'
import Onboarding from './components/auth/Onboarding'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Read from './pages/Read'
import Reviews from './pages/Reviews'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function AppRoutes() {
  const { isBanned, needsOnboarding, session, loading } = useAuth()
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/read') || location.pathname === '/suspended' || location.pathname === '/onboarding'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-amber-400 animate-pulse font-serif">Opening the book...</p>
      </div>
    )
  }

  if (session && isBanned && location.pathname !== '/suspended') {
    return <BannedScreen />
  }

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/suspended" element={<BannedScreen />} />
        <Route path="/onboarding" element={
          session && needsOnboarding ? <Onboarding /> : <Landing />
        } />
        <Route path="/home" element={
          <ProtectedRoute><Home /></ProtectedRoute>
        } />
        <Route path="/read/:bookId" element={
          <ProtectedRoute><Read /></ProtectedRoute>
        } />
        <Route path="/reviews" element={
          <ProtectedRoute><Reviews /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
