import { BookOpen, Megaphone, Trophy, Users, PenLine } from 'lucide-react'

const tabs = [
  { id: 'books', label: 'Books', Icon: BookOpen, countKey: 'books' },
  { id: 'announcements', label: 'Announcements', Icon: Megaphone },
  { id: 'leaderboard', label: 'Leaderboard', Icon: Trophy },
  { id: 'users', label: 'Users', Icon: Users, countKey: 'users' },
  { id: 'reviews', label: 'Reviews', Icon: PenLine, countKey: 'reviews' },
]

function CountBadge({ count }) {
  if (!count || count < 1) return null
  return (
    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-gray-900 text-xs font-bold flex items-center justify-center tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function AdminSidebar({ activeTab, onTabChange, counts = {}, total = 0 }) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-xs text-text-muted uppercase tracking-wider">Admin</p>
          {total > 0 && (
            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full tabular-nums">
              {total} new
            </span>
          )}
        </div>
        {tabs.map(({ id, label, Icon, countKey }) => (
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
            <span className="flex-1 text-left">{label}</span>
            {countKey && <CountBadge count={counts[countKey]} />}
          </button>
        ))}
      </div>
    </aside>
  )
}
