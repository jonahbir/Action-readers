import { useEffect, useRef } from 'react'
import { Page } from 'react-pdf'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function PdfPageSidebar({
  numPages,
  currentPage,
  onSelectPage,
  open,
  onToggle,
  isMobile,
}) {
  const listRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentPage, open])

  const thumbnails = (
    <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          ref={pageNum === currentPage ? activeRef : null}
          type="button"
          onClick={() => {
            onSelectPage(pageNum)
            if (isMobile) onToggle(false)
          }}
          className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
            pageNum === currentPage
              ? 'border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]'
              : 'border-transparent hover:border-amber-500/40 opacity-80 hover:opacity-100'
          }`}
        >
          <Page
            pageNumber={pageNum}
            width={isMobile ? 100 : 120}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<div className="h-28 bg-gray-200 animate-pulse rounded" />}
          />
          <p className={`text-xs py-1 text-center ${pageNum === currentPage ? 'text-amber-400 font-medium' : 'text-gray-500'}`}>
            {pageNum}
          </p>
        </button>
      ))}
    </div>
  )

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => onToggle(!open)}
          className="fixed bottom-24 left-4 z-40 p-3 rounded-full bg-amber-500 text-gray-900 shadow-lg"
          aria-label={open ? 'Hide pages' : 'Show pages'}
        >
          {open ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => onToggle(false)} />
            <aside className="fixed left-0 top-0 bottom-0 z-50 w-36 bg-surface border-r border-border-subtle flex flex-col animate-slide-down">
              <div className="p-3 border-b border-border-subtle flex items-center justify-between">
                <span className="text-xs text-amber-400 font-medium">Pages</span>
                <button type="button" onClick={() => onToggle(false)} className="text-gray-400">
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
              {thumbnails}
            </aside>
          </>
        )}
      </>
    )
  }

  return (
    <aside
      className={`shrink-0 border-r border-border-subtle bg-surface-raised flex flex-col transition-all duration-300 ${
        open ? 'w-40 lg:w-44' : 'w-10'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(!open)}
        className="p-2 border-b border-border-subtle text-gray-400 hover:text-amber-400 flex justify-center"
        aria-label={open ? 'Collapse pages' : 'Expand pages'}
      >
        {open ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
      </button>
      {open && thumbnails}
    </aside>
  )
}
