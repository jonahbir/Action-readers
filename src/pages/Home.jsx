import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PLAYFUL_MESSAGES } from '../lib/constants'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import ProgressBar from '../components/ui/ProgressBar'
import SkeletonCard from '../components/ui/SkeletonCard'
import ReviewCard from '../components/reviews/ReviewCard'

export default function Home() {
  const { profile } = useAuth()
  const [activeBook, setActiveBook] = useState(null)
  const [pastBooks, setPastBooks] = useState([])
  const [progress, setProgress] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [reviews, setReviews] = useState([])
  const [readingNow, setReadingNow] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewSort, setReviewSort] = useState('liked')

  useEffect(() => {
    loadData()

    const annChannel = supabase
      .channel('announcements-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => loadAnnouncements())
      .subscribe()

    return () => { supabase.removeChannel(annChannel) }
  }, [])

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*, users(biblical_handle, avatar_url)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
  }

  async function loadData() {
    const [{ data: active }, { data: past }] = await Promise.all([
      supabase.from('books').select('*').eq('is_active', true).maybeSingle(),
      supabase.from('books').select('*').eq('is_active', false).order('week_number', { ascending: false }),
    ])
    setActiveBook(active)
    setPastBooks(past || [])

    if (active && profile) {
      const { data: prog } = await supabase
        .from('user_book_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('book_id', active.id)
        .maybeSingle()
      setProgress(prog)

      const today = new Date().toISOString().split('T')[0]
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('user_id, users(biblical_handle, avatar_url)')
        .eq('book_id', active.id)
        .gte('created_at', `${today}T00:00:00`)
      const unique = [...new Map((sessions || []).map(s => [s.user_id, s.users])).values()]
      setReadingNow(unique.filter(Boolean))
    }

    await loadAnnouncements()
    await loadReviews()
    setLoading(false)
  }

  async function loadReviews() {
    const { data: revs } = await supabase
      .from('reviews')
      .select('*, users(biblical_handle, avatar_url), books(title)')
      .eq('status', 'approved')

    if (!revs) return

    const withLikes = await Promise.all(revs.map(async (r) => {
      const [{ count }, { data: myLike }] = await Promise.all([
        supabase.from('review_likes').select('*', { count: 'exact', head: true }).eq('review_id', r.id),
        profile ? supabase.from('review_likes').select('id').eq('review_id', r.id).eq('user_id', profile.id).maybeSingle() : { data: null },
      ])
      return { ...r, like_count: count || 0, user_liked: !!myLike }
    }))

    if (reviewSort === 'liked') withLikes.sort((a, b) => b.like_count - a.like_count)
    else withLikes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    setReviews(withLikes.slice(0, 6))
  }

  useEffect(() => { if (!loading) loadReviews() }, [reviewSort])

  const verifiedPages = progress?.verified_pages || 0
  const hasStarted = verifiedPages > 0

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 py-8">
      <p className="text-text-muted text-sm mb-6">
        {PLAYFUL_MESSAGES.welcomeBack(profile?.biblical_handle || 'friend')}
      </p>

      {/* Book of the Week */}
      {loading ? <SkeletonCard className="mb-8" /> : activeBook && (
        <Card className="mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
            {activeBook.cover_url && (
              <img src={activeBook.cover_url} alt="" className="w-40 h-56 object-cover rounded-xl shrink-0 shadow-lg" />
            )}
            <div className="flex-1">
              <p className="text-xs text-amber-500 uppercase tracking-wider mb-1">Book of the Week</p>
              <h2 className="font-serif text-3xl text-white mb-1">{activeBook.title}</h2>
              <p className="text-amber-400/80 mb-4">by {activeBook.author}</p>
              {activeBook.verse_of_week && (
                <p className="text-sm text-amber-500/60 italic mb-4 font-serif">{activeBook.verse_of_week}</p>
              )}
              <ProgressBar
                value={verifiedPages}
                max={activeBook.total_pages}
                label="Your verified progress"
                className="mb-4"
              />
              {readingNow.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {readingNow.slice(0, 5).map((u, i) => (
                      <Avatar key={i} src={u.avatar_url} handle={u.biblical_handle} size="sm" className="border-2 border-surface-raised" />
                    ))}
                  </div>
                  <span className="text-xs text-text-muted">{readingNow.length} reading today</span>
                </div>
              )}
              <Link to={`/read/${activeBook.id}`}>
                <Button>{hasStarted ? 'Continue Reading' : 'Start Reading'}</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Past Books */}
      {pastBooks.length > 0 && (
        <section className="mb-10">
          <h3 className="font-serif text-lg text-amber-400 mb-4">Past Books</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {pastBooks.map(book => (
              <Card key={book.id} className="w-44 shrink-0 text-center">
                {book.cover_url && <img src={book.cover_url} alt="" className="w-24 h-32 object-cover rounded-lg mx-auto mb-3" />}
                <p className="font-serif text-sm text-white truncate">{book.title}</p>
                <p className="text-xs text-text-muted mb-3">No points · read for joy</p>
                <Link to={`/read/${book.id}`}>
                  <Button size="sm" variant="secondary" className="w-full">Read Again</Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Announcements */}
      <section className="mb-10">
        <h3 className="font-serif text-lg text-amber-400 mb-4">Announcements</h3>
        {loading ? <SkeletonCard /> : announcements.length === 0 ? (
          <p className="text-text-muted text-sm">No announcements yet.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map(ann => (
              <Card key={ann.id}>
                <div className="flex items-start gap-3">
                  <Avatar src={ann.users?.avatar_url} handle={ann.users?.biblical_handle || 'admin'} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400 text-sm">@{ann.users?.biblical_handle || 'steward'}</span>
                      {ann.pinned && <span className="text-xs text-amber-500">📌 Pinned</span>}
                      <span className="text-xs text-gray-600 ml-auto">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-serif text-white mb-2">{ann.title}</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{ann.body}</p>
                    {ann.image_url && <img src={ann.image_url} alt="" className="mt-3 rounded-xl max-h-48 object-cover" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Community Reviews */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-amber-400">Community Reviews</h3>
          <div className="flex gap-2">
            {['liked', 'recent'].map(s => (
              <button
                key={s}
                onClick={() => setReviewSort(s)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  reviewSort === s ? 'bg-amber-500/15 text-amber-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {s === 'liked' ? 'Most Liked' : 'Most Recent'}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map(r => <ReviewCard key={r.id} review={r} onUpdate={loadReviews} />)}
          </div>
        )}
        <div className="text-center mt-6">
          <Link to="/reviews"><Button variant="outline">See All Reviews</Button></Link>
        </div>
      </section>
    </div>
  )
}
