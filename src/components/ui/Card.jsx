export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-raised border border-border-subtle rounded-2xl p-5 ${hover ? 'hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
