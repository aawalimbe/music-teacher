import { LivePitchPanel, SettingsScreen } from './components'
import './App.css'

function App() {
  return (
    <main className="shell">
      <header className="shell__header">
        <h1>Music Teacher</h1>
        <p className="tagline">सा रे ग म प ध नि &middot; sargam-based, browser-first.</p>
      </header>

      <LivePitchPanel />

      <SettingsScreen />

      <footer className="shell__footer">
        <p className="note">
          Sprint 2 &middot; live pitch &rarr; swara readout. Tuner, diagrams, and lessons land in
          Sprints 3&ndash;5.
        </p>
      </footer>
    </main>
  )
}

export default App
