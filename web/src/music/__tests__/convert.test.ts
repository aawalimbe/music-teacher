import { describe, expect, test } from 'vitest'
import {
  centsDistance,
  frequencyToSargam,
  sargamToHz,
  sargamToMidi,
} from '../convert'
import { hzToMidi } from '../tuning'

// Fixed Sa = C4 (MIDI 60) unless a test says otherwise. See docs/sargam-mapping.md §11.
const SA_C4 = 60

describe('frequencyToSargam — fixed Sa = C4', () => {
  test('A4 (440 Hz) → Dha (madhya)', () => {
    const r = frequencyToSargam(440, SA_C4)
    expect(r?.kind).toBe('in_range')
    if (r?.kind !== 'in_range') throw new Error()
    expect(r.swara).toBe('dha')
    expect(r.octave).toBe('madhya')
    expect(r.centsOff).toBeCloseTo(0, 4)
  })

  test('middle C (~261.63 Hz) → Sa (madhya)', () => {
    const r = frequencyToSargam(261.63, SA_C4)
    expect(r?.kind).toBe('in_range')
    if (r?.kind !== 'in_range') throw new Error()
    expect(r.swara).toBe('sa')
    expect(r.octave).toBe('madhya')
    expect(Math.abs(r.centsOff)).toBeLessThan(1)
  })

  test('C3 (~130.81 Hz) → Sa (mandra)', () => {
    const r = frequencyToSargam(130.81, SA_C4)
    expect(r?.kind).toBe('in_range')
    if (r?.kind !== 'in_range') throw new Error()
    expect(r.swara).toBe('sa')
    expect(r.octave).toBe('mandra')
  })

  test('C5 (~523.25 Hz) → Sa (taar)', () => {
    const r = frequencyToSargam(523.25, SA_C4)
    expect(r?.kind).toBe('in_range')
    if (r?.kind !== 'in_range') throw new Error()
    expect(r.swara).toBe('sa')
    expect(r.octave).toBe('taar')
  })

  test('komal/teevra semitone positions', () => {
    // semitones: 1=re_komal, 3=ga_komal, 6=ma_teevra, 8=dha_komal, 10=ni_komal
    const cases: Array<[number, string]> = [
      [277.18, 're_komal'], // 1 semitone above C4 = C#4
      [311.13, 'ga_komal'],
      [369.99, 'ma_teevra'],
      [415.3, 'dha_komal'],
      [466.16, 'ni_komal'],
    ]
    for (const [hz, expected] of cases) {
      const r = frequencyToSargam(hz, SA_C4)
      if (r?.kind !== 'in_range') throw new Error(`expected in_range for ${hz} Hz`)
      expect(r.swara).toBe(expected)
      expect(r.octave).toBe('madhya')
      expect(Math.abs(r.centsOff)).toBeLessThan(1)
    }
  })
})

describe('frequencyToSargam — movable Sa', () => {
  test('with Sa = F4 (MIDI 65), 440 Hz reads as Ga (madhya), not Dha', () => {
    // Under fixed Sa = C4 the same 440 Hz would be Dha. This test pins down the movable-Sa invariant.
    const movableSaMidi = 65
    const r = frequencyToSargam(440, movableSaMidi)
    if (r?.kind !== 'in_range') throw new Error()
    expect(r.swara).toBe('ga')
    expect(r.octave).toBe('madhya')
  })

  test('calibrating Sa via Hz and then reading a pitch matches the semitone arithmetic', () => {
    // User calibrates Sa by playing ~196 Hz (G3, MIDI 55). Then plays 440 Hz (MIDI 69).
    // Diff = 14 semitones = 12 + 2 → Re in taar.
    const movableSaMidi = Math.round(hzToMidi(196))
    expect(movableSaMidi).toBe(55)
    const r = frequencyToSargam(440, movableSaMidi)
    if (r?.kind !== 'in_range') throw new Error()
    expect(r.swara).toBe('re')
    expect(r.octave).toBe('taar')
  })
})

describe('frequencyToSargam — edge cases', () => {
  test.each([null, undefined, 0, -1, NaN, Infinity])('null-like input %p → null', (v) => {
    // TS normally would not allow these; emulate runtime junk from the mic path.
    expect(frequencyToSargam(v as unknown as number, SA_C4)).toBeNull()
  })

  test('far-below range returns out_of_range', () => {
    // 4 octaves below Sa = MIDI 60 → MIDI 12 → ~16.35 Hz
    const r = frequencyToSargam(16.35, SA_C4)
    expect(r?.kind).toBe('out_of_range')
  })

  test('far-above range returns out_of_range', () => {
    // 2 octaves above taar (MIDI 60+24 = 84) → MIDI 108 → ~8372 Hz
    const r = frequencyToSargam(8372, SA_C4)
    expect(r?.kind).toBe('out_of_range')
  })

  test('centsOff sign: +50 cents above a note rounds up and reports +50 (by JS Math.round half-up)', () => {
    // 50 ¢ above A4 → halfway between A4 and A#4. Math.round rounds 0.5 up to 1,
    // so result is A#4 (ni_komal given Sa = C4), centsOff = -50.
    const hz = 440 * Math.pow(2, 0.5 / 12)
    const r = frequencyToSargam(hz, SA_C4)
    if (r?.kind !== 'in_range') throw new Error()
    expect(r.swara).toBe('ni_komal')
    expect(r.centsOff).toBeCloseTo(-50, 4)
  })
})

describe('sargamToMidi / sargamToHz round-trip', () => {
  test('round-trip through frequencyToSargam preserves note (modulo cents)', () => {
    // Sweep: every shuddha swara in madhya under Sa = C4
    const cases = [
      ['sa', 261.63],
      ['re', 293.66],
      ['ga', 329.63],
      ['ma', 349.23],
      ['pa', 392.0],
      ['dha', 440.0],
      ['ni', 493.88],
    ] as const
    for (const [swara, hz] of cases) {
      const r = frequencyToSargam(hz, SA_C4)
      if (r?.kind !== 'in_range') throw new Error()
      expect(r.swara).toBe(swara)
      const backHz = sargamToHz({ swara: r.swara, octave: r.octave }, SA_C4)
      expect(centsDistance(hz, backHz)).toBeLessThan(1)
    }
  })

  test('sargamToMidi builds from offset', () => {
    expect(sargamToMidi({ swara: 'sa', octave: 'madhya' }, SA_C4)).toBe(60)
    expect(sargamToMidi({ swara: 'pa', octave: 'madhya' }, SA_C4)).toBe(67)
    expect(sargamToMidi({ swara: 'sa', octave: 'mandra' }, SA_C4)).toBe(48)
    expect(sargamToMidi({ swara: 'sa', octave: 'taar' }, SA_C4)).toBe(72)
    expect(sargamToMidi({ swara: 'ma_teevra', octave: 'madhya' }, SA_C4)).toBe(66)
  })
})

describe('centsDistance', () => {
  test('same frequency = 0', () => {
    expect(centsDistance(440, 440)).toBe(0)
  })

  test('one semitone = 100 ¢', () => {
    expect(centsDistance(440, 440 * Math.pow(2, 1 / 12))).toBeCloseTo(100, 4)
  })

  test('always unsigned', () => {
    expect(centsDistance(300, 400)).toBeGreaterThan(0)
    expect(centsDistance(400, 300)).toBeGreaterThan(0)
    expect(centsDistance(300, 400)).toBeCloseTo(centsDistance(400, 300), 6)
  })
})
