import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import Card from '../ui/Card'
import StarRating from '../ui/StarRating'

export default function ReviewCard({ review, onUpdate, showBook = true }) {
  const { user, isAdmin } = useAuth()
  const [likes, setLikes] = useState(review.like_count || 0)
  const [liked, setLiked] = useState(review.user_liked || false)
  const [liking, setLiking] = useState(false)

  const author = review.users || review.user
  const book = review.books || review.book
  const isOwn = user?.id === review.user_id

  const toggleLike = async () => {
    if (isOwn || liking) return
    setLiking(true)
    if (liked) {
      await supabase.from('review_likes').delete().eq('review_id', review.id).eq('user_id', user.id)
      setLikes(l => l - 1)
      setLiked(false)
    } else {
      await supabase.from('review_likes').insert({ review_id: review.id, user_id: user.id })
      setLikes(l => l + 1)
      setLiked(true)
    }
    setLiking(false)
    onUpdate?.()
  }

  const handleDelete = async () => {
    if (!confirm('Remove this review?')) return
    await supabase.from('reviews').delete().eq('id', review.id)
    onUpdate?.()
  }

  return (
    <Card hover className="flex flex-col h-full">
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={author?.avatar_url} handle={author?.biblical_handle} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-amber-400">@{author?.biblical_handle || 'fellowship-member'}</p>
          {showBook && book && (
            <p className="text-sm text-text-muted font-serif truncate">{book.title}</p>
          )}
        </div>
        {isAdmin && author?.display_name && (
          <span className="text-xs text-gray-600 hidden lg:block">{author.display_name}</span>
        )}
      </div>
      <StarRating rating={review.rating} readonly size="sm" />
      <p className="text-gray-300 text-sm mt-3 flex-1 leading-relaxed font-serif line-clamp-4">
        {review.content}
      </p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
        <button
          onClick={toggleLike}
          disabled={isOwn || liking}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isOwn ? 'text-gray-600 cursor-not-allowed' : liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          {liked ? '❤️' : '🤍'} {likes}
        </button>
        {isOwn && (
          <button onClick={handleDelete} className="text-xs text-gray-500 hover:text-red-400">
            Delete
          </button>
        )}
        {review.status === 'pending' && isOwn && (
          <span className="text-xs text-amber-500/70">Pending approval</span>
        )}
      </div>
    </Card>
  )
}
