import {
  FRETTED_INSTRUMENTS,
  useSettings,
  type Instrument,
  type SaMode,
} from '../store'
import { AdvancedSettings } from './AdvancedSettings'
import { MovableSaCalibrator } from './MovableSaCalibrator'
import './SettingsScreen.css'

const INSTRUMENTS: ReadonlyArray<{ value: Instrument; label: string }> = [
  { value: 'acoustic_guitar', label: 'Acoustic Guitar' },
  { value: 'ukulele', label: 'Ukulele' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'harmonium', label: 'Harmonium' },
]

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

// C3 (MIDI 48) to B4 (MIDI 71). Wide enough for most vocal Sa positions and
// for instrumentalists picking a fixed Sa. Extend the range if this proves tight.
const SA_MIDI_RANGE = { min: 48, max: 71 }

function midiToName(midi: number): string {
  const name = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

const SA_OPTIONS = Array.from(
  { length: SA_MIDI_RANGE.max - SA_MIDI_RANGE.min + 1 },
  (_, i) => {
    const midi = SA_MIDI_RANGE.min + i
    return { midi, label: midiToName(midi) }
  },
)

export function SettingsScreen() {
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
  } = useSettings()

  const showHandedness = FRETTED_INSTRUMENTS.has(instrument)

  return (
    <div className="settings">
      <section className="settings__section">
        <h3>Instrument</h3>
        <div className="pills" role="radiogroup" aria-label="Instrument">
          {INSTRUMENTS.map((i) => (
            <button
              key={i.value}
              type="button"
              role="radio"
              aria-checked={instrument === i.value}
              className={`pill ${instrument === i.value ? 'pill--selected' : ''}`}
              onClick={() => setInstrument(i.value)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </section>

      {showHandedness && (
        <section className="settings__section">
          <h3>Handedness</h3>
          <div className="pills" role="radiogroup" aria-label="Handedness">
            <button
              type="button"
              role="radio"
              aria-checked={handedness === 'right'}
              className={`pill ${handedness === 'right' ? 'pill--selected' : ''}`}
              onClick={() => setHandedness('right')}
            >
              Right-handed
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={handedness === 'left'}
              className={`pill ${handedness === 'left' ? 'pill--selected' : ''}`}
              onClick={() => setHandedness('left')}
            >
              Left-handed
            </button>
          </div>
          <p className="note">
            Fretboard diagrams are drawn from your own point of view &mdash; as if looking down
            at your instrument while playing it. Left-handed mirrors the diagram horizontally.
          </p>
        </section>
      )}

      <section className="settings__section">
        <h3>Sa reference</h3>
        <div className="pills" role="radiogroup" aria-label="Sa mode">
          {(['fixed', 'movable'] as const).map((mode: SaMode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={saMode === mode}
              className={`pill ${saMode === mode ? 'pill--selected' : ''}`}
              onClick={() => setSaMode(mode)}
            >
              {mode === 'fixed' ? 'Fixed Sa' : 'Movable Sa'}
            </button>
          ))}
        </div>
        {saMode === 'fixed' ? (
          <label className="inline-control">
            <span>Concert pitch for Sa</span>
            <select
              value={fixedSaMidi}
              onChange={(e) => setFixedSaMidi(Number(e.target.value))}
            >
              {SA_OPTIONS.map((o) => (
                <option key={o.midi} value={o.midi}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <MovableSaCalibrator />
        )}
      </section>

      <section className="settings__section">
        <h3>Sargam script</h3>
        <div className="pills" aria-label="Sargam script">
          <button
            type="button"
            className={`pill ${sargamScript === 'latin' ? 'pill--selected' : ''}`}
            aria-pressed={sargamScript === 'latin'}
            disabled
          >
            Latin &middot; Sa Re Ga Ma Pa Dha Ni
          </button>
          <button type="button" className="pill" disabled>
            Devanagari &middot; सा रे ग म प ध नि
          </button>
        </div>
        <p className="note">Devanagari display toggle arrives in a later sprint.</p>
      </section>

      <details className="settings__advanced">
        <summary>Advanced</summary>
        <AdvancedSettings />
      </details>
    </div>
  )
}
