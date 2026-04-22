import type { Instrument } from '../store'
import type { InstrumentDef } from './types'
import { acousticGuitar } from './guitar'
import { ukulele } from './ukulele'
import { keyboard, harmonium } from './keyed'

export type { InstrumentDef, TuningTarget } from './types'

export const INSTRUMENT_DEFS: Readonly<Record<Instrument, InstrumentDef>> = {
  acoustic_guitar: acousticGuitar,
  ukulele,
  keyboard,
  harmonium,
}

export function getInstrumentDef(id: Instrument): InstrumentDef {
  return INSTRUMENT_DEFS[id]
}
