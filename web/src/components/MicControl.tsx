import type { MicState } from '../audio'
import { MicIcon, MicOffIcon } from './icons'
import './MicControl.css'

type Props = {
  state: MicState
  error: string | null
  onStart: () => void
  onStop: () => void
  rms?: number | null
  deviceLabel?: string | null
}

// Normal speech peaks around 0.1-0.2 RMS; 0.3 is a reasonable full-scale cap.
const LEVEL_FULL_SCALE = 0.3

export function MicControl({ state, error, onStart, onStop, rms, deviceLabel }: Props) {
  const label = buttonLabel(state)
  const action = state === 'active' ? onStop : onStart
  const disabled = state === 'requesting'
  const status = statusText(state, error)
  const levelPct = rms != null ? Math.min(100, (rms / LEVEL_FULL_SCALE) * 100) : 0

  return (
    <button
      type="button"
      className={`mic-btn mic-btn--${state}`}
      disabled={disabled}
      onClick={action}
      aria-label={label}
      title={deviceLabel ?? undefined}
    >
      <span className="mic-btn__icon" aria-hidden>
        {state === 'denied' ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
      </span>
      <span className="mic-btn__label">{label}</span>
      {state === 'active' && (
        <span className="mic-btn__level" aria-hidden>
          <span className="mic-btn__level-bar" style={{ width: `${levelPct}%` }} />
        </span>
      )}
      {status && <span className="mic-btn__status">{status}</span>}
    </button>
  )
}

function buttonLabel(state: MicState): string {
  switch (state) {
    case 'active':
      return 'Stop'
    case 'requesting':
      return 'Requesting…'
    case 'denied':
      return 'Retry mic'
    case 'error':
      return 'Retry'
    default:
      return 'Listen'
  }
}

function statusText(state: MicState, error: string | null): string | null {
  if (state === 'denied') return 'blocked'
  if (state === 'error') return error ?? 'error'
  return null
}
