export default function StarRating({ rating, onChange, size = 'md', readonly = false }) {
  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' }
  return (
    <div className={`flex gap-1 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${star <= rating ? 'text-amber-400' : 'text-gray-600'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
