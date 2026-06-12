import { useState } from 'react'
import { BookOpenCheck } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { PLAYFUL_MESSAGES } from '../../lib/constants'

export default function ComprehensionModal({ open, question, onAnswer, onClose }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  if (!question) return null

  const correctAnswer = question.options?.[question.correct] ?? ''

  const handleSubmit = () => {
    if (selected === null) return
    const isCorrect = selected === question.correct
    setSubmitted(true)
    setTimeout(() => {
      onAnswer(isCorrect)
      setSelected(null)
      setSubmitted(false)
      onClose()
    }, 2200)
  }

  return (
    <Modal open={open} onClose={onClose} title="Quick question" size="md">
      <div className="flex items-center gap-2 text-amber-500/70 mb-4">
        <BookOpenCheck className="w-4 h-4" strokeWidth={1.5} />
        <span className="text-xs">Page {question.page}</span>
      </div>
      <p className="text-gray-300 mb-5 font-serif">{question.question}</p>
      <div className="space-y-2 mb-6">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !submitted && setSelected(i)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              selected === i
                ? submitted
                  ? i === question.correct
                    ? 'border-green-500 bg-green-500/10 text-green-300'
                    : 'border-red-500 bg-red-500/10 text-red-300'
                  : 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-border-subtle hover:border-amber-500/30 text-gray-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {submitted ? (
        <p className="text-center text-amber-400 text-sm leading-relaxed">
          {selected === question.correct
            ? 'Correct. Keep reading.'
            : PLAYFUL_MESSAGES.caughtNotFollowing(correctAnswer)}
        </p>
      ) : (
        <Button className="w-full" onClick={handleSubmit} disabled={selected === null}>
          Submit
        </Button>
      )}
    </Modal>
  )
}
