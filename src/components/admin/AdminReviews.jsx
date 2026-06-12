import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import StarRating from '../ui/StarRating'
import Badge from '../ui/Badge'

export default function AdminReviews({ onAdminAction }) {
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('reviews').select('*, users(biblical_handle, avatar_url, display_name), books(title)').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, users(biblical_handle, avatar_url, display_name), books(title)').eq('status', 'approved').order('created_at', { ascending: false }).limit(20),
    ])
    setPending(p || [])
    setApproved(a || [])
  }

  const updateStatus = async (id, status) => {
    await supabase.from('reviews').update({ status }).eq('id', id)
    await load()
    onAdminAction?.()
  }

  const ReviewRow = ({ review, actions }) => (
    <Card className="mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <Avatar src={review.users?.avatar_url} handle={review.users?.biblical_handle} />
          <div>
            <p className="text-amber-400 text-sm">@{review.users?.biblical_handle} <span className="text-gray-600">({review.users?.display_name})</span></p>
            <p className="text-xs text-text-muted">{review.books?.title}</p>
            <StarRating rating={review.rating} readonly size="sm" />
            <p className="text-sm text-gray-300 mt-2 font-serif">{review.content}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">{actions}</div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-serif text-lg text-white">Pending Reviews</h3>
          {pending.length > 0 && <Badge color="amber">{pending.length}</Badge>}
        </div>
        {pending.length === 0 ? (
          <p className="text-text-muted text-sm">No pending reviews — all clear!</p>
        ) : pending.map(r => (
          <ReviewRow key={r.id} review={r} actions={
            <>
              <Button size="sm" onClick={() => updateStatus(r.id, 'approved')}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => updateStatus(r.id, 'removed')}>Remove</Button>
            </>
          } />
        ))}
      </section>

      <section>
        <h3 className="font-serif text-lg text-white mb-4">Approved Reviews</h3>
        {approved.map(r => (
          <ReviewRow key={r.id} review={r} actions={
            <Button size="sm" variant="danger" onClick={() => updateStatus(r.id, 'removed')}>Remove</Button>
          } />
        ))}
      </section>
    </div>
  )
}
