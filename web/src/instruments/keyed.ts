import type { InstrumentDef } from './types'

// Keyboard and harmonium share the equal-tempered layout. Both are typically
// pre-tuned (keyboard: fixed; harmonium: occasional drift), so the tuner just
// offers a reference A4 to verify concert-pitch alignment.
const keyedTargets = [{ label: 'A4', shortLabel: 'A', midi: 69 }] as const

export const keyboard: InstrumentDef = {
  id: 'keyboard',
  displayName: 'Keyboard',
  kind: 'keyed',
  tuningTargets: keyedTargets,
}

export const harmonium: InstrumentDef = {
  id: 'harmonium',
  displayName: 'Harmonium',
  kind: 'keyed',
  tuningTargets: keyedTargets,
}
