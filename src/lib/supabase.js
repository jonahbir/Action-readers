import { createClient } from '@supabase/supabase-js'
import { authStorage } from './authStorage'

/** Strip accidental "VAR_NAME=value" paste from Vercel env setup. */
function normalizeEnv(value, varName) {
  if (!value || typeof value !== 'string') return value
  const prefix = `${varName}=`
  return value.startsWith(prefix) ? value.slice(prefix.length).trim() : value.trim()
}

const supabaseUrl = normalizeEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
const supabaseAnonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// Implicit flow: tokens return in the URL hash — no PKCE verifier needed.
// This works reliably on mobile Safari and in-app browsers where PKCE storage is lost.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storage: authStorage,
  },
})
