import type { MicState } from '../audio'

type Props = {
  state: MicState
  error: string | null
  onStart: () => void
  onStop: () => void
  // Optional: when live, a small bar+number lets the user see the mic is receiving
  // signal even if it's below the pitch-detection threshold.
  rms?: number | null
  deviceLabel?: string | null
}

export function MicControl({ state, error, onStart, onStop, rms, deviceLabel }: Props) {
  if (state === 'active') {
    return (
      <div className="mic">
        <div className="mic__row">
          <button type="button" className="pill pill--selected" onClick={onStop}>
            Stop listening
          </button>
          <span className="mic__status mic__status--ok">mic live</span>
          {rms != null && <LevelMeter rms={rms} />}
        </div>
        {deviceLabel && <div className="mic__device">input: {deviceLabel}</div>}
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="mic">
        <button type="button" className="pill" onClick={onStart}>
          Retry microphone
        </button>
        <span className="mic__status mic__status--err">
          Blocked. Allow microphone access in your browser&apos;s site settings, then retry.
        </span>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="mic">
        <button type="button" className="pill" onClick={onStart}>
          Retry
        </button>
        <span className="mic__status mic__status--err">{error ?? 'unknown error'}</span>
      </div>
    )
  }

  if (state === 'requesting') {
    return (
      <div className="mic">
        <button type="button" className="pill" disabled>
          Requesting…
        </button>
        <span className="mic__status">accept the browser prompt</span>
      </div>
    )
  }

  // idle
  return (
    <div className="mic">
      <button type="button" className="pill" onClick={onStart}>
        Start listening
      </button>
    </div>
  )
}

// Normal speech peaks around 0.1-0.2 RMS; 0.3 is a reasonable full-scale cap
// so the bar approaches "full" on a confident signal without clipping the scale.
const LEVEL_FULL_SCALE = 0.3

function LevelMeter({ rms }: { rms: number }) {
  const pct = Math.min(100, (rms / LEVEL_FULL_SCALE) * 100)
  return (
    <div className="level" aria-label="input level" title={`rms ${rms.toFixed(4)}`}>
      <div className="level__bar" style={{ width: `${pct}%` }} />
      <span className="level__value">{rms.toFixed(4)}</span>
    </div>
  )
}
