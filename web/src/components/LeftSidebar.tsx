import type { ChangeEvent } from 'react'
import { midiToNoteName, swaraLabel } from '../music'
import {
  FRETTED_INSTRUMENTS,
  useSettings,
  type Instrument,
  type SaMode,
  type SargamScript,
} from '../store'
import { AdvancedSettings } from './AdvancedSettings'
import { MovableSaCalibrator } from './MovableSaCalibrator'
import './LeftSidebar.css'

const INSTRUMENTS: ReadonlyArray<{ value: Instrument; label: string }> = [
  { value: 'acoustic_guitar', label: 'Acoustic Guitar' },
  { value: 'ukulele', label: 'Ukulele' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'harmonium', label: 'Harmonium' },
]

// C3 (MIDI 48) to B4 (MIDI 71). Vocal Sa range + common instrumental Sa positions.
const SA_MIDI_RANGE = { min: 48, max: 71 }
const SA_OPTIONS = Array.from(
  { length: SA_MIDI_RANGE.max - SA_MIDI_RANGE.min + 1 },
  (_, i) => SA_MIDI_RANGE.min + i,
)

export function LeftSidebar() {
  const {
    instrument,
    handedness,
    saMode,
    fixedSaMidi,
    sargamScript,
    setInstrument,
    setHandedness,
    setSaMode,
    setFixedSaMidi,
    setSargamScript,
  } = useSettings()

  const showHandedness = FRETTED_INSTRUMENTS.has(instrument)
  const saLabel = swaraLabel('sa', sargamScript) // "Sa" or "सा"

  function onInstrumentChange(e: ChangeEvent<HTMLSelectElement>) {
    setInstrument(e.target.value as Instrument)
  }

  function onSaMidiChange(e: ChangeEvent<HTMLSelectElement>) {
    setFixedSaMidi(Number(e.target.value))
  }

  return (
    <div className="side">
      <section className="side__section">
        <h3 className="side__heading">Instrument</h3>
        <select
          className="side__select"
          value={instrument}
          onChange={onInstrumentChange}
          aria-label="Instrument"
        >
          {INSTRUMENTS.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </section>

      {showHandedness && (
        <section className="side__section">
          <h3 className="side__heading">Handedness</h3>
          <div className="side__pills" role="radiogroup" aria-label="Handedness">
            {(['right', 'left'] as const).map((h) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={handedness === h}
                className={`pill ${handedness === h ? 'pill--selected' : ''}`}
                onClick={() => setHandedness(h)}
              >
                {h === 'right' ? 'Right' : 'Left'}
              </button>
            ))}
          </div>
          <p className="note">
            Diagrams are drawn from your first-person POV — left-handed mirrors them.
          </p>
        </section>
      )}

      <section className="side__section">
        <h3 className="side__heading">Sa reference</h3>
        <div className="side__pills" role="radiogroup" aria-label="Sa mode">
          {(['fixed', 'movable'] as const).map((mode: SaMode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={saMode === mode}
              className={`pill ${saMode === mode ? 'pill--selected' : ''}`}
              onClick={() => setSaMode(mode)}
            >
              {mode === 'fixed' ? 'Fixed' : 'Movable'}
            </button>
          ))}
        </div>

        {saMode === 'fixed' ? (
          <label className="side__label-row">
            <span className="side__label">
              {saLabel} <span className="side__label-dim">({midiToNoteName(fixedSaMidi)})</span>
            </span>
            <select
              className="side__select"
              value={fixedSaMidi}
              onChange={onSaMidiChange}
              aria-label={`${saLabel} concert pitch`}
            >
              {SA_OPTIONS.map((midi) => (
                <option key={midi} value={midi}>
                  {midiToNoteName(midi)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <MovableSaCalibrator />
        )}
      </section>

      <section className="side__section">
        <h3 className="side__heading">Sargam script</h3>
        <div className="side__pills" role="radiogroup" aria-label="Sargam script">
          {(['latin', 'devanagari'] as const).map((s: SargamScript) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={sargamScript === s}
              className={`pill ${sargamScript === s ? 'pill--selected' : ''}`}
              onClick={() => setSargamScript(s)}
            >
              {s === 'latin' ? 'Latin' : 'देवनागरी'}
            </button>
          ))}
        </div>
      </section>

      <details className="side__advanced">
        <summary>Advanced</summary>
        <AdvancedSettings />
      </details>
    </div>
  )
}
