import { useEffect, useState } from 'react'
import type { LivePitchReading, MicDiagnostics, MicState } from '../audio'
import './DiagnosticsPanel.css'

// Temporary diagnostic aid for Sprint 3 mic debugging. Safe to remove once
// the tuner works reliably against a real instrument.

type Props = {
  state: MicState
  reading: LivePitchReading
  deviceLabel: string | null
  diagnostics: MicDiagnostics | null
}

type Sample = {
  t: number
  rms: number | null
  clarity: number | null
  frequency: number | null
}

const HISTORY_SECONDS = 5
const UPDATE_HZ = 30
const HISTORY_CAP = HISTORY_SECONDS * UPDATE_HZ

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export function DiagnosticsPanel({ state, reading, deviceLabel, diagnostics }: Props) {
  const [history, setHistory] = useState<ReadonlyArray<Sample>>([])
  const [copied, setCopied] = useState(false)

  // Capture a sample per reading change while the mic is active. Keep history
  // across stop/start so the user can see continuity on restart. Accumulating
  // history is inherently effect-driven — the rule's "avoid setState in effect"
  // doesn't apply when the state is a log of past external events.
  useEffect(() => {
    if (state !== 'active') return
    const sample: Sample = {
      t: Date.now(),
      rms: reading.rms,
      clarity: reading.clarity,
      frequency: reading.frequency,
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory((prev) => {
      const next = prev.length >= HISTORY_CAP ? prev.slice(prev.length - HISTORY_CAP + 1) : prev
      return [...next, sample]
    })
  }, [reading, state])

  async function copySnapshot() {
    const snapshot = {
      capturedAt: new Date().toISOString(),
      state,
      deviceLabel,
      diagnostics,
      current: reading,
      historySeconds: HISTORY_SECONDS,
      historyCount: history.length,
      history: history.map((s) => ({
        dt_ms: s.t - (history[0]?.t ?? s.t),
        rms: s.rms,
        clarity: s.clarity,
        frequency: s.frequency,
      })),
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const rmsSeries = history.map((s) => s.rms ?? 0)
  const claritySeries = history.map((s) => s.clarity ?? 0)
  const freqSeries = history.map((s) => s.frequency ?? 0)

  // Dynamic RMS scale so even tiny signals render as visible blocks.
  const rmsMax = Math.max(0.01, ...rmsSeries)
  const freqMax = Math.max(1, ...freqSeries.filter((f) => f > 0))

  return (
    <div className="diag">
      <div className="diag__body">
        <div className="diag__kv">
          <div>
            <span className="diag__key">state</span>
            <span className="diag__val">{state}</span>
          </div>
          <div>
            <span className="diag__key">device</span>
            <span className="diag__val">{deviceLabel ?? '—'}</span>
          </div>
          <div>
            <span className="diag__key">sample rate</span>
            <span className="diag__val">{diagnostics?.sampleRate ?? '—'} Hz</span>
          </div>
          <div>
            <span className="diag__key">buffer</span>
            <span className="diag__val">{diagnostics?.bufferSize ?? '—'}</span>
          </div>
          <div>
            <span className="diag__key">ctx state</span>
            <span className="diag__val">{diagnostics?.contextState ?? '—'}</span>
          </div>
          <div>
            <span className="diag__key">rms thresh</span>
            <span className="diag__val">{diagnostics?.rmsThreshold ?? '—'}</span>
          </div>
          <div>
            <span className="diag__key">clarity thresh</span>
            <span className="diag__val">{diagnostics?.clarityThreshold ?? '—'}</span>
          </div>
          <div>
            <span className="diag__key">bandpass</span>
            <span className="diag__val">
              {diagnostics
                ? `${diagnostics.bandpassHighpassHz}–${diagnostics.bandpassLowpassHz} Hz`
                : '—'}
            </span>
          </div>
        </div>

        <SparkRow
          label="rms"
          series={rmsSeries}
          currentValue={reading.rms}
          format={(v) => v.toFixed(4)}
          max={rmsMax}
        />
        <SparkRow
          label="clarity"
          series={claritySeries}
          currentValue={reading.clarity}
          format={(v) => v.toFixed(2)}
          max={1}
        />
        <SparkRow
          label="freq"
          series={freqSeries}
          currentValue={reading.frequency}
          format={(v) => `${v.toFixed(1)} Hz`}
          max={freqMax}
        />

        <div className="diag__actions">
          <button type="button" className="pill pill--small" onClick={copySnapshot}>
            {copied ? 'Copied ✓' : `Copy last ${HISTORY_SECONDS}s (${history.length} samples)`}
          </button>
        </div>
      </div>
    </div>
  )
}

type SparkProps = {
  label: string
  series: readonly number[]
  currentValue: number | null
  format: (v: number) => string
  max: number
}

function SparkRow({ label, series, currentValue, format, max }: SparkProps) {
  return (
    <div className="diag__spark-row">
      <span className="diag__spark-label">{label}</span>
      <span className="diag__spark">{sparkline(series, max, HISTORY_CAP)}</span>
      <span className="diag__spark-value">
        {currentValue == null ? '—' : format(currentValue)}
      </span>
    </div>
  )
}

function sparkline(values: readonly number[], max: number, width: number): string {
  if (values.length === 0 || max <= 0) return '·'.repeat(width)
  const padded: string[] = []
  const start = Math.max(0, values.length - width)
  for (let i = 0; i < width; i++) {
    const idx = start + i - (width - values.length)
    if (idx < 0 || idx >= values.length) {
      padded.push('·')
    } else {
      const v = values[idx]
      const level = Math.min(7, Math.max(0, Math.floor((v / max) * 8)))
      padded.push(v <= 0 ? '·' : BLOCKS[level])
    }
  }
  return padded.join('')
}
