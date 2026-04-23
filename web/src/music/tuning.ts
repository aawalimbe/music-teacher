// A4 = 440 Hz. The only magic pitch number in the project — all Hz/MIDI math flows from here.
export const A4_HZ = 440
export const A4_MIDI = 69

export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12)
}

export function hzToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_HZ)
}

const NOTE_NAMES_LATIN = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const

// Harmonium-tradition Devanagari names: white keys (Safed 1-7) and black keys (Kali 1-5).
// What vocal teachers and harmonium learners actually say, instead of abstract letters.
const NOTE_NAMES_DEVANAGARI = [
  'सफेद १', // C  → Safed 1
  'काली १', // C♯ → Kali 1
  'सफेद २', // D  → Safed 2
  'काली २', // D♯ → Kali 2
  'सफेद ३', // E  → Safed 3
  'सफेद ४', // F  → Safed 4
  'काली ३', // F♯ → Kali 3
  'सफेद ५', // G  → Safed 5
  'काली ४', // G♯ → Kali 4
  'सफेद ६', // A  → Safed 6
  'काली ५', // A♯ → Kali 5
  'सफेद ७', // B  → Safed 7
] as const

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'] as const

type NoteScript = 'latin' | 'devanagari'

// Scientific pitch notation for a MIDI number. C4 = 60 = middle C.
// In devanagari mode, returns the Safed/Kali name with the octave as a
// Unicode subscript (e.g. MIDI 64 → "सफेद ३₄").
export function midiToNoteName(midi: number, script: NoteScript = 'latin'): string {
  const rounded = Math.round(midi)
  const octave = Math.floor(rounded / 12) - 1
  const pc = ((rounded % 12) + 12) % 12
  if (script === 'devanagari') {
    const octStr = String(octave)
      .split('')
      .map((d) => (d === '-' ? '₋' : SUBSCRIPT_DIGITS[Number(d)]))
      .join('')
    return `${NOTE_NAMES_DEVANAGARI[pc]}${octStr}`
  }
  return `${NOTE_NAMES_LATIN[pc]}${octave}`
}
