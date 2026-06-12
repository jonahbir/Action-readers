import { BookOpen } from 'lucide-react'

export default function Logo({ className = 'w-7 h-7 text-amber-400', strokeWidth = 1.5 }) {
  return <BookOpen className={className} strokeWidth={strokeWidth} aria-hidden />
}
