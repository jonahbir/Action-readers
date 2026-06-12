import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { FELLOWSHIP_NAME, TAGLINE } from '../lib/constants'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import SkeletonCard from '../components/ui/SkeletonCard'
import ReviewCard from '../components/reviews/ReviewCard'
import Footer from '../components/layout/Footer'

export default function Landing() {
  const { session, signInWithGoogle, loading: authLoading, needsOnboarding, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const [activeBook, setActiveBook] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !session) return
    navigate(needsOnboarding ? '/onboarding' : '/home', { replace: true })
  }, [session, authLoading, needsOnboarding, navigate])

  useEffect(() => {
    async function load() {
      const [{ data: book }, { data: revs }] = await Promise.all([
        supabase.from('books').select('*').eq('is_active', true).maybeSingle(),
        supabase
          .from('reviews')
          .select('*, users(biblical_handle, avatar_url), books(title)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setActiveBook(book)

      if (revs?.length) {
        const withLikes = await Promise.all(revs.map(async (r) => {
          const { count } = await supabase
            .from('review_likes')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', r.id)
          return { ...r, like_count: count || 0 }
        }))
        withLikes.sort((a, b) => b.like_count - a.like_count)
        setReviews(withLikes.slice(0, 3))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleStartReading = () => {
    if (session) navigate(`/read/${activeBook?.id}`)
    else signInWithGoogle()
  }

  const handleReviewClick = () => {
    if (!session) signInWithGoogle()
    else navigate('/reviews')
  }

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="text-5xl mb-6">📖</div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4">
            {FELLOWSHIP_NAME}
          </h1>
          <p className="text-xl text-amber-400/90 font-serif mb-3">{TAGLINE}</p>
          <p className="text-text-muted max-w-lg mx-auto mb-10 leading-relaxed">
            A warm table, good books, and a family walking in faith together.
            There&apos;s a seat waiting for you.
          </p>
          {authError && (
            <div className="mb-6 mx-auto max-w-md rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <p className="font-medium">Sign-in didn&apos;t complete</p>
              <p className="mt-1 text-red-300/80">{authError}</p>
              <button type="button" onClick={clearAuthError} className="mt-2 text-xs underline text-red-400">Dismiss</button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={signInWithGoogle}>Sign in with Google</Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('this-week')?.scrollIntoView({ behavior: 'smooth' })}>
              See This Week&apos;s Book
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl text-center text-amber-400 mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '📚', title: 'Pick the Week\'s Book', desc: 'Each week brings a new read chosen for our fellowship journey.' },
            { icon: '📖', title: 'Read & Reflect', desc: 'Turn pages at your pace, pause to reflect, and grow in understanding.' },
            { icon: '🤝', title: 'Encourage One Another', desc: 'Share reviews, cheer each other on, and walk this path together.' },
          ].map(({ icon, title, desc }) => (
            <Card key={title} className="text-center">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-serif text-lg text-white mb-2">{title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* This Week's Book */}
      <section id="this-week" className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl text-center text-amber-400 mb-8">This Week&apos;s Book</h2>
        {loading ? <SkeletonCard className="max-w-2xl mx-auto" /> : activeBook ? (
          <Card className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-6">
              {activeBook.cover_url && (
                <img src={activeBook.cover_url} alt={activeBook.title} className="w-36 h-52 object-cover rounded-xl mx-auto sm:mx-0 shrink-0 shadow-lg" />
              )}
              <div className="flex-1">
                <h3 className="font-serif text-2xl text-white mb-1">{activeBook.title}</h3>
                <p className="text-amber-400/80 mb-3">by {activeBook.author}</p>
                <p className="text-text-muted text-sm mb-4 leading-relaxed">{activeBook.description}</p>
                {activeBook.why_this_book && (
                  <p className="text-sm text-gray-400 italic mb-3 font-serif">&ldquo;{activeBook.why_this_book}&rdquo;</p>
                )}
                {activeBook.verse_of_week && (
                  <p className="text-xs text-amber-500/70 mb-4">{activeBook.verse_of_week}</p>
                )}
                <p className="text-sm text-text-muted mb-4">{activeBook.total_pages} pages · Week {activeBook.week_number}</p>
                <Button onClick={handleStartReading}>Start Reading</Button>
              </div>
            </div>
          </Card>
        ) : (
          <p className="text-center text-text-muted">No active book this week yet — check back soon!</p>
        )}
      </section>

      {/* Community Reviews Preview */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl text-center text-amber-400 mb-8">What the Family Is Saying</h2>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {reviews.map(r => (
              <div key={r.id} onClick={handleReviewClick}>
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-text-muted">Be the first to share a review after reading!</p>
        )}
      </section>

      {/* Footer CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="font-serif text-xl text-gray-300 mb-6">
          There&apos;s a seat at the table for you. 🕯️
        </p>
        <Button size="lg" onClick={signInWithGoogle}>Sign in with Google</Button>
      </section>

      <Footer />
    </div>
  )
}
