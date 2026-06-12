const variants = {
  primary: 'bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold',
  secondary: 'bg-surface-overlay hover:bg-border-subtle text-gray-100 border border-border-subtle',
  ghost: 'hover:bg-surface-overlay text-gray-300',
  danger: 'bg-red-600/80 hover:bg-red-600 text-white',
  outline: 'border border-amber-500/50 text-amber-400 hover:bg-amber-500/10',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
}

export default function Button({
  children, variant = 'primary', size = 'md', className = '',
  disabled, loading, ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
