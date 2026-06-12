import { createClient } from '@supabase/supabase-js'
import { authStorage } from './authStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
