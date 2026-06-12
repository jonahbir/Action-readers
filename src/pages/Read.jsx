import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import { ArrowLeft, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { supabase } from '../lib/supabase'
import { resolvePdfUrl } from '../lib/pdfUrl'
import { downloadBookPdf } from '../lib/downloadBook'
import { addReadingTime, logReadingSession, saveBookProgress } from '../lib/progress'
import { formatLiveTime } from '../lib/timeFormat'
import { useAuth } from '../hooks/useAuth'
import { useReading } from '../hooks/useReading'
import { PLAYFUL_MESSAGES } from '../lib/constants'
import Button from '../components/ui/Button'
import BookDetailModal from '../components/books/BookDetailModal'
import DownloadBookModal from '../components/books/DownloadBookModal'
import ComprehensionModal from '../components/reading/ComprehensionModal'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const fn = () => setMobile(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [breakpoint])
  return mobile
}

export default function Read() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [book, setBook] = useState(null)
  const [pdfSrc, setPdfSrc] = useState(null)
  const [pdfError, setPdfError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [loading, setLoading] = useState(true)
  const [numPages, setNumPages] = useState(null)
  const [compQuestion, setCompQuestion] = useState(null)
  const [showComp, setShowComp] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const askedPages = useRef(new Set())
  const prevPageRef = useRef(null)
  const consumeTimeRef = useRef(() => 0)
  const flushTimeRef = useRef(async () => {})

  const { displayMs, isPaused, getElapsedSeconds, consumeTime } = useReading()

  const flushTime = useCallback(async (pageNum, seconds, alsoSyncPage) => {
    if (!user || !book || !pageNum) return
    if (seconds >= 1) {
      await addReadingTime(user.id, book.id, seconds, pageNum)
    }
    if (alsoSyncPage) {
      await saveBookProgress({ userId: user.id, bookId: book.id, verifiedPages: alsoSyncPage })
    }
    if (seconds >= 1) {
      await logReadingSession({
        userId: user.id,
        bookId: book.id,
        pageNumber: pageNum,
        timeSpentSeconds: seconds,
      })
    }
  }, [user, book])

  useEffect(() => {
    consumeTimeRef.current = consumeTime
    flushTimeRef.current = flushTime
  }, [consumeTime, flushTime])

  const goToPage = useCallback((page) => {
    const total = numPages || book?.total_pages || 1
    const next = Math.min(Math.max(1, page), total)
    setCurrentPage(next)
    setPageInput(String(next))
  }, [numPages, book])

  useEffect(() => {
    if (prevPageRef.current !== null && prevPageRef.current !== currentPage) {
      const spent = consumeTimeRef.current()
      flushTimeRef.current(prevPageRef.current, spent, currentPage)
    }
    prevPageRef.current = currentPage

    const questions = book?.comprehension_questions || []
    const q = questions.find(item => item.page === currentPage)
    if (q && !askedPages.current.has(currentPage)) {
      askedPages.current.add(currentPage)
      setCompQuestion(q)
      setShowComp(true)
    }
  }, [currentPage, book])

  useEffect(() => {
    if (!user || !book) return
    const interval = setInterval(() => {
      const spent = consumeTimeRef.current()
      if (spent >= 15) {
        flushTimeRef.current(currentPage, spent)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [user, book, currentPage])

  useEffect(() => {
    return () => {
      if (prevPageRef.current !== null && user && book) {
        const spent = consumeTimeRef.current()
        if (spent >= 1) {
          flushTimeRef.current(prevPageRef.current, spent)
        }
      }
    }
  }, [user, book])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('books').select('*').eq('id', bookId).single()
      if (!data) { navigate('/home'); return }
      setBook(data)

      try {
        const url = await resolvePdfUrl(data)
        setPdfSrc(url)
        setPdfError(null)
      } catch (err) {
        setPdfError(err.message || 'Could not load PDF')
      }

      const { data: prog } = await supabase
        .from('user_book_progress')
        .select('verified_pages')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle()

      const startPage = Math.min(Math.max((prog?.verified_pages || 0), 1), data.total_pages)
      setCurrentPage(startPage)
      setPageInput(String(startPage))
      prevPageRef.current = startPage
      setLoading(false)
    }
    load()
  }, [bookId, user, navigate])

  const handlePageInputGo = () => {
    const n = parseInt(pageInput, 10)
    if (!Number.isNaN(n)) goToPage(n)
  }

  const handleDownload = () => setShowDownload(true)

  const confirmDownload = async () => {
    setDownloading(true)
    try {
      await downloadBookPdf(book)
      setShowDownload(false)
    } catch (e) {
      alert(e.message)
    }
    setDownloading(false)
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
        <p className="text-amber-400 animate-pulse font-serif">Loading book...</p>
      </div>
    )
  }

  const totalPages = numPages || book.total_pages
  const liveMs = Math.floor(displayMs % 1000)

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border-subtle px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to="/home" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="font-serif text-lg text-white truncate hover:text-amber-400 transition-colors text-left block max-w-full"
            >
              {book.title}
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="ghost" onClick={handleDownload} title="Download PDF">
              <Download className="w-4 h-4" />
            </Button>
            <p className="text-amber-400 text-sm font-medium">
              {currentPage} / {totalPages}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {pdfSrc && !pdfError && (
          <Document
            file={pdfSrc}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={null}
            className="flex flex-1 min-h-0 w-full"
          >
            <div className="flex-1 overflow-y-auto p-4 bg-surface-overlay/30">
              <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
                <Page
                  pageNumber={currentPage}
                  width={Math.min(isMobile ? window.innerWidth - 32 : window.innerWidth - 64, 800)}
                  renderTextLayer
                  renderAnnotationLayer
                  loading={<div className="p-20 text-center text-gray-500 animate-pulse">Loading page...</div>}
                />
              </div>
            </div>
          </Document>
        )}

        {pdfError && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-red-400 font-medium mb-2">Could not load PDF</p>
              <p className="text-gray-500 text-sm max-w-md">
                {pdfError.includes('CORS') || !book.pdf_storage_path
                  ? 'Ask an admin to upload the PDF.'
                  : pdfError}
              </p>
            </div>
          </div>
        )}

        {!pdfSrc && !pdfError && (
          <div className="flex-1 flex items-center justify-center text-gray-500 animate-pulse">Preparing document...</div>
        )}
      </div>

      <footer className="sticky bottom-0 bg-surface/95 backdrop-blur border-t border-border-subtle px-4 py-3 shrink-0">
        <div className="max-w-5xl mx-auto space-y-2">
          <p className="text-center font-mono text-sm text-amber-400 tabular-nums">
            {isPaused ? PLAYFUL_MESSAGES.idlePause : formatLiveTime(getElapsedSeconds(), liveMs)}
            {!isPaused && <span className="text-text-muted text-xs ml-2">(reading)</span>}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePageInputGo()}
                  className="w-16 bg-surface-overlay border border-border-subtle rounded-lg px-2 py-1.5 text-white text-center text-sm"
                />
                <span className="text-sm text-gray-500">/ {totalPages}</span>
                <Button size="sm" variant="ghost" onClick={handlePageInputGo}>Go</Button>
              </div>
              <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(Number(e.target.value))}
              className="w-full sm:w-48 accent-amber-500"
            />
          </div>
        </div>
      </footer>

      <ComprehensionModal open={showComp} question={compQuestion} onAnswer={handleCompAnswer} onClose={() => { setShowComp(false); setCompQuestion(null) }} />
      <BookDetailModal book={book} open={showDetails} onClose={() => setShowDetails(false)} canDownload onDownload={() => { setShowDetails(false); handleDownload() }} />
      <DownloadBookModal open={showDownload} book={book} onClose={() => setShowDownload(false)} onConfirm={confirmDownload} downloading={downloading} />
    </div>
  )
}
