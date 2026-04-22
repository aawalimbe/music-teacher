// A4 = 440 Hz. The only magic pitch number in the project — all Hz/MIDI math flows from here.
export const A4_HZ = 440
export const A4_MIDI = 69

export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12)
}

export function hzToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_HZ)
}
