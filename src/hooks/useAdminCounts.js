import { useState, useEffect, useCallback, useId } from 'react'
import { supabase } from '../lib/supabase'

const POLL_MS = 60 * 1000

/** Counts of items admins should check — shown as badges on the admin sidebar. */
export function useAdminCounts({ enabled = true } = {}) {
  const channelId = useId()
  const [counts, setCounts] = useState({
    reviews: 0,
    users: 0,
    books: 0,
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!enabled) return

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [
      { count: pendingReviews },
      { count: newMembers },
      { count: booksMissingPdf },
    ] = await Promise.all([
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_complete', true)
        .gte('joined_at', weekAgo.toISOString()),
      supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('pdf_storage_path', null),
    ])

    setCounts({
      reviews: pendingReviews || 0,
      users: newMembers || 0,
      books: booksMissingPdf || 0,
    })
    setLoading(false)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    refresh()

    const channel = supabase
      .channel(`admin-notification-counts${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => refresh())
      .subscribe()

    const poll = setInterval(refresh, POLL_MS)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [enabled, refresh, channelId])

  const total = counts.reviews + counts.users + counts.books

  return { counts, total, loading, refresh }
}
