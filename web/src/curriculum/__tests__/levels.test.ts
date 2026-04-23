import { describe, expect, test } from 'vitest'
import {
  findLevel,
  groupOf,
  isUnlocked,
  LEVELS,
  LEVEL_PASS_STREAK,
  nextIncompleteLevel,
} from '../levels'

describe('curriculum', () => {
  test('LEVELS is in ascending displayOrder with unique IDs', () => {
    const orders = LEVELS.map((l) => l.displayOrder)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(new Set(orders).size).toBe(orders.length)
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
  })

  test('every level has at least one target', () => {
    for (const lvl of LEVELS) {
      expect(lvl.targets.length).toBeGreaterThan(0)
    }
  })

  test('single-note identification levels have targets of length 1', () => {
    const singles = [
      'sa-madhya',
      're-madhya',
      'ga-madhya',
      'ma-madhya',
      'pa-madhya',
      'dha-madhya',
      'ni-madhya',
      'sa-taar',
    ]
    for (const id of singles) {
      const lvl = findLevel(id)
      expect(lvl?.targets.length).toBe(1)
      expect(groupOf(lvl!)).toBe('basics')
    }
  })

  test('sa-taar is the 8th basic level and targets Sa in taar', () => {
    const l = findLevel('sa-taar')
    expect(l).toBeDefined()
    expect(l?.targets[0]).toEqual({ swara: 'sa', octave: 'taar' })
    expect(l?.displayOrder).toBe(8)
  })

  test('doubles play the same note twice', () => {
    const dblSa = findLevel('dbl-sa')
    expect(dblSa).toBeDefined()
    expect(dblSa?.targets).toEqual([
      { swara: 'sa', octave: 'madhya' },
      { swara: 'sa', octave: 'madhya' },
    ])
    expect(groupOf(dblSa!)).toBe('doubles')
    expect(findLevel('dbl-ni')?.targets.every((t) => t.swara === 'ni')).toBe(true)
  })

  test('ascending triples form sliding windows and reach taar Sa at the top', () => {
    const asc3Sa = findLevel('asc3-sa')
    expect(asc3Sa?.targets.map((t) => t.swara)).toEqual(['sa', 're', 'ga'])
    expect(asc3Sa?.targets.every((t) => t.octave === 'madhya')).toBe(true)

    // Top of the triples rolls into the taar octave on the last note.
    const asc3Dha = findLevel('asc3-dha')
    expect(asc3Dha?.targets.map((t) => t.swara)).toEqual(['dha', 'ni', 'sa'])
    expect(asc3Dha?.targets[2].octave).toBe('taar')
  })

  test('quads and quints exist and land on Sa taar at the top', () => {
    expect(findLevel('asc4-pa')?.targets.map((t) => t.swara)).toEqual([
      'pa',
      'dha',
      'ni',
      'sa',
    ])
    expect(findLevel('asc4-pa')?.targets[3].octave).toBe('taar')
    expect(findLevel('asc5-ma')?.targets.length).toBe(5)
  })

  test('full saptak up/down cover 8 positions each', () => {
    const up = findLevel('asc-full')
    const down = findLevel('desc-full')
    expect(up?.targets.length).toBe(8)
    expect(up?.targets[7].octave).toBe('taar')
    expect(down?.targets.length).toBe(8)
    expect(down?.targets[0].octave).toBe('taar')
    expect(down?.targets[7]).toEqual({ swara: 'sa', octave: 'madhya' })
  })

  test('isUnlocked still works on the basics prereq chain', () => {
    const re = findLevel('re-madhya')!
    expect(isUnlocked(re, new Set())).toBe(false)
    expect(isUnlocked(re, new Set(['sa-madhya']))).toBe(true)
  })

  test('practice levels have empty prereqs — user can jump to any of them', () => {
    for (const lvl of LEVELS) {
      if (groupOf(lvl) === 'basics') continue
      expect(lvl.prerequisites).toEqual([])
      expect(isUnlocked(lvl, new Set())).toBe(true)
    }
  })

  test('nextIncompleteLevel picks first unlocked incomplete', () => {
    expect(nextIncompleteLevel(new Set()).id).toBe('sa-madhya')
    expect(nextIncompleteLevel(new Set(['sa-madhya'])).id).toBe('re-madhya')
  })

  test('nextIncompleteLevel returns the last level when everything is done', () => {
    const all = new Set(LEVELS.map((l) => l.id))
    expect(nextIncompleteLevel(all).id).toBe(LEVELS[LEVELS.length - 1].id)
  })

  test('pass-streak constant matches the spec', () => {
    expect(LEVEL_PASS_STREAK).toBe(5)
  })
})
