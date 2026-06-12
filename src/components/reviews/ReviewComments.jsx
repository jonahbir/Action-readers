import { useEffect, useState } from 'react'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

export default function ReviewComments({ reviewId, compact = false }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(!compact)

  const loadComments = async () => {
    const { data } = await supabase
      .from('review_comments')
      .select('*, users(biblical_handle, avatar_url)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadComments()
  }, [reviewId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || !user) return
    setSubmitting(true)
    const { error } = await supabase.from('review_comments').insert({
      review_id: reviewId,
      user_id: user.id,
      content: content.trim(),
    })
    if (!error) {
      setContent('')
      await loadComments()
      setExpanded(true)
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId) => {
    await supabase.from('review_comments').delete().eq('id', commentId)
    loadComments()
  }

  const count = comments.length

  return (
    <div className="mt-3 pt-3 border-t border-border-subtle">
      {compact && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          {count === 0 ? 'Comment' : `${count} comment${count === 1 ? '' : 's'}`}
        </button>
      )}

      {(!compact || expanded) && (
        <div className="space-y-3 mt-2 animate-fade-in">
          {loading ? (
            <p className="text-xs text-gray-500">Loading comments...</p>
          ) : comments.length > 0 ? (
            <ul className="space-y-2.5">
              {comments.map((c) => {
                const author = c.users
                const isOwn = user?.id === c.user_id
                return (
                  <li key={c.id} className="flex gap-2 group">
                    <Avatar src={author?.avatar_url} handle={author?.biblical_handle} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-400/90">
                          @{author?.biblical_handle || 'reader'}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        {isOwn && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-auto"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            !user && <p className="text-xs text-gray-500">No comments yet.</p>
          )}

          {user && profile && (
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-white resize-none focus:border-amber-500/50 focus:outline-none transition-colors"
              />
              <Button
                type="submit"
                size="sm"
                loading={submitting}
                disabled={!content.trim()}
                className="shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
