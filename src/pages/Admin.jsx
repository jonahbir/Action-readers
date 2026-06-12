import { useState } from 'react'
import AdminSidebar from '../components/layout/AdminSidebar'
import AdminBooks from '../components/admin/AdminBooks'
import AdminAnnouncements from '../components/admin/AdminAnnouncements'
import AdminLeaderboard from '../components/admin/AdminLeaderboard'
import AdminUsers from '../components/admin/AdminUsers'
import AdminReviews from '../components/admin/AdminReviews'

export default function Admin() {
  const [tab, setTab] = useState('books')

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
      <h1 className="font-serif text-3xl text-amber-400 mb-8">Admin</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <AdminSidebar activeTab={tab} onTabChange={setTab} />
        <div className="flex-1 min-w-0">
          <Panel />
        </div>
      </div>
    </div>
  )
}
