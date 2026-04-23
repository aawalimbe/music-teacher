import {
  midiToNoteName,
  sargamToMidi,
  saMidiForMode,
  SAPTAK_COMBINING,
  swaraLabel,
  type FrequencyResult,
} from '../music'
import { useSettings, type SargamScript } from '../store'
import { useStickyPitch, type LivePitchReading, type MicState } from '../audio'
import './PitchReadout.css'

type Props = {
  state: MicState
  reading: LivePitchReading
}

export function PitchReadout({ state, reading }: Props) {
  const { saMode, fixedSaMidi, movableSaHz, sargamScript } = useSettings()
  const saMidi = saMidiForMode(saMode, fixedSaMidi, movableSaHz)
  // Latched result: bridges brief clarity dips so notes don't flicker off-screen.
  // Debug line below still shows raw per-frame values.
  const sticky = useStickyPitch(reading.frequency, saMidi)

  if (state !== 'active') {
    return (
      <div className="readout readout--dim">
        <div className="readout__label">Listening will appear here.</div>
      </div>
    )
  }

  if (saMidi == null) {
    return (
      <div className="readout readout--dim">
        <div className="readout__label">
          Set your Sa in the sidebar &mdash; movable Sa is not calibrated yet.
        </div>
      </div>
    )
  }

  return (
    <div className={`readout ${resolvedVariant(sticky)}`}>
      <div className="readout__swara" aria-live="polite">
        {swaraGlyph(sticky, sargamScript)}
      </div>
      <div className="readout__bracket">{westernBracket(sticky, saMidi)}</div>
      <div className="readout__saptak">{saptakLabel(sticky)}</div>
      <div className="readout__debug">{debugLine(reading, sticky)}</div>
    </div>
  )
}

function resolvedVariant(result: FrequencyResult): string {
  if (result?.kind === 'in_range') return ''
  if (result?.kind === 'out_of_range') return 'readout--warn'
  return 'readout--dim'
}

function swaraGlyph(result: FrequencyResult, script: SargamScript): string {
  if (result?.kind !== 'in_range') return '—'
  return `${swaraLabel(result.swara, script)}${SAPTAK_COMBINING[result.octave]}`
}

// Western note name in brackets for beginner readability, e.g. "(E4)".
function westernBracket(result: FrequencyResult, saMidi: number): string {
  if (result?.kind !== 'in_range') return ''
  return `(${midiToNoteName(sargamToMidi({ swara: result.swara, octave: result.octave }, saMidi))})`
}

function saptakLabel(result: FrequencyResult): string {
  if (result == null) return 'listening…'
  if (result.kind === 'out_of_range') return 'out of range'
  return result.octave
}

function debugLine(reading: LivePitchReading, result: FrequencyResult): string {
  if (reading.frequency == null) {
    return reading.rms != null ? `silence · rms ${reading.rms.toFixed(4)}` : '…'
  }
  const parts = [`${reading.frequency.toFixed(2)} Hz`]
  if (result?.kind === 'in_range') {
    const sign = result.centsOff >= 0 ? '+' : ''
    parts.push(`${sign}${result.centsOff.toFixed(0)} ¢`)
  }
  if (reading.clarity != null) {
    parts.push(`clarity ${reading.clarity.toFixed(2)}`)
  }
  return parts.join(' · ')
}
