import { BookOpen, Download, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function BookDetailModal({ book, open, onClose, onDownload, canDownload = false }) {
  if (!book) return null

  return (
    <Modal open={open} onClose={onClose} title={book.title} size="lg">
      <div className="flex flex-col sm:flex-row gap-6">
        {book.cover_url && (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-36 h-52 object-cover rounded-xl shrink-0 shadow-lg mx-auto sm:mx-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-amber-400/90 mb-1">by {book.author}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {book.is_active && <Badge color="amber">Active this week</Badge>}
            <Badge color="gray">Week {book.week_number}</Badge>
            <Badge color="gray">{book.total_pages} pages</Badge>
          </div>
          {book.verse_of_week && (
            <p className="text-sm text-amber-500/70 italic font-serif mb-4 flex gap-2">
              <Quote className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
              {book.verse_of_week}
            </p>
          )}
        </div>
      </div>

      {book.description && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-amber-400/80 mb-2">About this book</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{book.description}</p>
        </div>
      )}

      {book.why_this_book && (
        <div className="mt-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <h4 className="text-sm font-medium text-amber-400 mb-2">Why this book</h4>
          <p className="text-gray-300 text-sm leading-relaxed font-serif italic">&ldquo;{book.why_this_book}&rdquo;</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link to={`/read/${book.id}`} className="flex-1" onClick={onClose}>
          <Button className="w-full">
            <span className="flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" strokeWidth={1.5} />
              Read in browser
            </span>
          </Button>
        </Link>
        {canDownload && onDownload && (
          <Button variant="outline" className="flex-1" onClick={() => onDownload(book)}>
            <span className="flex items-center justify-center gap-2">
              <Download className="w-4 h-4" strokeWidth={1.5} />
              Download PDF
            </span>
          </Button>
        )}
      </div>
    </Modal>
  )
}
