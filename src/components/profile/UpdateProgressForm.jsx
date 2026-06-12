import { useEffect, useState } from 'react'
import { BookMarked } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { OFFLINE_READING_NOTICE } from '../../lib/constants'
import Card from '../ui/Card'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'

export default function UpdateProgressForm({ userId, onUpdated }) {
  const [books, setBooks] = useState([])
  const [bookId, setBookId] = useState('')
  const [page, setPage] = useState('')
  const [currentProgress, setCurrentProgress] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('books').select('id, title, author, total_pages, is_active').order('week_number', { ascending: false })
      .then(({ data }) => setBooks(data || []))
  }, [])

  useEffect(() => {
    if (!bookId || !userId) {
      setCurrentProgress(null)
      return
    }
    supabase
      .from('user_book_progress')
      .select('verified_pages, total_time_seconds')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle()
      .then(({ data }) => {
        setCurrentProgress(data)
        setPage(data?.verified_pages ? String(data.verified_pages) : '')
      })
  }, [bookId, userId])

  const selectedBook = books.find(b => b.id === bookId)

  const handleSave = async () => {
    if (!bookId || !selectedBook) return
    const pageNum = parseInt(page, 10)
    if (Number.isNaN(pageNum) || pageNum < 0) return
    const verified = Math.min(pageNum, selectedBook.total_pages)
    setSaving(true)
    await supabase.from('user_book_progress').upsert({
      user_id: userId,
      book_id: bookId,
      verified_pages: verified,
      total_time_seconds: currentProgress?.total_time_seconds || 0,
      last_read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,book_id' })
    setSaving(false)
    setSaved(true)
    onUpdated?.()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card className="mb-8 border-amber-500/20">
      <div className="flex items-center gap-2 mb-2">
        <BookMarked className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
        <h3 className="font-serif text-lg text-white">Update your progress</h3>
      </div>
      <p className="text-xs text-text-muted mb-4 leading-relaxed">{OFFLINE_READING_NOTICE}</p>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-300 block mb-1">Book</label>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2.5 text-white text-sm"
          >
            <option value="">Select a book</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>
                {b.title}{b.is_active ? ' (this week)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedBook && (
          <>
            <div>
              <label className="text-sm text-gray-300 block mb-1">
                What page are you on? (max {selectedBook.total_pages})
              </label>
              <input
                type="number"
                min={0}
                max={selectedBook.total_pages}
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2.5 text-white"
              />
            </div>
            <ProgressBar
              value={parseInt(page, 10) || currentProgress?.verified_pages || 0}
              max={selectedBook.total_pages}
              label="Progress after save"
            />
          </>
        )}

        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!bookId || page === ''}
          className="w-full sm:w-auto"
        >
          {saved ? 'Progress saved' : 'Save progress'}
        </Button>
      </div>
    </Card>
  )
}
