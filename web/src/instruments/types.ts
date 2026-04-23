import type { Instrument } from '../store'

// A single tuning target — one string for fretted instruments, one reference
// key for keyed ones. Hz is derived via midiToHz at use time, not stored.
export type TuningTarget = {
  // Scientific pitch notation (e.g. "E2", "A4"). Unique per instrument — used
  // as the key for session-latched "tuned" state and in tooltips.
  label: string
  // Bare letter for the tuner UI (e.g. "E", "A"). Reads as "EADGBE" in a row,
  // which is how guitarists actually say standard tuning. Two strings can
  // share the same shortLabel (guitar's low and high E both read "E");
  // the string-pill order and active-highlight disambiguate.
  shortLabel: string
  midi: number
  // Display order (0 = first shown). For fretted instruments, matches string-number
  // convention from the user's first-person POV (per CLAUDE.md handedness rule).
  stringIndex?: number
}

export type InstrumentDef = {
  id: Instrument
  displayName: string
  kind: 'fretted' | 'keyed'
  // Targets shown in the tuner. For keyed instruments this is a small reference
  // set (e.g. A4) rather than per-string tuning.
  tuningTargets: readonly TuningTarget[]
}
