import type { LivePitchReading, MicState } from '../audio'
import { useSettings } from '../store'
import { DiagramTab } from './DiagramTab'
import { LessonTab } from './LessonTab'
import { MicControl } from './MicControl'
import { PitchReadout } from './PitchReadout'
import { TunerView } from './TunerView'
import './MainPanel.css'

type Props = {
  state: MicState
  reading: LivePitchReading
  error: string | null
  deviceLabel: string | null
  onStart: () => void
  onStop: () => void
}

type Tab = { id: 'tuner' | 'readout' | 'diagram' | 'lesson'; label: string }
const TABS: ReadonlyArray<Tab> = [
  { id: 'tuner', label: 'Tuner' },
  { id: 'readout', label: 'Readout' },
  { id: 'diagram', label: 'Diagram' },
  { id: 'lesson', label: 'Lesson' },
]

export function MainPanel({
  state,
  reading,
  error,
  deviceLabel,
  onStart,
  onStop,
}: Props) {
  const { activeTab, setActiveTab } = useSettings()

  return (
    <div className="main-panel">
      <div className="main-panel__toolbar">
        <div className="main-panel__tabs" role="tablist" aria-label="View mode">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`main-tab ${activeTab === t.id ? 'main-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <MicControl
          state={state}
          error={error}
          onStart={onStart}
          onStop={onStop}
          rms={reading.rms}
          deviceLabel={deviceLabel}
        />
      </div>

      <div className="main-panel__body">
        {activeTab === 'tuner' && <TunerView state={state} reading={reading} />}
        {activeTab === 'readout' && <PitchReadout state={state} reading={reading} />}
        {activeTab === 'diagram' && <DiagramTab state={state} reading={reading} />}
        {activeTab === 'lesson' && <LessonTab state={state} reading={reading} />}
      </div>
    </div>
  )
}
