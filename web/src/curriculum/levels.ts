import type { Saptak, Swara } from '../music'

export type Level = {
  id: string
  name: string
  displayOrder: number
  target: { swara: Swara; octave: Saptak }
  prerequisites: readonly string[]
}

// Sprint 5 — 7 shuddha swaras in madhya. Komal/teevra + other octaves land in Sprint 6.
// Each level unlocks only once its prerequisite is completed.
export const LEVELS: readonly Level[] = [
  {
    id: 'sa-madhya',
    name: 'Sa (madhya)',
    displayOrder: 1,
    target: { swara: 'sa', octave: 'madhya' },
    prerequisites: [],
  },
  {
    id: 're-madhya',
    name: 'Re (madhya)',
    displayOrder: 2,
    target: { swara: 're', octave: 'madhya' },
    prerequisites: ['sa-madhya'],
  },
  {
    id: 'ga-madhya',
    name: 'Ga (madhya)',
    displayOrder: 3,
    target: { swara: 'ga', octave: 'madhya' },
    prerequisites: ['re-madhya'],
  },
  {
    id: 'ma-madhya',
    name: 'Ma (madhya)',
    displayOrder: 4,
    target: { swara: 'ma', octave: 'madhya' },
    prerequisites: ['ga-madhya'],
  },
  {
    id: 'pa-madhya',
    name: 'Pa (madhya)',
    displayOrder: 5,
    target: { swara: 'pa', octave: 'madhya' },
    prerequisites: ['ma-madhya'],
  },
  {
    id: 'dha-madhya',
    name: 'Dha (madhya)',
    displayOrder: 6,
    target: { swara: 'dha', octave: 'madhya' },
    prerequisites: ['pa-madhya'],
  },
  {
    id: 'ni-madhya',
    name: 'Ni (madhya)',
    displayOrder: 7,
    target: { swara: 'ni', octave: 'madhya' },
    prerequisites: ['dha-madhya'],
  },
]

export function isUnlocked(level: Level, completed: ReadonlySet<string>): boolean {
  return level.prerequisites.every((p) => completed.has(p))
}

export function findLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id)
}

// Pick the first level that's unlocked and not yet completed.
// If everything's done, returns the last level.
export function nextIncompleteLevel(completed: ReadonlySet<string>): Level {
  for (const lvl of LEVELS) {
    if (!completed.has(lvl.id) && isUnlocked(lvl, completed)) return lvl
  }
  return LEVELS[LEVELS.length - 1]
}

// How many correct-in-a-row are required to pass a level.
export const LEVEL_PASS_STREAK = 5
