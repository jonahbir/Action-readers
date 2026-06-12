import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { saveBookProgress } from '../lib/progress'
import { useAuth } from './useAuth'

export function useProgress(bookId) {
  const { user } = useAuth()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    if (!user || !bookId) return
    const { data } = await supabase
      .from('user_book_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle()
    setProgress(data)
    setLoading(false)
  }, [user, bookId])

  useEffect(() => { fetchProgress() }, [fetchProgress])

  const updateProgress = async (updates) => {
    if (!user || !bookId) return { error: new Error('Not signed in') }
    const { data, error } = await saveBookProgress({
      userId: user.id,
      bookId,
      verifiedPages: updates.verified_pages,
      addTimeSeconds: updates.total_time_seconds,
    })
    if (!error && data) setProgress(data)
    return { data, error }
  }

  return { progress, loading, updateProgress, refetch: fetchProgress }
}

export function useAllProgress() {
  const { user } = useAuth()
  const [progressList, setProgressList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_book_progress')
      .select('*, books(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setProgressList(data || [])
        setLoading(false)
      })
  }, [user])

  return { progressList, loading }
}
