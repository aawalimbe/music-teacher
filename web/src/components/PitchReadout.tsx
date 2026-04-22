import {
  frequencyToSargam,
  saMidiForMode,
  SAPTAK_COMBINING,
  SWARA_LATIN,
  type FrequencyResult,
} from '../music'
import { useSettings } from '../store'
import type { LivePitchReading, MicState } from '../audio'

type Props = {
  state: MicState
  reading: LivePitchReading
}

export function PitchReadout({ state, reading }: Props) {
  const { saMode, fixedSaMidi, movableSaHz } = useSettings()
  const saMidi = saMidiForMode(saMode, fixedSaMidi, movableSaHz)

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
          Set your Sa in Settings &mdash; movable Sa is not calibrated yet.
        </div>
      </div>
    )
  }

  const result = frequencyToSargam(reading.frequency, saMidi)

  return (
    <div className={`readout ${resolvedVariant(result)}`}>
      <div className="readout__swara" aria-live="polite">
        {swaraGlyph(result)}
      </div>
      <div className="readout__saptak">{saptakLabel(result)}</div>
      <div className="readout__debug">{debugLine(reading, result)}</div>
    </div>
  )
}

function resolvedVariant(result: FrequencyResult): string {
  if (result?.kind === 'in_range') return ''
  if (result?.kind === 'out_of_range') return 'readout--warn'
  return 'readout--dim'
}

function swaraGlyph(result: FrequencyResult): string {
  if (result?.kind !== 'in_range') return '—'
  return `${SWARA_LATIN[result.swara]}${SAPTAK_COMBINING[result.octave]}`
}

function saptakLabel(result: FrequencyResult): string {
  if (result == null) return 'listening…'
  if (result.kind === 'out_of_range') return 'out of range'
  return result.octave
}

function debugLine(reading: LivePitchReading, result: FrequencyResult): string {
  if (reading.frequency == null) {
    return reading.rms != null ? `silence · rms ${reading.rms.toFixed(3)}` : '…'
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
