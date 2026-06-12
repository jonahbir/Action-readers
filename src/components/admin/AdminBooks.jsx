import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const emptyBook = {
  title: '', author: '', description: '', why_this_book: '', verse_of_week: '',
  total_pages: '', week_number: '', is_active: false, comprehension_questions: '[]',
}

export default function AdminBooks() {
  const [books, setBooks] = useState([])
  const [form, setForm] = useState(emptyBook)
  const [editing, setEditing] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [questionsJson, setQuestionsJson] = useState('[]')
  const [editingQuestions, setEditingQuestions] = useState(null)

  useEffect(() => { loadBooks() }, [])

  async function loadBooks() {
    const { data } = await supabase.from('books').select('*').order('week_number', { ascending: false })
    setBooks(data || [])
  }

  const uploadFile = async (bucket, file) => {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return bucket === 'book-pdfs'
      ? (await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365)).data.signedUrl
      : data.publicUrl
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let cover_url = editing?.cover_url || null
      let pdf_url = editing?.pdf_url || null

      if (coverFile) cover_url = await uploadFile('book-covers', coverFile)
      if (pdfFile) pdf_url = await uploadFile('book-pdfs', pdfFile)

      if (!pdf_url && !editing) { alert('PDF is required'); setSaving(false); return }

      const payload = {
        title: form.title,
        author: form.author,
        description: form.description,
        why_this_book: form.why_this_book,
        verse_of_week: form.verse_of_week,
        total_pages: Number(form.total_pages),
        week_number: Number(form.week_number),
        is_active: form.is_active,
        cover_url,
        pdf_url,
        comprehension_questions: JSON.parse(questionsJson || '[]'),
      }

      if (form.is_active) {
        await supabase.from('books').update({ is_active: false }).neq('id', editing?.id || '00000000-0000-0000-0000-000000000000')
      }

      if (editing) {
        await supabase.from('books').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('books').insert(payload)
      }

      setForm(emptyBook)
      setEditing(null)
      setCoverFile(null)
      setPdfFile(null)
      setQuestionsJson('[]')
      loadBooks()
    } catch (e) {
      alert(e.message)
    }
    setSaving(false)
  }

  const startEdit = (book) => {
    setEditing(book)
    setForm({
      title: book.title, author: book.author, description: book.description || '',
      why_this_book: book.why_this_book || '', verse_of_week: book.verse_of_week || '',
      total_pages: book.total_pages, week_number: book.week_number, is_active: book.is_active,
    })
    setQuestionsJson(JSON.stringify(book.comprehension_questions || [], null, 2))
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return
    await supabase.from('books').delete().eq('id', id)
    loadBooks()
  }

  const saveQuestions = async () => {
    try {
      const parsed = JSON.parse(questionsJson)
      await supabase.from('books').update({ comprehension_questions: parsed }).eq('id', editingQuestions)
      setEditingQuestions(null)
      loadBooks()
    } catch {
      alert('Invalid JSON')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-serif text-lg text-white mb-4">{editing ? 'Edit Book' : 'Upload New Book'}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {['title', 'author', 'description', 'why_this_book', 'verse_of_week'].map(field => (
            <div key={field} className={field.includes('description') || field.includes('why') ? 'sm:col-span-2' : ''}>
              <label className="text-xs text-gray-400 capitalize">{field.replace(/_/g, ' ')}</label>
              {field.includes('description') || field.includes('why') ? (
                <textarea
                  value={form[field]}
                  onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                  rows={2}
                  className="w-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-white text-sm resize-none"
                />
              ) : (
                <input
                  value={form[field]}
                  onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-white text-sm"
                />
              )}
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400">Total Pages</label>
            <input type="number" value={form.total_pages} onChange={(e) => setForm(f => ({ ...f, total_pages: e.target.value }))}
              className="w-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Week Number</label>
            <input type="number" value={form.week_number} onChange={(e) => setForm(f => ({ ...f, week_number: e.target.value }))}
              className="w-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])}
              className="w-full mt-1 text-sm text-gray-400" />
          </div>
          <div>
            <label className="text-xs text-gray-400">PDF File</label>
            <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])}
              className="w-full mt-1 text-sm text-gray-400" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            <label htmlFor="active" className="text-sm text-gray-300">Set as active book of the week</label>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-400">Comprehension Questions (JSON)</label>
            <textarea
              value={questionsJson}
              onChange={(e) => setQuestionsJson(e.target.value)}
              rows={4}
              placeholder='[{"page": 10, "id": "q1", "question": "...", "options": ["a","b","c"], "correct": 0}]'
              className="w-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-white text-sm font-mono resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Upload'} Book</Button>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm(emptyBook) }}>Cancel</Button>}
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="font-serif text-lg text-white">All Books</h3>
        {books.map(book => (
          <Card key={book.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
            {book.cover_url && <img src={book.cover_url} alt="" className="w-12 h-16 object-cover rounded" />}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-serif text-white">{book.title}</p>
                {book.is_active && <Badge color="amber">Active</Badge>}
                <Badge color="gray">Week {book.week_number}</Badge>
              </div>
              <p className="text-sm text-text-muted">{book.author} · {book.total_pages} pages</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => startEdit(book)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(book.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
