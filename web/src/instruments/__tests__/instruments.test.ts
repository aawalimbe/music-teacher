import { describe, expect, test } from 'vitest'
import { INSTRUMENT_DEFS, getInstrumentDef } from '..'
import { midiToHz } from '../../music'

describe('instrument definitions', () => {
  test('all four instruments present', () => {
    const ids = Object.keys(INSTRUMENT_DEFS).sort()
    expect(ids).toEqual(['acoustic_guitar', 'harmonium', 'keyboard', 'ukulele'])
  })

  test('guitar standard tuning EADGBE, 6 strings, low-to-high', () => {
    const def = getInstrumentDef('acoustic_guitar')
    expect(def.kind).toBe('fretted')
    expect(def.tuningTargets.map((t) => t.midi)).toEqual([40, 45, 50, 55, 59, 64])
    expect(def.tuningTargets.map((t) => t.label)).toEqual([
      'E2',
      'A2',
      'D3',
      'G3',
      'B3',
      'E4',
    ])
    // Short labels read as EADGBE for a guitarist-familiar tuner display.
    expect(def.tuningTargets.map((t) => t.shortLabel).join('')).toBe('EADGBE')
  })

  test('ukulele GCEA re-entrant, 4 strings, string-order 4→1', () => {
    const def = getInstrumentDef('ukulele')
    expect(def.kind).toBe('fretted')
    expect(def.tuningTargets.map((t) => t.label)).toEqual(['G4', 'C4', 'E4', 'A4'])
    expect(def.tuningTargets.map((t) => t.shortLabel).join('')).toBe('GCEA')
    // G4 (67) is higher than C4 (60) — that's the re-entrant part.
    expect(def.tuningTargets[0].midi).toBeGreaterThan(def.tuningTargets[1].midi)
  })

  test('keyboard and harmonium share the keyed single-reference layout', () => {
    const kb = getInstrumentDef('keyboard')
    const hm = getInstrumentDef('harmonium')
    expect(kb.kind).toBe('keyed')
    expect(hm.kind).toBe('keyed')
    expect(kb.tuningTargets).toEqual([{ label: 'A4', shortLabel: 'A', midi: 69 }])
    expect(hm.tuningTargets).toEqual([{ label: 'A4', shortLabel: 'A', midi: 69 }])
  })

  test('A4 = 440 Hz across all targets named A4', () => {
    for (const def of Object.values(INSTRUMENT_DEFS)) {
      for (const t of def.tuningTargets) {
        if (t.label === 'A4') {
          expect(t.midi).toBe(69)
          expect(midiToHz(t.midi)).toBe(440)
        }
      }
    }
  })

  test('fretted instruments have stringIndex; keyed do not', () => {
    for (const def of Object.values(INSTRUMENT_DEFS)) {
      for (const t of def.tuningTargets) {
        if (def.kind === 'fretted') {
          expect(typeof t.stringIndex).toBe('number')
        } else {
          expect(t.stringIndex).toBeUndefined()
        }
      }
    }
  })
})
