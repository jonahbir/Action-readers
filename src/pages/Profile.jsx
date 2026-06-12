import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { comprehensionAccuracy, formatReadingTime } from '../lib/scoring'
import { PLAYFUL_MESSAGES } from '../lib/constants'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import ProgressBar from '../components/ui/ProgressBar'
import ReviewCard from '../components/reviews/ReviewCard'
import SkeletonCard from '../components/ui/SkeletonCard'
import UpdateProgressForm from '../components/profile/UpdateProgressForm'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [activeBook, setActiveBook] = useState(null)
  const [weekProgress, setWeekProgress] = useState(null)
  const [plan, setPlan] = useState(null)
  const [dailyGoal, setDailyGoal] = useState(20)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ handle: '', bio: '', phone: '' })
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [profile])

  async function loadAll() {
    if (!profile) return

    const [{ data: allProgress }, { data: checks }, { data: myReviews }, { data: book }, { data: readingPlan }] = await Promise.all([
      supabase.from('user_book_progress').select('*, books(title, total_pages, is_active)').eq('user_id', profile.id),
      supabase.from('comprehension_checks').select('is_correct').eq('user_id', profile.id),
      supabase.from('reviews').select('*, users(biblical_handle, avatar_url), books(title)').eq('user_id', profile.id).neq('status', 'removed'),
      supabase.from('books').select('*').eq('is_active', true).maybeSingle(),
      supabase.from('reading_plans').select('*').eq('user_id', profile.id).maybeSingle(),
    ])

    const totalPages = (allProgress || []).reduce((s, p) => s + (p.verified_pages || 0), 0)
    const totalTime = (allProgress || []).reduce((s, p) => s + (p.total_time_seconds || 0), 0)
    const booksRead = (allProgress || []).filter(p => p.verified_pages >= (p.books?.total_pages || 999)).length
    const correct = (checks || []).filter(c => c.is_correct).length
    const total = (checks || []).length

    setStats({ totalPages, totalTime, booksRead, comprehensionPct: comprehensionAccuracy(correct, total) })
    setActiveBook(book)

    const weekProg = (allProgress || []).find(p => p.book_id === book?.id)
    setWeekProgress(weekProg)

    if (readingPlan) {
      setPlan(readingPlan)
      setDailyGoal(readingPlan.daily_page_goal)
    }

    const withLikes = await Promise.all((myReviews || []).map(async (r) => {
      const { count } = await supabase.from('review_likes').select('*', { count: 'exact', head: true }).eq('review_id', r.id)
      return { ...r, like_count: count || 0 }
    }))
    setReviews(withLikes)
    setLoading(false)
  }

  const getWeekCalendar = () => {
    const planData = plan?.plan_data || {}
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    return DAYS.map((day, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const key = d.toISOString().split('T')[0]
      const raw = planData[key]
      const pages = typeof raw === 'object' ? (raw.pages || 0) : (raw || 0)
      const seconds = typeof raw === 'object' ? (raw.seconds || 0) : 0
      const met = pages >= dailyGoal
      const isFuture = d > today
      return { day, key, pages, seconds, met, isFuture, isToday: key === today.toISOString().split('T')[0] }
    })
  }

  const savePlan = async () => {
    await supabase.from('reading_plans').upsert({
      user_id: profile.id,
      daily_page_goal: dailyGoal,
      plan_data: plan?.plan_data || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    loadAll()
  }

  const startEdit = () => {
    setEditForm({ handle: profile.biblical_handle, bio: profile.bio || '', phone: profile.phone || '' })
    setEditing(true)
    setEditError('')
  }

  const saveProfile = async () => {
    setSaving(true)
    const clean = editForm.handle.trim().replace(/^@/, '')
    if (clean.length < 2) { setEditError('Handle must be at least 2 characters'); setSaving(false); return }

    const { data: taken } = await supabase
      .from('users')
      .select('id')
      .eq('biblical_handle', clean)
      .neq('id', profile.id)
      .maybeSingle()

    if (taken) { setEditError('Handle already taken'); setSaving(false); return }

    const phone = editForm.phone.trim() || null
    const { error } = await supabase.from('users').update({
      biblical_handle: clean,
      bio: editForm.bio.trim() || null,
      phone,
    }).eq('id', profile.id)

    if (error) { setEditError(error.message); setSaving(false); return }
    await refreshProfile()
    setEditing(false)
    setSaving(false)
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><SkeletonCard /></div>

  const calendar = getWeekCalendar()

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-8">
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar src={profile.avatar_url} handle={profile.biblical_handle} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-serif text-2xl text-amber-400">@{profile.biblical_handle}</h1>
            {profile.bio && <p className="text-gray-400 text-sm mt-1">{profile.bio}</p>}
            {profile.phone && <p className="text-gray-500 text-sm mt-1">{profile.phone}</p>}
            <p className="text-text-muted text-sm mt-2">
              Joined {new Date(profile.joined_at).toLocaleDateString()} · {stats?.booksRead || 0} books completed
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={startEdit}>Edit Profile</Button>
          </div>
        </div>
      </Card>

      {editing && (
        <Card className="mb-6 border-amber-500/30">
          <h3 className="font-serif text-lg text-white mb-4">Edit Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300">Biblical handle</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400">@</span>
                <input
                  value={editForm.handle}
                  onChange={(e) => setEditForm(f => ({ ...f, handle: e.target.value.replace(/^@/, '') }))}
                  className="w-full bg-surface-overlay border border-border-subtle rounded-xl pl-8 pr-4 py-2.5 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-300">Phone (for weekly mobile card awards)</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+251 9xx xxx xxx"
                className="w-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                rows={2}
                className="w-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2.5 text-white resize-none"
              />
            </div>
            {editError && <p className="text-red-400 text-sm">{editError}</p>}
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={saveProfile}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Verified Pages', value: stats?.totalPages || 0 },
          { label: 'Reading Time', value: formatReadingTime(stats?.totalTime || 0) },
          { label: 'Comprehension', value: `${stats?.comprehensionPct || 0}%` },
          { label: 'Books Completed', value: stats?.booksRead || 0 },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center">
            <p className="text-2xl font-bold text-amber-400">{value}</p>
            <p className="text-xs text-text-muted mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {activeBook && (
        <Card className="mb-8">
          <h3 className="font-serif text-lg text-white mb-3">This Week&apos;s Progress</h3>
          <ProgressBar
            value={weekProgress?.verified_pages || 0}
            max={activeBook.total_pages}
          />
        </Card>
      )}

      <UpdateProgressForm userId={profile.id} onUpdated={loadAll} />

      <Card className="mb-8">
        <h3 className="font-serif text-lg text-white mb-4">Daily Reading Plan</h3>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-300">Daily page goal:</label>
          <input
            type="number"
            min={1}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-20 bg-surface-overlay border border-border-subtle rounded-lg px-3 py-1.5 text-white text-center"
          />
          <Button size="sm" onClick={savePlan}>Save Goal</Button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendar.map(({ day, met, isFuture, isToday, pages, seconds }) => (
            <div key={day} className="text-center">
              <p className="text-xs text-text-muted mb-1">{day}</p>
              <div className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium ${
                isFuture ? 'bg-surface-overlay text-gray-600' :
                met ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                pages > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                'bg-surface-overlay text-gray-600 border border-border-subtle'
              } ${isToday ? 'ring-2 ring-amber-500/50' : ''}`}>
                {isFuture ? '·' : met ? '✓' : pages > 0 ? pages : '—'}
              </div>
              {!isFuture && seconds > 0 && (
                <p className="text-[10px] text-gray-500 mt-1 tabular-nums">{formatReadingTime(seconds)}</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">{PLAYFUL_MESSAGES.graceDay}</p>
      </Card>

      <section>
        <h3 className="font-serif text-lg text-amber-400 mb-4">My Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-text-muted text-sm">You haven&apos;t written any reviews yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map(r => <ReviewCard key={r.id} review={r} onUpdate={loadAll} showBook />)}
          </div>
        )}
      </section>
    </div>
  )
}
