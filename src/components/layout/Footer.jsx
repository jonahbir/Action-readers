import { Flame } from 'lucide-react'
import { FELLOWSHIP_NAME, TAGLINE } from '../../lib/constants'

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-20 py-10">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="font-serif text-amber-400/80 text-lg mb-2">{FELLOWSHIP_NAME}</p>
        <p className="text-text-muted text-sm">{TAGLINE}</p>
        <p className="text-text-muted text-xs mt-4 flex items-center justify-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500/50" strokeWidth={1.5} />
          There&apos;s always a seat at the table for you.
        </p>
      </div>
    </footer>
  )
}
