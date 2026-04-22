import type { InstrumentDef } from './types'

// Standard re-entrant tuning GCEA. G4 is higher in pitch than C4 even though
// it's the 4th string (top of the fretboard from the player's POV).
// Listed in string order 4→1 so the tuner mirrors what the user sees.
export const ukulele: InstrumentDef = {
  id: 'ukulele',
  displayName: 'Ukulele',
  kind: 'fretted',
  tuningTargets: [
    { label: 'G4', midi: 67, stringIndex: 3 },
    { label: 'C4', midi: 60, stringIndex: 2 },
    { label: 'E4', midi: 64, stringIndex: 1 },
    { label: 'A4', midi: 69, stringIndex: 0 },
  ],
}
