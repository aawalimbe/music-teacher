import { describe, expect, test } from 'vitest'
import { A4_HZ, A4_MIDI, hzToMidi, midiToHz, midiToNoteName } from '../tuning'

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

describe('midiToNoteName', () => {
  test('middle C and reference A', () => {
    expect(midiToNoteName(60)).toBe('C4')
    expect(midiToNoteName(69)).toBe('A4')
  })

  test('guitar tuning targets', () => {
    expect(midiToNoteName(40)).toBe('E2')
    expect(midiToNoteName(45)).toBe('A2')
    expect(midiToNoteName(50)).toBe('D3')
    expect(midiToNoteName(55)).toBe('G3')
    expect(midiToNoteName(59)).toBe('B3')
    expect(midiToNoteName(64)).toBe('E4')
  })

  test('sharps render with music sharp glyph', () => {
    expect(midiToNoteName(61)).toBe('C♯4')
    expect(midiToNoteName(66)).toBe('F♯4')
  })
})
