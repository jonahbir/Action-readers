import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

export default function AdminAnnouncements() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState({ title: '', body: '', pinned: false })
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('announcements')
      .select('*, users(biblical_handle, avatar_url, display_name)')
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
  }

  const handlePost = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    let image_url = null
    if (imageFile) {
      const path = `${Date.now()}_${imageFile.name}`
      await supabase.storage.from('announcement-images').upload(path, imageFile)
      const { data } = supabase.storage.from('announcement-images').getPublicUrl(path)
      image_url = data.publicUrl
    }
    await supabase.from('announcements').insert({
      title: form.title,
      body: form.body,
      pinned: form.pinned,
      image_url,
      created_by: profile.id,
    })
    setForm({ title: '', body: '', pinned: false })
    setImageFile(null)
    setSaving(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-serif text-lg text-white mb-4">Compose Announcement</h3>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title" className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2.5 text-white" />
          <textarea value={form.body} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Body" rows={4} className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-2.5 text-white resize-none" />
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm text-gray-400" />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm(f => ({ ...f, pinned: e.target.checked }))} />
            Pin to top
          </label>
          <Button loading={saving} onClick={handlePost}>Post Announcement</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {announcements.map(ann => (
          <Card key={ann.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <Avatar src={ann.users?.avatar_url} handle={ann.users?.biblical_handle} />
                <div>
                  <p className="text-amber-400 text-sm">@{ann.users?.biblical_handle} <span className="text-gray-600">({ann.users?.display_name})</span></p>
                  <h4 className="font-serif text-white">{ann.title}{ann.pinned && <span className="ml-2 text-xs text-amber-500 font-normal">(Pinned)</span>}</h4>
                  <p className="text-sm text-gray-300 mt-1">{ann.body}</p>
                  <p className="text-xs text-gray-600 mt-2">{new Date(ann.created_at).toLocaleString()}</p>
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDelete(ann.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
