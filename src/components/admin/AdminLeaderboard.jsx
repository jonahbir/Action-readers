import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { comprehensionAccuracy, formatReadingTime } from '../../lib/scoring'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import SkeletonCard from '../ui/SkeletonCard'

const POLL_MS = 2 * 60 * 1000

export default function AdminLeaderboard() {
  const [rankings, setRankings] = useState([])
  const [books, setBooks] = useState([])
  const [bookFilter, setBookFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    supabase.from('books').select('id, title, week_number').order('week_number', { ascending: false })
      .then(({ data }) => setBooks(data || []))
    loadRankings()

    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_book_progress' }, () => loadRankings())
      .subscribe()

    const poll = setInterval(loadRankings, POLL_MS)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [bookFilter])

  async function loadRankings() {
    setLoading(true)
    let query = supabase
      .from('user_book_progress')
      .select('*, users(biblical_handle, avatar_url, display_name, is_banned), books(title, week_number, is_active)')
      .gt('verified_pages', 0)
      .order('score', { ascending: false })

    if (bookFilter !== 'all') query = query.eq('book_id', bookFilter)

    const { data: progress, error } = await query

    if (error) {
      console.error('Leaderboard load error:', error)
      setLoading(false)
      return
    }

    const enriched = await Promise.all((progress || [])
      .filter(p => p.users && !p.users.is_banned)
      .map(async (p) => {
        const { data: checks } = await supabase
          .from('comprehension_checks')
          .select('is_correct')
          .eq('user_id', p.user_id)
          .eq('book_id', p.book_id)
        const correct = (checks || []).filter(c => c.is_correct).length
        return {
          ...p,
          comprehensionPct: comprehensionAccuracy(correct, (checks || []).length),
        }
      }))

    enriched.sort((a, b) => b.score - a.score || b.verified_pages - a.verified_pages)
    setRankings(enriched)
    setLastUpdated(new Date())
    setLoading(false)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-serif text-lg text-white">Leaderboard</h3>
          {lastUpdated && (
            <p className="text-xs text-text-muted">Updated {lastUpdated.toLocaleTimeString()} · refreshes every 2 min</p>
          )}
        </div>
        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          className="bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2 text-sm text-gray-300"
        >
          <option value="all">All books</option>
          {books.map(b => <option key={b.id} value={b.id}>Week {b.week_number}: {b.title}</option>)}
        </select>
      </div>

      {loading ? <SkeletonCard /> : rankings.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-text-muted text-sm">
            No progress yet. Readers show up after they save a page count.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rankings.map((r, i) => (
            <Card key={r.id} className="!p-4">
              <div className="flex gap-3">
                <p className="text-amber-400 font-bold text-lg w-7 shrink-0 pt-0.5">{i + 1}</p>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={r.users?.avatar_url} handle={r.users?.biblical_handle} size="sm" />
                    <p className="text-amber-400 font-medium truncate">@{r.users?.biblical_handle}</p>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{r.users?.display_name || '—'}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <p className="text-text-muted text-xs">Pages</p>
                      <p className="text-white font-medium">{r.verified_pages}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs">Time</p>
                      <p className="text-gray-300">{formatReadingTime(r.total_time_seconds || 0)}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs">Score</p>
                      <p className="text-amber-400 font-medium">{r.score}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs">Checks</p>
                      <p className="text-gray-300">{r.comprehensionPct}%</p>
                    </div>
                  </div>
                  <p className="text-text-muted text-xs mt-3">
                    Last active: {r.last_read_at ? new Date(r.last_read_at).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
