import { useLivePitch } from '../audio'
import { MicControl } from './MicControl'
import { PitchReadout } from './PitchReadout'
import './LivePitchPanel.css'

export function LivePitchPanel() {
  const { state, reading, error, start, stop } = useLivePitch()

  return (
    <section className="live-pitch">
      <h2 className="live-pitch__heading">Live pitch</h2>
      <MicControl state={state} error={error} onStart={start} onStop={stop} />
      <PitchReadout state={state} reading={reading} />
    </section>
  )
}
