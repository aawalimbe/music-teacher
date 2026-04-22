import { hzToMidi, midiToHz } from './tuning'
import { saptakFromOctaveIndex, octaveOffset, type Saptak } from './octaves'
import { SEMITONE_BY_SWARA, SWARA_BY_SEMITONE, type Swara } from './swaras'

export type Sargam = {
  swara: Swara
  octave: Saptak
}

export type FrequencyAnalysis = {
  kind: 'in_range'
  swara: Swara
  octave: Saptak
  centsOff: number
  frequency: number
  midiFloat: number
}

export type OutOfRange = {
  kind: 'out_of_range'
  frequency: number
  midiFloat: number
}

export type FrequencyResult = FrequencyAnalysis | OutOfRange | null

// Core conversion. See docs/sargam-mapping.md §5 for the algorithm.
export function frequencyToSargam(
  hz: number | null | undefined,
  saMidi: number,
): FrequencyResult {
  if (hz == null || !Number.isFinite(hz) || hz <= 0) return null

  const midiFloat = hzToMidi(hz)
  const semitonesFromSa = midiFloat - saMidi
  const n = Math.round(semitonesFromSa)
  const centsOff = (semitonesFromSa - n) * 100

  const octaveIndex = Math.floor(n / 12)
  const swaraIndex = ((n % 12) + 12) % 12

  const octave = saptakFromOctaveIndex(octaveIndex)
  if (octave === null) {
    return { kind: 'out_of_range', frequency: hz, midiFloat }
  }

  return {
    kind: 'in_range',
    swara: SWARA_BY_SEMITONE[swaraIndex],
    octave,
    centsOff,
    frequency: hz,
    midiFloat,
  }
}

export function sargamToMidi(sargam: Sargam, saMidi: number): number {
  return saMidi + 12 * octaveOffset(sargam.octave) + SEMITONE_BY_SWARA[sargam.swara]
}

export function sargamToHz(sargam: Sargam, saMidi: number): number {
  return midiToHz(sargamToMidi(sargam, saMidi))
}

// Unsigned cent distance between two frequencies. Always ≥ 0.
export function centsDistance(detectedHz: number, targetHz: number): number {
  return Math.abs(1200 * Math.log2(detectedHz / targetHz))
}

// Signed cent offset: negative = detected is flat, positive = sharp.
// Preferred for tuner display where direction matters.
export function centsOffset(detectedHz: number, targetHz: number): number {
  return 1200 * Math.log2(detectedHz / targetHz)
}
