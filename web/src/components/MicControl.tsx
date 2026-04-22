import type { MicState } from '../audio'

type Props = {
  state: MicState
  error: string | null
  onStart: () => void
  onStop: () => void
}

export function MicControl({ state, error, onStart, onStop }: Props) {
  if (state === 'active') {
    return (
      <div className="mic">
        <button type="button" className="pill pill--selected" onClick={onStop}>
          Stop listening
        </button>
        <span className="mic__status mic__status--ok">mic live</span>
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
