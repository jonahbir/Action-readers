export default function Avatar({ src, handle, size = 'md', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' }
  const initial = handle?.[0]?.toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={handle ? `@${handle}` : 'User'}
        className={`${sizes[size]} rounded-full object-cover border-2 border-amber-500/20 ${className}`}
      />
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center font-semibold text-amber-400 ${className}`}>
      {initial}
    </div>
  )
}
