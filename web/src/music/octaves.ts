export type Saptak = 'mandra' | 'madhya' | 'taar'

export const SAPTAK_ORDER = ['mandra', 'madhya', 'taar'] as const satisfies readonly Saptak[]

export function octaveOffset(saptak: Saptak): number {
  if (saptak === 'mandra') return -1
  if (saptak === 'taar') return 1
  return 0
}

// Octave-index (relative to madhya = 0) → Saptak. Returns null if outside v1 range [-1, +1].
export function saptakFromOctaveIndex(octaveIndex: number): Saptak | null {
  if (octaveIndex === -1) return 'mandra'
  if (octaveIndex === 0) return 'madhya'
  if (octaveIndex === 1) return 'taar'
  return null
}

// Display glyph for octave marker (combining diacritics below/above the Latin swara label).
// Applied by UI layer on top of SWARA_LATIN.
export const SAPTAK_COMBINING: Readonly<Record<Saptak, string>> = {
  mandra: '̣', // combining dot below
  madhya: '',
  taar: '̇', // combining dot above
}
