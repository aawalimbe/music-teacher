import type { LivePitchReading, MicDiagnostics, MicState } from '../audio'
import { DiagnosticsPanel } from './DiagnosticsPanel'
import './RightSidebar.css'

type Props = {
  state: MicState
  reading: LivePitchReading
  deviceLabel: string | null
  diagnostics: MicDiagnostics | null
}

export function RightSidebar(props: Props) {
  return (
    <div className="right-side">
      <div className="right-side__heading">Diagnostics</div>
      <div className="right-side__body">
        <DiagnosticsPanel {...props} />
      </div>
    </div>
  )
}
