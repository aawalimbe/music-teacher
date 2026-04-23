import { useLivePitch } from './audio'
import { Header } from './components/Header'
import { LeftSidebar } from './components/LeftSidebar'
import { MainPanel } from './components/MainPanel'
import { RightSidebar } from './components/RightSidebar'
import { Shell } from './components/Shell'
import './App.css'

function App() {
  // Hoisted here so MainPanel's tabs and RightSidebar's diagnostics share one session.
  const { state, reading, error, deviceLabel, diagnostics, start, stop } = useLivePitch()

  return (
    <Shell
      header={<Header />}
      left={<LeftSidebar />}
      main={
        <MainPanel
          state={state}
          reading={reading}
          error={error}
          deviceLabel={deviceLabel}
          onStart={start}
          onStop={stop}
        />
      }
      right={
        <RightSidebar
          state={state}
          reading={reading}
          deviceLabel={deviceLabel}
          diagnostics={diagnostics}
        />
      }
    />
  )
}

export default App
