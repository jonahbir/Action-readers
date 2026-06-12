import { Download, Info } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { OFFLINE_READING_NOTICE } from '../../lib/constants'

export default function DownloadBookModal({ open, book, onClose, onConfirm, downloading }) {
  return (
    <Modal open={open} onClose={onClose} title="Download book" size="md">
      <div className="flex gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-5">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-sm text-gray-300 leading-relaxed">{OFFLINE_READING_NOTICE}</p>
      </div>
      {book && (
        <p className="text-sm text-text-muted mb-6">
          Downloading <span className="text-white font-medium">{book.title}</span> by {book.author}.
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        <Button loading={downloading} onClick={onConfirm} className="flex-1">
          <span className="flex items-center justify-center gap-2">
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Download anyway
          </span>
        </Button>
      </div>
    </Modal>
  )
}
