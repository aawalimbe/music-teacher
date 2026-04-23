import type { ChangeEvent } from 'react'
import { midiToHz } from '../music'
import { useSettings } from '../store'
import './MovableSaCalibrator.css'

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

// A3 (MIDI 57) to A4 (MIDI 69) spans a comfortable one-octave vocal-Sa range.
// Extend later if it feels tight.
const SA_SLIDER_MIN = 45 // A2
const SA_SLIDER_MAX = 75 // D#5

function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[midi % 12]}${octave}`
}

export function MovableSaCalibrator() {
  const { movableSaHz, setMovableSaHz } = useSettings()

  // If not yet calibrated, default the slider to A3 (a reasonable vocal Sa).
  const currentMidi =
    movableSaHz != null
      ? Math.round(69 + 12 * Math.log2(movableSaHz / 440))
      : 57
  const clampedMidi = Math.max(SA_SLIDER_MIN, Math.min(SA_SLIDER_MAX, currentMidi))

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const midi = Number(e.target.value)
    setMovableSaHz(midiToHz(midi))
  }

  function onClear() {
    setMovableSaHz(null)
  }

  const hz = movableSaHz != null ? movableSaHz : midiToHz(clampedMidi)
  const isCalibrated = movableSaHz != null

  return (
    <div className="calibrator">
      <p className="note">
        Sprint 2 uses a slider to set Sa manually. Play-or-sing-to-calibrate arrives later.
      </p>

      <div className="calibrator__row">
        <input
          type="range"
          min={SA_SLIDER_MIN}
          max={SA_SLIDER_MAX}
          step={1}
          value={clampedMidi}
          onChange={onChange}
          aria-label="Movable Sa MIDI"
          className="calibrator__slider"
        />
        <div className="calibrator__value">
          <span className="calibrator__note">{midiToName(clampedMidi)}</span>
          <span className="calibrator__hz">{hz.toFixed(2)} Hz</span>
        </div>
      </div>

      {isCalibrated && (
        <button type="button" className="pill pill--small" onClick={onClear}>
          Clear Sa
        </button>
      )}
    </div>
  )
}
