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

      {loading ? <SkeletonCard /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-text-muted border-b border-border-subtle">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Handle</th>
                <th className="pb-3 pr-4">Real name</th>
                <th className="pb-3 pr-4">Pages</th>
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3 pr-4">Score</th>
                <th className="pb-3 pr-4">Checks</th>
                <th className="pb-3">Last active</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={r.id} className="border-b border-border-subtle/50">
                  <td className="py-3 pr-4 text-amber-400 font-bold">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={r.users?.avatar_url} handle={r.users?.biblical_handle} size="sm" />
                      <span className="text-amber-400">@{r.users?.biblical_handle}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{r.users?.display_name || '—'}</td>
                  <td className="py-3 pr-4">{r.verified_pages}</td>
                  <td className="py-3 pr-4 text-gray-400">{formatReadingTime(r.total_time_seconds || 0)}</td>
                  <td className="py-3 pr-4 text-amber-400 font-medium">{r.score}</td>
                  <td className="py-3 pr-4">{r.comprehensionPct}%</td>
                  <td className="py-3 text-gray-500 text-xs">
                    {r.last_read_at ? new Date(r.last_read_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted">
                    No progress yet. Readers show up after they save a page count.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
