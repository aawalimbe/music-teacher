import { describe, expect, test } from 'vitest'
import { A4_HZ, A4_MIDI, hzToMidi, midiToHz } from '../tuning'

describe('tuning — MIDI ↔ Hz anchor', () => {
  test('A4 anchor round-trips exactly', () => {
    expect(midiToHz(A4_MIDI)).toBe(A4_HZ)
    expect(hzToMidi(A4_HZ)).toBe(A4_MIDI)
  })

  test('C4 (MIDI 60) ≈ 261.63 Hz', () => {
    expect(midiToHz(60)).toBeCloseTo(261.63, 1)
  })

  test('hzToMidi returns float precision for off-pitch inputs', () => {
    // 50 cents above A4
    const hz = A4_HZ * Math.pow(2, 0.5 / 12)
    expect(hzToMidi(hz)).toBeCloseTo(69.5, 4)
  })

  test('octave doubling = +12 MIDI', () => {
    expect(midiToHz(72) / midiToHz(60)).toBeCloseTo(2, 8)
  })
})
