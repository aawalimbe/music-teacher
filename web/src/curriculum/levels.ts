import type { Saptak, Swara } from '../music'

export type LessonTarget = { swara: Swara; octave: Saptak }

export type Level = {
  id: string
  name: string
  displayOrder: number
  // One-element array = single-note lesson. Multi-element = sequence (practice
  // session). The lesson runner advances through targets in order — user must
  // sustain each in turn. One complete pass through `targets` = one "correct".
  targets: ReadonlyArray<LessonTarget>
  // Prerequisites are stored but NOT gated by the UI — users can jump to any
  // level at any time. Kept here for future "recommended path" UI or tests.
  prerequisites: readonly string[]
}

// ---------------------------------------------------------------------------
// Level-building helpers. Keep the declaration site compact by naming common
// targets and composing sequences out of them.
// ---------------------------------------------------------------------------

const m = (swara: Swara): LessonTarget => ({ swara, octave: 'madhya' })
const t = (swara: Swara): LessonTarget => ({ swara, octave: 'taar' })

// The seven shuddha swaras of the madhya saptak, in order. Reused by the
// practice sequences below.
const SARGAM: readonly Swara[] = ['sa', 're', 'ga', 'ma', 'pa', 'dha', 'ni']

// Ascending window of length `n` starting at index `start` within SARGAM.
// A window that runs past the last shuddha swara (Ni → Sa taar) rolls into the
// taar octave. Example: ascend(6, 3) → [Pa, Dha, Ni, Sa(taar)]
function ascend(start: number, len: number): LessonTarget[] {
  const out: LessonTarget[] = []
  for (let i = 0; i < len; i++) {
    const idx = start + i
    if (idx < SARGAM.length) out.push(m(SARGAM[idx]))
    else if (idx === SARGAM.length) out.push(t('sa'))
    else break // past Sa(taar); v1 curriculum doesn't extend further
  }
  return out
}

// Descending mirror: Sa(taar) → Ni → ... → starting swara in madhya.
function descend(): LessonTarget[] {
  return [t('sa'), ...[...SARGAM].reverse().map(m)]
}

// ---------------------------------------------------------------------------
// Levels: 8 single-note identification levels, then a batch of practice
// sequences (doubles, ascending triples/quads/quints, full up + down).
// ---------------------------------------------------------------------------

type LevelSeed = Omit<Level, 'displayOrder'>

const SEEDS: readonly LevelSeed[] = [
  // --- Single-note identification (Sprint 5 core) ---
  { id: 'sa-madhya', name: 'Sa (madhya)', targets: [m('sa')], prerequisites: [] },
  { id: 're-madhya', name: 'Re (madhya)', targets: [m('re')], prerequisites: ['sa-madhya'] },
  { id: 'ga-madhya', name: 'Ga (madhya)', targets: [m('ga')], prerequisites: ['re-madhya'] },
  { id: 'ma-madhya', name: 'Ma (madhya)', targets: [m('ma')], prerequisites: ['ga-madhya'] },
  { id: 'pa-madhya', name: 'Pa (madhya)', targets: [m('pa')], prerequisites: ['ma-madhya'] },
  { id: 'dha-madhya', name: 'Dha (madhya)', targets: [m('dha')], prerequisites: ['pa-madhya'] },
  { id: 'ni-madhya', name: 'Ni (madhya)', targets: [m('ni')], prerequisites: ['dha-madhya'] },
  { id: 'sa-taar', name: 'Sa (taar)', targets: [t('sa')], prerequisites: ['ni-madhya'] },

  // --- Doubles: play the same note twice ---
  ...SARGAM.map((s) => ({
    id: `dbl-${s}`,
    name: `${capitalise(s)} ${capitalise(s)}`,
    targets: [m(s), m(s)],
    prerequisites: [] as string[],
  })),

  // --- Ascending triples: sliding 3-note windows ---
  { id: 'asc3-sa', name: 'Sa Re Ga', targets: ascend(0, 3), prerequisites: [] },
  { id: 'asc3-re', name: 'Re Ga Ma', targets: ascend(1, 3), prerequisites: [] },
  { id: 'asc3-ga', name: 'Ga Ma Pa', targets: ascend(2, 3), prerequisites: [] },
  { id: 'asc3-ma', name: 'Ma Pa Dha', targets: ascend(3, 3), prerequisites: [] },
  { id: 'asc3-pa', name: 'Pa Dha Ni', targets: ascend(4, 3), prerequisites: [] },
  { id: 'asc3-dha', name: 'Dha Ni Sȧ', targets: ascend(5, 3), prerequisites: [] },

  // --- Ascending quads ---
  { id: 'asc4-sa', name: 'Sa Re Ga Ma', targets: ascend(0, 4), prerequisites: [] },
  { id: 'asc4-re', name: 'Re Ga Ma Pa', targets: ascend(1, 4), prerequisites: [] },
  { id: 'asc4-ga', name: 'Ga Ma Pa Dha', targets: ascend(2, 4), prerequisites: [] },
  { id: 'asc4-ma', name: 'Ma Pa Dha Ni', targets: ascend(3, 4), prerequisites: [] },
  { id: 'asc4-pa', name: 'Pa Dha Ni Sȧ', targets: ascend(4, 4), prerequisites: [] },

  // --- Ascending quints ---
  { id: 'asc5-sa', name: 'Sa Re Ga Ma Pa', targets: ascend(0, 5), prerequisites: [] },
  { id: 'asc5-re', name: 'Re Ga Ma Pa Dha', targets: ascend(1, 5), prerequisites: [] },
  { id: 'asc5-ga', name: 'Ga Ma Pa Dha Ni', targets: ascend(2, 5), prerequisites: [] },
  { id: 'asc5-ma', name: 'Ma Pa Dha Ni Sȧ', targets: ascend(3, 5), prerequisites: [] },

  // --- Full ascending and descending across the saptak ---
  {
    id: 'asc-full',
    name: 'Sa Re Ga Ma Pa Dha Ni Sȧ',
    targets: ascend(0, 8),
    prerequisites: [],
  },
  {
    id: 'desc-full',
    name: 'Sȧ Ni Dha Pa Ma Ga Re Sa',
    targets: descend(),
    prerequisites: [],
  },
]

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const LEVELS: readonly Level[] = SEEDS.map((seed, i) => ({
  ...seed,
  displayOrder: i + 1,
}))

// Semantic grouping used by the UI to break the long list into labeled
// sections without re-arranging displayOrder.
export type LevelGroup = 'basics' | 'doubles' | 'triples' | 'quads' | 'quints' | 'full'

export function groupOf(level: Level): LevelGroup {
  if (level.id.startsWith('dbl-')) return 'doubles'
  if (level.id.startsWith('asc3-')) return 'triples'
  if (level.id.startsWith('asc4-')) return 'quads'
  if (level.id.startsWith('asc5-')) return 'quints'
  if (level.id === 'asc-full' || level.id === 'desc-full') return 'full'
  return 'basics'
}

export const GROUP_LABEL: Readonly<Record<LevelGroup, string>> = {
  basics: 'Basics — identify a single note',
  doubles: 'Doubles — play each note twice',
  triples: 'Triples — ascending 3-note runs',
  quads: 'Quads — ascending 4-note runs',
  quints: 'Quints — ascending 5-note runs',
  full: 'Full saptak — up and back',
}

export const GROUP_ORDER: readonly LevelGroup[] = [
  'basics',
  'doubles',
  'triples',
  'quads',
  'quints',
  'full',
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

// How many complete sequences in a row are required to pass a level.
export const LEVEL_PASS_STREAK = 5
