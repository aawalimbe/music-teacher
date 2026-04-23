import { describe, expect, test } from 'vitest'
import {
  findLevel,
  isUnlocked,
  LEVELS,
  LEVEL_PASS_STREAK,
  nextIncompleteLevel,
} from '../levels'

describe('curriculum', () => {
  test('LEVELS is in displayOrder 1..N and IDs are unique', () => {
    const orders = LEVELS.map((l) => l.displayOrder)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(new Set(orders).size).toBe(orders.length)
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
  })

  test('prereq chain forms a linear unlock path from Sa (madhya) to Sa (taar)', () => {
    // The first level has no prereqs; every later level's single prereq is
    // the immediately preceding level's id.
    expect(LEVELS[0].prerequisites).toEqual([])
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].prerequisites).toEqual([LEVELS[i - 1].id])
    }
  })

  test('curriculum includes sa-taar as the 8th level', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(8)
    const saTaar = findLevel('sa-taar')
    expect(saTaar).toBeDefined()
    expect(saTaar?.target).toEqual({ swara: 'sa', octave: 'taar' })
    expect(saTaar?.prerequisites).toEqual(['ni-madhya'])
  })

  test('isUnlocked gates on full prereq satisfaction', () => {
    const re = findLevel('re-madhya')!
    expect(isUnlocked(re, new Set())).toBe(false)
    expect(isUnlocked(re, new Set(['sa-madhya']))).toBe(true)
  })

  test('nextIncompleteLevel picks first unlocked incomplete level', () => {
    expect(nextIncompleteLevel(new Set()).id).toBe('sa-madhya')
    expect(nextIncompleteLevel(new Set(['sa-madhya'])).id).toBe('re-madhya')
    // Skip-ahead guard: if only re-madhya is marked done (shouldn't happen
    // naturally but test the safety), sa-madhya is still the next — it's
    // incomplete AND unlocked, so it wins over re-madhya's successor.
    expect(nextIncompleteLevel(new Set(['re-madhya'])).id).toBe('sa-madhya')
  })

  test('nextIncompleteLevel returns the last level when everything is done', () => {
    const all = new Set(LEVELS.map((l) => l.id))
    expect(nextIncompleteLevel(all).id).toBe(LEVELS[LEVELS.length - 1].id)
  })

  test('pass-streak constant matches the spec', () => {
    expect(LEVEL_PASS_STREAK).toBe(5)
  })
})
