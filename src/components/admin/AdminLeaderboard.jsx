import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { comprehensionAccuracy } from '../../lib/scoring'
import Card from '../ui/Card'
import Avatar from '../ui/Avatar'
import SkeletonCard from '../ui/SkeletonCard'

export default function AdminLeaderboard() {
  const [rankings, setRankings] = useState([])
  const [books, setBooks] = useState([])
  const [bookFilter, setBookFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('books').select('id, title, week_number').order('week_number', { ascending: false })
      .then(({ data }) => setBooks(data || []))
    loadRankings()

    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_book_progress' }, () => loadRankings())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookFilter])

  async function loadRankings() {
    setLoading(true)
    let query = supabase
      .from('user_book_progress')
      .select('*, users(biblical_handle, avatar_url, display_name, is_banned), books(title, week_number, is_active)')
      .order('score', { ascending: false })

    if (bookFilter !== 'all') query = query.eq('book_id', bookFilter)

    const { data: progress } = await query

    const enriched = await Promise.all((progress || [])
      .filter(p => !p.users?.is_banned)
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

    enriched.sort((a, b) => b.score - a.score)
    setRankings(enriched)
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-white">Faithful Readers</h3>
        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          className="bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2 text-sm text-gray-300"
        >
          <option value="all">All Time</option>
          {books.map(b => <option key={b.id} value={b.id}>Week {b.week_number}: {b.title}</option>)}
        </select>
      </div>

      {loading ? <SkeletonCard /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-border-subtle">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Reader</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Real Name</th>
                <th className="pb-3 pr-4">Pages</th>
                <th className="pb-3 pr-4">Score</th>
                <th className="pb-3 pr-4">Comprehension</th>
                <th className="pb-3">Last Active</th>
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
                  <td className="py-3 pr-4 text-gray-500 hidden lg:table-cell">{r.users?.display_name}</td>
                  <td className="py-3 pr-4">{r.verified_pages}</td>
                  <td className="py-3 pr-4 text-amber-400">{r.score}</td>
                  <td className="py-3 pr-4">{r.comprehensionPct}%</td>
                  <td className="py-3 text-gray-500">{r.last_read_at ? new Date(r.last_read_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-text-muted">No reading data yet</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
