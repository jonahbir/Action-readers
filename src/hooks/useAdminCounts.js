import { useState, useEffect, useCallback, useId } from 'react'
import { supabase } from '../lib/supabase'
import { getAdminSeenAt, markAdminSeen } from '../lib/adminSeen'

const POLL_MS = 60 * 1000
const COUNTED_SECTIONS = ['reviews', 'users', 'books']

/** Unseen admin notifications — only items created after the admin last opened that section. */
export function useAdminCounts({ enabled = true, userId } = {}) {
  const channelId = useId()
  const [counts, setCounts] = useState({
    reviews: 0,
    users: 0,
    books: 0,
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!enabled || !userId) return

    const reviewsSince = getAdminSeenAt(userId, 'reviews')
    const usersSince = getAdminSeenAt(userId, 'users')
    const booksSince = getAdminSeenAt(userId, 'books')

    const [
      { count: newPendingReviews },
      { count: newMembers },
      { count: newBooksNeedingPdf },
    ] = await Promise.all([
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gt('created_at', reviewsSince),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_complete', true)
        .gt('joined_at', usersSince),
      supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('pdf_storage_path', null)
        .gt('created_at', booksSince),
    ])

    setCounts({
      reviews: newPendingReviews || 0,
      users: newMembers || 0,
      books: newBooksNeedingPdf || 0,
    })
    setLoading(false)
  }, [enabled, userId])

  useEffect(() => {
    if (!enabled || !userId) return

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
  }, [enabled, userId, refresh, channelId])

  const markSeen = useCallback((section) => {
    if (!userId || !COUNTED_SECTIONS.includes(section)) return
    markAdminSeen(userId, section)
    refresh()
  }, [userId, refresh])

  const total = counts.reviews + counts.users + counts.books

  return { counts, total, loading, refresh, markSeen }
}
