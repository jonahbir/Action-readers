import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('joined_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const toggleBan = async (user) => {
    await supabase.from('users').update({ is_banned: !user.is_banned }).eq('id', user.id)
    loadUsers()
  }

  const setRole = async (userId, role) => {
    if (!isSuperAdmin) return
    await supabase.from('users').update({ role }).eq('id', userId)
    loadUsers()
  }

  const roleColor = { user: 'gray', admin: 'blue', super_admin: 'amber' }

  const UserActions = ({ user: u }) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant={u.is_banned ? 'outline' : 'danger'} onClick={() => toggleBan(u)}>
        {u.is_banned ? 'Unban' : 'Ban'}
      </Button>
      {isSuperAdmin && u.role === 'user' && (
        <Button size="sm" variant="secondary" onClick={() => setRole(u.id, 'admin')}>Make Admin</Button>
      )}
      {isSuperAdmin && u.role === 'admin' && (
        <Button size="sm" variant="secondary" onClick={() => setRole(u.id, 'user')}>Remove Admin</Button>
      )}
    </div>
  )

  return (
    <div>
      <h3 className="font-serif text-lg text-white mb-4">Team members</h3>
      {loading ? <p className="text-text-muted">Loading...</p> : (
        <>
          <div className="md:hidden space-y-3">
            {users.map(u => (
              <Card key={u.id} className="!p-4">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar src={u.avatar_url} handle={u.biblical_handle} size="sm" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-amber-400 font-medium truncate">@{u.biblical_handle}</p>
                    <p className="text-gray-300 text-sm">{u.display_name || '—'}</p>
                  </div>
                  <Badge color={roleColor[u.role]}>{u.role}</Badge>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm mb-4">
                  <dt className="text-text-muted">Phone</dt>
                  <dd className="text-gray-400">{u.phone || '—'}</dd>
                  <dt className="text-text-muted">Email</dt>
                  <dd className="text-gray-500 break-all">{u.email}</dd>
                  <dt className="text-text-muted">Joined</dt>
                  <dd className="text-gray-500">{new Date(u.joined_at).toLocaleDateString()}</dd>
                </dl>
                <UserActions user={u} />
              </Card>
            ))}
          </div>

          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-text-muted border-b border-border-subtle">
                  <th className="pb-3 pr-8 min-w-[10rem]">Member</th>
                  <th className="pb-3 pr-8 min-w-[8rem]">Real Name</th>
                  <th className="pb-3 pr-6">Phone</th>
                  <th className="pb-3 pr-6">Email</th>
                  <th className="pb-3 pr-6">Role</th>
                  <th className="pb-3 pr-6">Joined</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border-subtle/50">
                    <td className="py-3 pr-8 min-w-[10rem]">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={u.avatar_url} handle={u.biblical_handle} size="sm" />
                        <span className="text-amber-400 truncate">@{u.biblical_handle}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-8 min-w-[8rem] text-gray-300">{u.display_name || '—'}</td>
                    <td className="py-3 pr-6 text-gray-400">{u.phone || '—'}</td>
                    <td className="py-3 pr-6 text-gray-500">{u.email}</td>
                    <td className="py-3 pr-6"><Badge color={roleColor[u.role]}>{u.role}</Badge></td>
                    <td className="py-3 pr-6 text-gray-500">{new Date(u.joined_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <UserActions user={u} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}
