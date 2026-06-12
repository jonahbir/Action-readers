import { useState, useRef, useCallback, useEffect } from 'react'

/** Session reading timer — counts from mount, pauses when tab is hidden. */
export function useReading() {
  const [displayMs, setDisplayMs] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const startedAt = useRef(performance.now())
  const pausedAccum = useRef(0)
  const pauseStarted = useRef(null)
  const flushedMs = useRef(0)
  const isPausedRef = useRef(false)
  const rafRef = useRef(null)

  const getElapsedMs = useCallback(() => {
    return Math.max(0, performance.now() - startedAt.current - pausedAccum.current)
  }, [])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    const tick = () => {
      if (!isPausedRef.current) {
        setDisplayMs(getElapsedMs())
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [getElapsedMs])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (!pauseStarted.current) pauseStarted.current = performance.now()
        isPausedRef.current = true
        setIsPaused(true)
      } else {
        if (pauseStarted.current) {
          pausedAccum.current += performance.now() - pauseStarted.current
          pauseStarted.current = null
        }
        isPausedRef.current = false
        setIsPaused(false)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const getElapsedSeconds = useCallback(() => {
    return Math.floor(getElapsedMs() / 1000)
  }, [getElapsedMs])

  /** Seconds accumulated since the last flush — does not reset the live display. */
  const consumeTime = useCallback(() => {
    const totalMs = getElapsedMs()
    const deltaMs = Math.max(0, totalMs - flushedMs.current)
    flushedMs.current = totalMs
    return Math.floor(deltaMs / 1000)
  }, [getElapsedMs])

  return { displayMs, isPaused, getElapsedSeconds, consumeTime }
}
