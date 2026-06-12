import { BookOpen, Megaphone, Trophy, Users, PenLine } from 'lucide-react'

const tabs = [
  { id: 'books', label: 'Books', Icon: BookOpen },
  { id: 'announcements', label: 'Announcements', Icon: Megaphone },
  { id: 'leaderboard', label: 'Leaderboard', Icon: Trophy },
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'reviews', label: 'Reviews', Icon: PenLine },
]

export default function AdminSidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-3 space-y-1">
        <p className="text-xs text-text-muted uppercase tracking-wider px-3 py-2">Admin</p>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              activeTab === id
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-surface-overlay'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  )
}
