import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Instrument = 'acoustic_guitar' | 'ukulele' | 'keyboard' | 'harmonium'
export type Handedness = 'right' | 'left'
export type SaMode = 'fixed' | 'movable'
export type SargamScript = 'latin' | 'devanagari'

export const FRETTED_INSTRUMENTS: ReadonlySet<Instrument> = new Set([
  'acoustic_guitar',
  'ukulele',
])

type SettingsData = {
  instrument: Instrument
  handedness: Handedness
  saMode: SaMode
  fixedSaMidi: number
  movableSaHz: number | null
  sargamScript: SargamScript
  tunerGreenCents: number
  tunerYellowCents: number
  lessonCents: number
}

type SettingsActions = {
  setInstrument: (i: Instrument) => void
  setHandedness: (h: Handedness) => void
  setSaMode: (m: SaMode) => void
  setFixedSaMidi: (midi: number) => void
  setMovableSaHz: (hz: number | null) => void
  setSargamScript: (s: SargamScript) => void
  setTunerGreenCents: (c: number) => void
  setTunerYellowCents: (c: number) => void
  setLessonCents: (c: number) => void
  resetToDefaults: () => void
}

export type SettingsState = SettingsData & SettingsActions

// Sa = C4 by convention (see docs/sargam-mapping.md §3a).
// Tolerances per docs/sprints.md cross-cutting concerns.
const DEFAULTS: SettingsData = {
  instrument: 'acoustic_guitar',
  handedness: 'right',
  saMode: 'fixed',
  fixedSaMidi: 60,
  movableSaHz: null,
  sargamScript: 'latin',
  tunerGreenCents: 10,
  tunerYellowCents: 25,
  lessonCents: 15,
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setInstrument: (instrument) => set({ instrument }),
      setHandedness: (handedness) => set({ handedness }),
      setSaMode: (saMode) => set({ saMode }),
      setFixedSaMidi: (fixedSaMidi) => set({ fixedSaMidi }),
      setMovableSaHz: (movableSaHz) => set({ movableSaHz }),
      setSargamScript: (sargamScript) => set({ sargamScript }),
      setTunerGreenCents: (tunerGreenCents) => set({ tunerGreenCents }),
      setTunerYellowCents: (tunerYellowCents) => set({ tunerYellowCents }),
      setLessonCents: (lessonCents) => set({ lessonCents }),
      resetToDefaults: () => set(DEFAULTS),
    }),
    {
      name: 'music-teacher-settings-v1',
      version: 1,
      partialize: (state): SettingsData => ({
        instrument: state.instrument,
        handedness: state.handedness,
        saMode: state.saMode,
        fixedSaMidi: state.fixedSaMidi,
        movableSaHz: state.movableSaHz,
        sargamScript: state.sargamScript,
        tunerGreenCents: state.tunerGreenCents,
        tunerYellowCents: state.tunerYellowCents,
        lessonCents: state.lessonCents,
      }),
    },
  ),
)

export { DEFAULTS as SETTINGS_DEFAULTS }
