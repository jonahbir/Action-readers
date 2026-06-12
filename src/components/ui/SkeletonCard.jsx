export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-surface-raised border border-border-subtle rounded-2xl p-5 animate-pulse ${className}`}>
      <div className="flex gap-4">
        <div className="w-16 h-20 bg-surface-overlay rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-surface-overlay rounded w-3/4" />
          <div className="h-3 bg-surface-overlay rounded w-1/2" />
          <div className="h-3 bg-surface-overlay rounded w-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonLine({ width = 'w-full', className = '' }) {
  return <div className={`h-3 bg-surface-overlay rounded animate-pulse ${width} ${className}`} />
}
