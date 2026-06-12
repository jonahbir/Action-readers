import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Library, BookOpen, Users, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { FELLOWSHIP_NAME, TAGLINE } from '../lib/constants'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Logo from '../components/ui/Logo'
import SkeletonCard from '../components/ui/SkeletonCard'
import ReviewCard from '../components/reviews/ReviewCard'
import Footer from '../components/layout/Footer'

const STEPS = [
  { Icon: Library, title: "Pick the Week's Book", desc: 'Each week brings a new read chosen for our fellowship journey.' },
  { Icon: BookOpen, title: 'Read & Reflect', desc: 'Turn pages at your pace, pause to reflect, and grow in understanding.' },
  { Icon: Users, title: 'Encourage One Another', desc: 'Share reviews, cheer each other on, and walk this path together.' },
]

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6 animate-fade-in">
            <Logo className="w-10 h-10 text-amber-400" strokeWidth={1.25} />
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in stagger-1">
            {FELLOWSHIP_NAME}
          </h1>
          <p className="text-xl text-amber-400/90 font-serif mb-3 animate-fade-in stagger-2">{TAGLINE}</p>
          <p className="text-text-muted max-w-lg mx-auto mb-10 leading-relaxed animate-fade-in stagger-3">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-4">
            <Button size="lg" onClick={signInWithGoogle}>Sign in with Google</Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('this-week')?.scrollIntoView({ behavior: 'smooth' })}>
              See This Week&apos;s Book
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl text-center text-amber-400 mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ Icon, title, desc }, i) => (
            <Card key={title} className={`text-center hover-lift animate-fade-in stagger-${i + 1}`}>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-white mb-2">{title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="this-week" className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl text-center text-amber-400 mb-8">This Week&apos;s Book</h2>
        {loading ? <SkeletonCard className="max-w-2xl mx-auto" /> : activeBook ? (
          <Card className="max-w-2xl mx-auto hover-lift">
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

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl text-center text-amber-400 mb-8">What the Family Is Saying</h2>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {reviews.map(r => (
              <div key={r.id} onClick={handleReviewClick} className="cursor-pointer">
                <ReviewCard review={r} showComments={false} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-text-muted">Be the first to share a review after reading!</p>
        )}
      </section>

      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="font-serif text-xl text-gray-300 mb-2 flex items-center justify-center gap-2">
          <Flame className="w-5 h-5 text-amber-500/70" strokeWidth={1.5} />
          There&apos;s a seat at the table for you.
        </p>
        <Button size="lg" onClick={signInWithGoogle} className="mt-4">Sign in with Google</Button>
      </section>

      <Footer />
    </div>
  )
}
