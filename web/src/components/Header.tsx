import { midiToNoteName, swaraLabel } from '../music'
import { useSettings, type Instrument } from '../store'
import './Header.css'

const INSTRUMENT_NAMES: Readonly<Record<Instrument, string>> = {
  acoustic_guitar: 'Guitar',
  ukulele: 'Ukulele',
  keyboard: 'Keyboard',
  harmonium: 'Harmonium',
}

export function Header() {
  const {
    leftSidebarOpen,
    rightSidebarOpen,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    instrument,
    handedness,
    saMode,
    fixedSaMidi,
    movableSaHz,
    sargamScript,
  } = useSettings()

  const saText = saSummary(saMode, fixedSaMidi, movableSaHz, sargamScript)

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__toggle"
        aria-label={leftSidebarOpen ? 'Collapse settings' : 'Expand settings'}
        aria-expanded={leftSidebarOpen}
        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
      >
        {leftSidebarOpen ? '◀' : '▶'}
      </button>

      <div className="topbar__title">
        <h1>Music Teacher</h1>
        <p className="topbar__tagline">
          सा रे ग म प ध नि &middot; sargam-based, browser-first
        </p>
        <div className="topbar__summary" aria-label="Current settings summary">
          <span className="chip">{INSTRUMENT_NAMES[instrument]}</span>
          {(instrument === 'acoustic_guitar' || instrument === 'ukulele') && (
            <span className="chip chip--dim">{handedness === 'right' ? 'Right' : 'Left'}</span>
          )}
          <span className="chip chip--dim">{saText}</span>
          <span className="chip chip--dim">{sargamScript === 'devanagari' ? 'देवनागरी' : 'Latin'}</span>
        </div>
      </div>

      <button
        type="button"
        className="topbar__toggle"
        aria-label={rightSidebarOpen ? 'Collapse diagnostics' : 'Expand diagnostics'}
        aria-expanded={rightSidebarOpen}
        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
      >
        {rightSidebarOpen ? '▶' : '◀'}
      </button>
    </header>
  )
}

function saSummary(
  saMode: 'fixed' | 'movable',
  fixedSaMidi: number,
  movableSaHz: number | null,
  script: 'latin' | 'devanagari',
): string {
  const saName = swaraLabel('sa', script)
  if (saMode === 'fixed') {
    return `${saName}=${midiToNoteName(fixedSaMidi)}`
  }
  if (movableSaHz == null) return `${saName}=?`
  const midi = Math.round(69 + 12 * Math.log2(movableSaHz / 440))
  return `${saName}=${midiToNoteName(midi)}`
}
