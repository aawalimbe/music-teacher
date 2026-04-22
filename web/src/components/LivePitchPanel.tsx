import { useState } from 'react'
import { useLivePitch } from '../audio'
import { DiagnosticsPanel } from './DiagnosticsPanel'
import { MicControl } from './MicControl'
import { PitchReadout } from './PitchReadout'
import { TunerView } from './TunerView'
import './DiagnosticsPanel.css'
import './LivePitchPanel.css'
import './TunerView.css'

type Mode = 'readout' | 'tuner'

export function LivePitchPanel() {
  const { state, reading, error, deviceLabel, diagnostics, start, stop } = useLivePitch()
  const [mode, setMode] = useState<Mode>('readout')

  return (
    <section className="live-pitch">
      <div className="live-pitch__top">
        <h2 className="live-pitch__heading">Live pitch</h2>
        <div className="pills pills--tight" role="tablist" aria-label="Display mode">
          {(['readout', 'tuner'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`pill pill--small ${mode === m ? 'pill--selected' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'readout' ? 'Readout' : 'Tuner'}
            </button>
          ))}
        </div>
      </div>

      <MicControl
        state={state}
        error={error}
        onStart={start}
        onStop={stop}
        rms={reading.rms}
        deviceLabel={deviceLabel}
      />

      {mode === 'readout' ? (
        <PitchReadout state={state} reading={reading} />
      ) : (
        <TunerView state={state} reading={reading} />
      )}

      <DiagnosticsPanel
        state={state}
        reading={reading}
        deviceLabel={deviceLabel}
        diagnostics={diagnostics}
      />
    </section>
  )
}
