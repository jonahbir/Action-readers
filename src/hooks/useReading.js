import { useState, useRef, useCallback, useEffect } from 'react'

/** Live reading timer with millisecond display; pauses when tab is hidden. */
export function useReading(book, currentPage) {
  const [displayMs, setDisplayMs] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const startedAt = useRef(null)
  const pausedAccum = useRef(0)
  const pauseStarted = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    startedAt.current = performance.now()
    pausedAccum.current = 0
    pauseStarted.current = null
    setDisplayMs(0)
    setIsPaused(false)
  }, [currentPage])

  const tick = useCallback(() => {
    if (!startedAt.current || isPaused) return
    const elapsed = performance.now() - startedAt.current - pausedAccum.current
    setDisplayMs(Math.max(0, elapsed))
    rafRef.current = requestAnimationFrame(tick)
  }, [isPaused])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [tick])

  useEffect(() => {
    const onHide = () => {
      if (!document.hidden) return
      if (!pauseStarted.current) pauseStarted.current = performance.now()
      setIsPaused(true)
    }
    const onShow = () => {
      if (pauseStarted.current) {
        pausedAccum.current += performance.now() - pauseStarted.current
        pauseStarted.current = null
      }
      setIsPaused(false)
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onHide()
      else onShow()
    })
    return () => document.removeEventListener('visibilitychange', () => {})
  }, [])

  /** Whole seconds elapsed on this page (for DB). */
  const getElapsedSeconds = useCallback(() => {
    return Math.floor(displayMs / 1000)
  }, [displayMs])

  const consumeTime = useCallback(() => {
    const seconds = getElapsedSeconds()
    startedAt.current = performance.now()
    pausedAccum.current = 0
    setDisplayMs(0)
    return seconds
  }, [getElapsedSeconds])

  return { displayMs, isPaused, getElapsedSeconds, consumeTime }
}
