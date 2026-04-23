export type Swara =
  | 'sa'
  | 're_komal'
  | 're'
  | 'ga_komal'
  | 'ga'
  | 'ma'
  | 'ma_teevra'
  | 'pa'
  | 'dha_komal'
  | 'dha'
  | 'ni_komal'
  | 'ni'

// Semitone-indexed table, 0 = Sa. See docs/sargam-mapping.md §1.
export const SWARA_BY_SEMITONE = [
  'sa',
  're_komal',
  're',
  'ga_komal',
  'ga',
  'ma',
  'ma_teevra',
  'pa',
  'dha_komal',
  'dha',
  'ni_komal',
  'ni',
] as const satisfies readonly Swara[]

export const SEMITONE_BY_SWARA: Readonly<Record<Swara, number>> = {
  sa: 0,
  re_komal: 1,
  re: 2,
  ga_komal: 3,
  ga: 4,
  ma: 5,
  ma_teevra: 6,
  pa: 7,
  dha_komal: 8,
  dha: 9,
  ni_komal: 10,
  ni: 11,
}

// Textbook Hindustani convention: uppercase = shuddha, lowercase = komal, apostrophe = teevra.
// Renders cleanly in any sans-serif font; avoids spotty Unicode combining-mark support.
export const SWARA_LATIN: Readonly<Record<Swara, string>> = {
  sa: 'Sa',
  re_komal: 're',
  re: 'Re',
  ga_komal: 'ga',
  ga: 'Ga',
  ma: 'Ma',
  ma_teevra: "Ma'",
  pa: 'Pa',
  dha_komal: 'dha',
  dha: 'Dha',
  ni_komal: 'ni',
  ni: 'Ni',
}

// Devanagari labels. Komal is rendered as the shuddha character followed by a ♭
// glyph (and teevra with ♯) rather than Unicode combining marks, which render
// inconsistently across system fonts on Windows/mac.
export const SWARA_DEVANAGARI: Readonly<Record<Swara, string>> = {
  sa: 'सा',
  re_komal: 'रे♭',
  re: 'रे',
  ga_komal: 'ग♭',
  ga: 'ग',
  ma: 'म',
  ma_teevra: 'म♯',
  pa: 'प',
  dha_komal: 'ध♭',
  dha: 'ध',
  ni_komal: 'नि♭',
  ni: 'नि',
}

// Keep this local rather than importing from store to avoid a circular dep.
type Script = 'latin' | 'devanagari'

export function swaraLabel(s: Swara, script: Script): string {
  return script === 'devanagari' ? SWARA_DEVANAGARI[s] : SWARA_LATIN[s]
}

export function isShuddha(s: Swara): boolean {
  return !s.includes('_')
}
