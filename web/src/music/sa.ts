import { hzToMidi } from './tuning'
import type { SaMode } from '../store/settings'

// Resolve the current madhya-Sa MIDI number from settings.
// Returns null for movable mode when the user hasn't calibrated yet — UI must handle.
// See docs/sargam-mapping.md §3.
export function saMidiForMode(
  mode: SaMode,
  fixedSaMidi: number,
  movableSaHz: number | null,
): number | null {
  if (mode === 'fixed') return fixedSaMidi
  if (movableSaHz == null || !Number.isFinite(movableSaHz) || movableSaHz <= 0) return null
  return Math.round(hzToMidi(movableSaHz))
}
