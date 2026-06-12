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

  return (
    <div>
      <h3 className="font-serif text-lg text-white mb-4">Team members</h3>
      {loading ? <p className="text-text-muted">Loading...</p> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted border-b border-border-subtle">
                <th className="pb-3 pr-4">Member</th>
                <th className="pb-3 pr-4">Real Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border-subtle/50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.avatar_url} handle={u.biblical_handle} size="sm" />
                      <span className="text-amber-400">@{u.biblical_handle}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{u.display_name}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                  <td className="py-3 pr-4"><Badge color={roleColor[u.role]}>{u.role}</Badge></td>
                  <td className="py-3 pr-4 text-gray-500">{new Date(u.joined_at).toLocaleDateString()}</td>
                  <td className="py-3">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
