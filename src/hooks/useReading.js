import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { estimateMinReadTime, estimateWordsPerPage } from '../lib/scoring'

export function useReading(book, currentPage, onPageComplete) {
  const { user } = useAuth()
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [minTimeRequired, setMinTimeRequired] = useState(30)
  const timerRef = useRef(null)
  const idleRef = useRef(null)
  const tabSwitchCount = useRef(0)
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    if (!book) return
    const wordsPerPage = estimateWordsPerPage(book.total_pages)
    setMinTimeRequired(estimateMinReadTime(wordsPerPage))
    setTimeElapsed(0)
    setScrolledToBottom(false)
  }, [book, currentPage])

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now()
    if (isPaused) setIsPaused(false)
    clearTimeout(idleRef.current)
    idleRef.current = setTimeout(() => setIsPaused(true), 60000)
  }, [isPaused])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1
        if (tabSwitchCount.current > 3) setIsPaused(true)
      } else {
        resetIdleTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('keydown', resetIdleTimer)
    window.addEventListener('scroll', resetIdleTimer)
    resetIdleTimer()
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('keydown', resetIdleTimer)
      window.removeEventListener('scroll', resetIdleTimer)
      clearTimeout(idleRef.current)
    }
  }, [resetIdleTimer])

  useEffect(() => {
    if (isPaused) {
      clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [isPaused, currentPage])

  const canProceed = scrolledToBottom && timeElapsed >= minTimeRequired

  const completePage = async () => {
    if (!user || !book || !canProceed) return
    const { error } = await supabase.from('reading_sessions').insert({
      user_id: user.id,
      book_id: book.id,
      page_number: currentPage,
      time_spent_seconds: timeElapsed,
      scroll_completed: true,
    })
    if (!error) onPageComplete?.(currentPage, timeElapsed)
    setScrolledToBottom(false)
    setTimeElapsed(0)
    tabSwitchCount.current = 0
  }

  return {
    scrolledToBottom,
    setScrolledToBottom,
    timeElapsed,
    minTimeRequired,
    isPaused,
    canProceed,
    completePage,
  }
}
