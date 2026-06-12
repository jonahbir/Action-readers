export default function ProgressBar({ value, max, label, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm text-text-muted mb-1.5">
          <span>{label}</span>
          <span>{value} / {max} pages ({pct}%)</span>
        </div>
      )}
      <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
