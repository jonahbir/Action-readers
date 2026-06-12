import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useReading } from '../hooks/useReading'
import { PLAYFUL_MESSAGES } from '../lib/constants'
import Button from '../components/ui/Button'
import ComprehensionModal from '../components/reading/ComprehensionModal'
import MilestoneToast from '../components/reading/MilestoneToast'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function Read() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [book, setBook] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [numPages, setNumPages] = useState(null)
  const [compQuestion, setCompQuestion] = useState(null)
  const [showComp, setShowComp] = useState(false)
  const [milestone, setMilestone] = useState('')
  const [showMilestone, setShowMilestone] = useState(false)
  const [isActiveBook, setIsActiveBook] = useState(true)
  const pageContainerRef = useRef(null)
  const shownMilestones = useRef(new Set())

  const onPageComplete = useCallback(async (pageNum, timeSpent) => {
    const newVerified = pageNum
    const { data: existing } = await supabase
      .from('user_book_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle()

    const verifiedPages = Math.max(existing?.verified_pages || 0, newVerified)
    const totalTime = (existing?.total_time_seconds || 0) + timeSpent

    await supabase.from('user_book_progress').upsert({
      user_id: user.id,
      book_id: bookId,
      verified_pages: verifiedPages,
      total_time_seconds: totalTime,
      last_read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,book_id' })

    const today = new Date().toISOString().split('T')[0]
    const { data: plan } = await supabase.from('reading_plans').select('plan_data').eq('user_id', user.id).maybeSingle()
    const planData = { ...(plan?.plan_data || {}) }
    planData[today] = (planData[today] || 0) + 1
    await supabase.from('reading_plans').upsert({
      user_id: user.id,
      plan_data: planData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (book && isActiveBook) {
      const pct = (verifiedPages / book.total_pages) * 100
      const milestones = { 25: PLAYFUL_MESSAGES.milestone25, 50: PLAYFUL_MESSAGES.milestone50, 75: PLAYFUL_MESSAGES.milestone75, 100: PLAYFUL_MESSAGES.milestone100 }
      for (const [threshold, msg] of Object.entries(milestones)) {
        if (pct >= Number(threshold) && !shownMilestones.current.has(threshold)) {
          shownMilestones.current.add(threshold)
          setMilestone(msg)
          setShowMilestone(true)
          setTimeout(() => setShowMilestone(false), 4000)
          break
        }
      }
    }

    const questions = book?.comprehension_questions || []
    const q = questions.find(q => q.page === pageNum)
    if (q) {
      setCompQuestion(q)
      setShowComp(true)
    }
  }, [user, bookId, book, isActiveBook])

  const {
    scrolledToBottom, setScrolledToBottom,
    timeElapsed, minTimeRequired, isPaused, canProceed, completePage,
  } = useReading(book, currentPage, onPageComplete)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('books').select('*').eq('id', bookId).single()
      if (!data) { navigate('/home'); return }
      setBook(data)
      setIsActiveBook(data.is_active)
      setNumPages(data.total_pages)

      const { data: prog } = await supabase
        .from('user_book_progress')
        .select('verified_pages')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle()

      const startPage = Math.min((prog?.verified_pages || 0) + 1, data.total_pages)
      setCurrentPage(startPage || 1)
      setLoading(false)
    }
    load()
  }, [bookId, user, navigate])

  const handleScroll = () => {
    const el = pageContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setScrolledToBottom(atBottom)
  }

  const handleNext = async () => {
    await completePage()
    if (currentPage < (numPages || book?.total_pages)) {
      setCurrentPage(p => p + 1)
      pageContainerRef.current?.scrollTo(0, 0)
    }
  }

  const handleCompAnswer = async (isCorrect) => {
    if (!compQuestion) return
    await supabase.from('comprehension_checks').insert({
      user_id: user.id,
      book_id: bookId,
      page_number: compQuestion.page,
      question_id: compQuestion.id || `q_${compQuestion.page}`,
      is_correct: isCorrect,
    })
    setShowComp(false)
    setCompQuestion(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-amber-400 animate-pulse font-serif">Turning to your page...</p>
      </div>
    )
  }

  const totalPages = numPages || book.total_pages
  const timeRemaining = Math.max(0, minTimeRequired - timeElapsed)

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <MilestoneToast message={milestone} show={showMilestone} />

      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border-subtle px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/home" className="text-sm text-gray-500 hover:text-gray-300">← Home</Link>
            <h1 className="font-serif text-lg text-white truncate">{book.title}</h1>
          </div>
          <div className="text-right">
            <p className="text-amber-400 text-sm font-medium">Page {currentPage} of {totalPages}</p>
            {!isActiveBook && <p className="text-xs text-gray-500">Past book · no points</p>}
          </div>
        </div>
      </header>

      <div
        ref={pageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
          {book.pdf_url && (
            <Document
              file={book.pdf_url}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              loading={<div className="p-20 text-center text-gray-500">Loading pages...</div>}
              error={<div className="p-20 text-center text-red-500">Could not load PDF. Ask a steward to check the file.</div>}
            >
              <Page
                pageNumber={currentPage}
                width={Math.min(window.innerWidth - 48, 700)}
                renderTextLayer
                renderAnnotationLayer
              />
            </Document>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 bg-surface/95 backdrop-blur border-t border-border-subtle px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {isPaused && (
            <p className="text-center text-amber-500/80 text-sm mb-2">{PLAYFUL_MESSAGES.idlePause}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-text-muted text-center sm:text-left">
              {!scrolledToBottom && <span className="text-amber-500">Scroll to the bottom · </span>}
              {timeRemaining > 0 && <span>{timeRemaining}s remaining · </span>}
              <span>{timeElapsed}s read</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => { setCurrentPage(p => p - 1); pageContainerRef.current?.scrollTo(0, 0) }}
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed || currentPage >= totalPages}
              >
                {currentPage >= totalPages ? 'Finished!' : 'Next Page'}
              </Button>
            </div>
          </div>
        </div>
      </footer>

      <ComprehensionModal
        open={showComp}
        question={compQuestion}
        onAnswer={handleCompAnswer}
        onClose={() => setShowComp(false)}
      />
    </div>
  )
}
