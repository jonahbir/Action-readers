import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { BIBLICAL_HANDLE_SUGGESTIONS, PLAYFUL_MESSAGES, FELLOWSHIP_NAME } from '../../lib/constants'
import Button from '../ui/Button'
import Card from '../ui/Card'

export default function Onboarding() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showJoke, setShowJoke] = useState(false)

  const checkHandle = async (h) => {
    const clean = h.trim().replace(/^@/, '')
    if (!clean || clean.length < 2) return 'Handle must be at least 2 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) return 'Only letters, numbers, and underscores'
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('biblical_handle', clean)
      .neq('id', profile.id)
      .maybeSingle()
    if (data) return 'This handle is already taken — try another name from the Word!'
    return null
  }

  const handleConfirmClick = async () => {
    const err = await checkHandle(handle)
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  const handleYesClick = () => {
    setShowJoke(true)
    setTimeout(() => setStep(3), 2500)
  }

  const handleComplete = async () => {
    setLoading(true)
    const cleanHandle = handle.trim().replace(/^@/, '')
    const err = await checkHandle(cleanHandle)
    if (err) { setError(err); setLoading(false); return }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        biblical_handle: cleanHandle,
        bio: bio.trim() || null,
        onboarding_complete: true,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    await refreshProfile()
    navigate('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <Card className="max-w-lg w-full page-enter">
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🙌</div>
              <h1 className="font-serif text-2xl text-amber-400 mb-2">Welcome to {FELLOWSHIP_NAME}</h1>
              <p className="text-text-muted">
                There&apos;s a seat at the table with your name on it. Well — your <em>biblical</em> name.
              </p>
            </div>
            <label className="block text-sm text-gray-300 mb-2">Choose your biblical handle</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
                placeholder="Ruth"
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {BIBLICAL_HANDLE_SUGGESTIONS.slice(0, 8).map((s) => (
                <button
                  key={s}
                  onClick={() => setHandle(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface-overlay text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  @{s}
                </button>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <Button className="w-full" onClick={handleConfirmClick} disabled={!handle.trim()}>
              Continue
            </Button>
          </>
        )}

        {step === 2 && !showJoke && (
          <div className="text-center">
            <div className="text-4xl mb-4">🤔</div>
            <h2 className="font-serif text-xl mb-6">{PLAYFUL_MESSAGES.handleConfirm}</h2>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setStep(1)}>Wait, let me change it</Button>
              <Button onClick={handleYesClick}>Yes, absolutely! 😇</Button>
            </div>
          </div>
        )}

        {step === 2 && showJoke && (
          <div className="text-center page-enter">
            <div className="text-4xl mb-4">😄</div>
            <p className="text-lg text-amber-300 leading-relaxed">{PLAYFUL_MESSAGES.handleJoke}</p>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✨</div>
              <h2 className="font-serif text-xl text-amber-400">Almost there, @{handle.trim()}</h2>
              <p className="text-text-muted text-sm mt-2">Tell the family a little about yourself (optional)</p>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Why did you join the reading challenge?"
              rows={3}
              className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 mb-4 resize-none"
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <Button className="w-full" loading={loading} onClick={handleComplete}>
              Enter the Fellowship 🕯️
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
