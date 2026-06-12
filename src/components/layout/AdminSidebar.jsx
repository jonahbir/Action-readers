const tabs = [
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'reviews', label: 'Reviews', icon: '✍️' },
]

export default function AdminSidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-3 space-y-1">
        <p className="text-xs text-text-muted uppercase tracking-wider px-3 py-2">Stewardship</p>
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              activeTab === id
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-surface-overlay'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </aside>
  )
}
