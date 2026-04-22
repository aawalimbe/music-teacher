import { describe, expect, test } from 'vitest'
import { saMidiForMode } from '../sa'
import { hzToMidi } from '../tuning'

describe('saMidiForMode', () => {
  test('fixed mode returns the fixed MIDI directly', () => {
    expect(saMidiForMode('fixed', 60, null)).toBe(60)
    expect(saMidiForMode('fixed', 62, 440)).toBe(62) // movable Hz ignored in fixed mode
  })

  test('movable mode quantizes Hz to nearest semitone', () => {
    // 277.18 Hz ≈ C#4 = MIDI 61
    expect(saMidiForMode('movable', 60, 277.18)).toBe(61)
    // 440 Hz = A4 = MIDI 69 exactly
    expect(saMidiForMode('movable', 60, 440)).toBe(69)
    // 300 Hz should round to nearest semitone
    expect(saMidiForMode('movable', 60, 300)).toBe(Math.round(hzToMidi(300)))
  })

  test('movable mode without calibration returns null', () => {
    expect(saMidiForMode('movable', 60, null)).toBeNull()
    expect(saMidiForMode('movable', 60, 0)).toBeNull()
    expect(saMidiForMode('movable', 60, -5)).toBeNull()
    expect(saMidiForMode('movable', 60, NaN)).toBeNull()
  })
})
