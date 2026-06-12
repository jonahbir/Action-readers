import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PLAYFUL_MESSAGES } from '../lib/constants'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import StarRating from '../components/ui/StarRating'
import ReviewCard from '../components/reviews/ReviewCard'
import SkeletonCard from '../components/ui/SkeletonCard'

export default function Reviews() {
  const { profile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('liked')
  const [bookFilter, setBookFilter] = useState('all')
  const [showWrite, setShowWrite] = useState(false)
  const [form, setForm] = useState({ book_id: '', rating: 0, content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    supabase.from('books').select('id, title').order('week_number', { ascending: false }).then(({ data }) => setBooks(data || []))
    loadReviews()
  }, [sort, bookFilter])

  async function loadReviews() {
    setLoading(true)
    let query = supabase
      .from('reviews')
      .select('*, users(biblical_handle, avatar_url), books(title)')
      .eq('status', 'approved')

    if (bookFilter !== 'all') query = query.eq('book_id', bookFilter)

    const { data: revs } = await query

    const withLikes = await Promise.all((revs || []).map(async (r) => {
      const [{ count }, { data: myLike }] = await Promise.all([
        supabase.from('review_likes').select('*', { count: 'exact', head: true }).eq('review_id', r.id),
        supabase.from('review_likes').select('id').eq('review_id', r.id).eq('user_id', profile.id).maybeSingle(),
      ])
      return { ...r, like_count: count || 0, user_liked: !!myLike }
    }))

    if (sort === 'liked') withLikes.sort((a, b) => b.like_count - a.like_count)
    else withLikes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    setReviews(withLikes)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.book_id || !form.rating || !form.content.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      user_id: profile.id,
      book_id: form.book_id,
      rating: form.rating,
      content: form.content.trim(),
      status: 'pending',
    })
    setSubmitting(false)
    if (!error) {
      setSubmitted(true)
      setForm({ book_id: '', rating: 0, content: '' })
      setTimeout(() => { setShowWrite(false); setSubmitted(false) }, 2000)
    }
  }

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-amber-400">Reviews</h1>
          <p className="text-text-muted text-sm mt-1">What the team thought about the books</p>
        </div>
        <Button onClick={() => setShowWrite(true)}>Write a Review</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          className="bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2 text-sm text-gray-300"
        >
          <option value="all">All Books</option>
          {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        {['liked', 'recent'].map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`text-sm px-4 py-2 rounded-xl transition-colors ${
              sort === s ? 'bg-amber-500/15 text-amber-400' : 'bg-surface-overlay text-gray-400 hover:text-gray-200'
            }`}
          >
            {s === 'liked' ? 'Most Liked' : 'Most Recent'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-text-muted py-16">No reviews yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(r => <ReviewCard key={r.id} review={r} onUpdate={loadReviews} />)}
        </div>
      )}

      <Modal open={showWrite} onClose={() => setShowWrite(false)} title="Write a Review" size="md">
        {submitted ? (
          <p className="text-center text-amber-400 py-8">{PLAYFUL_MESSAGES.reviewSubmitted}</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Book</label>
              <select
                value={form.book_id}
                onChange={(e) => setForm(f => ({ ...f, book_id: e.target.value }))}
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-3 text-white"
              >
                <option value="">Select a book</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Rating</label>
              <StarRating rating={form.rating} onChange={(r) => setForm(f => ({ ...f, rating: r }))} />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Your thoughts</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                rows={4}
                placeholder="What did you think?"
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-3 text-white resize-none"
              />
            </div>
            <Button className="w-full" loading={submitting} onClick={handleSubmit}
              disabled={!form.book_id || !form.rating || !form.content.trim()}>
              Submit review
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
