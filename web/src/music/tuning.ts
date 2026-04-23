// A4 = 440 Hz. The only magic pitch number in the project — all Hz/MIDI math flows from here.
export const A4_HZ = 440
export const A4_MIDI = 69

export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12)
}

export function hzToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_HZ)
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const

// Scientific pitch notation for a MIDI number. C4 = 60 = middle C.
export function midiToNoteName(midi: number): string {
  const rounded = Math.round(midi)
  const octave = Math.floor(rounded / 12) - 1
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${octave}`
}
