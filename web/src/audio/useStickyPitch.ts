import { useEffect, useRef, useState } from 'react'
import { frequencyToSargam, type FrequencyResult } from '../music'

// Bridges brief clarity dips in the pitch detector so notes don't flicker
// off-screen mid-sustain. The last in-range result stays put for up to `holdMs`
// after the last detection; out-of-range results clear the latch immediately
// (no stale "Ni" hanging around when the user has moved outside the Sa window).
export function useStickyPitch(
  frequency: number | null,
  saMidi: number | null,
  holdMs: number = 300,
): FrequencyResult {
  const [result, setResult] = useState<FrequencyResult>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (saMidi == null) return
    const current = frequencyToSargam(frequency, saMidi)

    if (current?.kind === 'in_range') {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        setResult(null)
        timerRef.current = null
      }, holdMs)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(current)
    } else if (current?.kind === 'out_of_range') {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setResult(current)
    }
    // null frequency: let the running timer decide when to clear
  }, [frequency, saMidi, holdMs])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  return result
}
