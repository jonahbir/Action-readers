import { useState } from 'react'
import AdminSidebar from '../components/layout/AdminSidebar'
import AdminBooks from '../components/admin/AdminBooks'
import AdminAnnouncements from '../components/admin/AdminAnnouncements'
import AdminLeaderboard from '../components/admin/AdminLeaderboard'
import AdminUsers from '../components/admin/AdminUsers'
import AdminReviews from '../components/admin/AdminReviews'
import { useAdminCounts } from '../hooks/useAdminCounts'

export default function Admin() {
  const [tab, setTab] = useState('books')
  const { counts, total, refresh } = useAdminCounts()

  const panels = {
    books: AdminBooks,
    announcements: AdminAnnouncements,
    leaderboard: AdminLeaderboard,
    users: AdminUsers,
    reviews: AdminReviews,
  }

  const Panel = panels[tab]

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="font-serif text-3xl text-amber-400">Admin</h1>
        {total > 0 && (
          <span className="text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full">
            {total} item{total === 1 ? '' : 's'} need your attention
          </span>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <AdminSidebar activeTab={tab} onTabChange={setTab} counts={counts} total={total} />
        <div className="flex-1 min-w-0">
          <Panel key={tab} onAdminAction={refresh} />
        </div>
      </div>
    </div>
  )
}
