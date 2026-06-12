import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../ui/Button'

const emptyQuestion = {
  page: '',
  question: '',
  type: 'multiple',
  options: ['', '', ''],
  correct: 0,
}

export default function ComprehensionQuestionEditor({ questions, onChange }) {
  const [draft, setDraft] = useState(null)

  const startAdd = () => setDraft({ ...emptyQuestion, id: `q_${Date.now()}` })

  const saveDraft = () => {
    if (!draft?.page || !draft.question?.trim()) return
    const page = Number(draft.page)
    if (Number.isNaN(page) || page < 1) return

    let options = draft.type === 'yesno' ? ['Yes', 'No'] : draft.options.filter(o => o.trim())
    if (draft.type === 'multiple' && options.length < 2) {
      alert('Add at least 2 choices.')
      return
    }

    const item = {
      id: draft.id || `q_${Date.now()}`,
      page,
      question: draft.question.trim(),
      type: draft.type,
      options,
      correct: Number(draft.correct) || 0,
    }

    const existing = questions.filter(q => q.id !== item.id && q.page !== item.page)
    onChange([...existing, item].sort((a, b) => a.page - b.page))
    setDraft(null)
  }

  const remove = (id) => onChange(questions.filter(q => q.id !== id))

  const edit = (q) => setDraft({
    ...q,
    type: q.type || (q.options?.length === 2 && q.options[0] === 'Yes' ? 'yesno' : 'multiple'),
    options: q.options?.length ? [...q.options] : ['', '', ''],
  })

  return (
    <div className="sm:col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">Comprehension questions</label>
        <Button type="button" size="sm" variant="secondary" onClick={startAdd}>
          <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add question</span>
        </Button>
      </div>

      {questions.length > 0 && (
        <ul className="space-y-2">
          {questions.map(q => (
            <li key={q.id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-surface-overlay border border-border-subtle text-sm">
              <div>
                <p className="text-amber-400/80 text-xs mb-1">Page {q.page}</p>
                <p className="text-gray-200">{q.question}</p>
                <p className="text-gray-500 text-xs mt-1">Answer: {q.options?.[q.correct]}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button type="button" size="sm" variant="ghost" onClick={() => edit(q)}>Edit</Button>
                <button type="button" onClick={() => remove(q.id)} className="p-1.5 text-gray-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-surface-overlay space-y-3">
          <p className="text-sm text-amber-400 font-medium">{draft.id && questions.some(q => q.id === draft.id) ? 'Edit question' : 'New question'}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Page number</label>
              <input
                type="number"
                min={1}
                value={draft.page}
                onChange={(e) => setDraft(d => ({ ...d, page: e.target.value }))}
                className="w-full mt-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Question type</label>
              <select
                value={draft.type}
                onChange={(e) => {
                  const type = e.target.value
                  setDraft(d => ({
                    ...d,
                    type,
                    options: type === 'yesno' ? ['Yes', 'No'] : (d.options.length >= 2 ? d.options : ['', '', '']),
                    correct: 0,
                  }))
                }}
                className="w-full mt-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="multiple">Multiple choice</option>
                <option value="yesno">Yes / No</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Question</label>
            <textarea
              value={draft.question}
              onChange={(e) => setDraft(d => ({ ...d, question: e.target.value }))}
              rows={2}
              className="w-full mt-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
          </div>
          {draft.type === 'multiple' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Choices (pick the correct one)</label>
              {draft.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={Number(draft.correct) === i}
                    onChange={() => setDraft(d => ({ ...d, correct: i }))}
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const options = [...draft.options]
                      options[i] = e.target.value
                      setDraft(d => ({ ...d, options }))
                    }}
                    placeholder={`Choice ${i + 1}`}
                    className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-white text-sm"
                  />
                  {draft.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, options: d.options.filter((_, j) => j !== i) }))}
                      className="text-gray-500 hover:text-red-400 text-xs"
                    >Remove</button>
                  )}
                </div>
              ))}
              {draft.options.length < 5 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(d => ({ ...d, options: [...d.options, ''] }))}>
                  Add choice
                </Button>
              )}
            </div>
          )}
          {draft.type === 'yesno' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="radio" checked={Number(draft.correct) === 0} onChange={() => setDraft(d => ({ ...d, correct: 0 }))} />
                Yes is correct
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="radio" checked={Number(draft.correct) === 1} onChange={() => setDraft(d => ({ ...d, correct: 1 }))} />
                No is correct
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={saveDraft}>Save question</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
