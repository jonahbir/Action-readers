import { useState, useRef, useCallback, useEffect } from 'react'

/** Passive reading timer — tracks time on the current page without blocking navigation. */
export function useReading(book, currentPage) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)
  const idleRef = useRef(null)
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    setTimeElapsed(0)
  }, [currentPage])

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now()
    if (isPaused) setIsPaused(false)
    clearTimeout(idleRef.current)
    idleRef.current = setTimeout(() => setIsPaused(true), 120000)
  }, [isPaused])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setIsPaused(true)
      else resetIdleTimer()
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
    if (isPaused || !book) {
      clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [isPaused, book, currentPage])

  const consumeTime = useCallback(() => {
    const spent = timeElapsed
    setTimeElapsed(0)
    return spent
  }, [timeElapsed])

  return { timeElapsed, isPaused, consumeTime }
}
