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

export function isShuddha(s: Swara): boolean {
  return !s.includes('_')
}
