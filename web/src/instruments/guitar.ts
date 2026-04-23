import type { InstrumentDef } from './types'

// Standard tuning EADGBE, low-to-high. 6th string (thickest) is E2, 1st is E4.
// Listed low-to-high because that's also the natural pitch-ascending order for a tuner.
export const acousticGuitar: InstrumentDef = {
  id: 'acoustic_guitar',
  displayName: 'Acoustic Guitar',
  kind: 'fretted',
  tuningTargets: [
    { label: 'E2', shortLabel: 'E', midi: 40, stringIndex: 5 },
    { label: 'A2', shortLabel: 'A', midi: 45, stringIndex: 4 },
    { label: 'D3', shortLabel: 'D', midi: 50, stringIndex: 3 },
    { label: 'G3', shortLabel: 'G', midi: 55, stringIndex: 2 },
    { label: 'B3', shortLabel: 'B', midi: 59, stringIndex: 1 },
    { label: 'E4', shortLabel: 'E', midi: 64, stringIndex: 0 },
  ],
}
