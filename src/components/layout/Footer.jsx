import { FELLOWSHIP_NAME } from '../../lib/constants'

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-20 py-10">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="font-serif text-amber-400/80 text-lg mb-2">{FELLOWSHIP_NAME}</p>
        <p className="text-text-muted text-sm">Read together. Grow together. Walk in faith.</p>
        <p className="text-text-muted text-xs mt-4">There&apos;s always a seat at the table for you. 🕯️</p>
      </div>
    </footer>
  )
}
