export default function MilestoneToast({ message, show }) {
  if (!show) return null
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 milestone-glow">
      <div className="bg-surface-raised border border-amber-500/40 rounded-2xl px-6 py-4 shadow-2xl page-enter">
        <p className="text-amber-300 font-serif text-center">{message}</p>
      </div>
    </div>
  )
}
