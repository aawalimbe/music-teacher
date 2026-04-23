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
  // UI layout state — persisted so the user's collapsed/expanded preference
  // survives reloads.
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  activeTab: 'tuner' | 'readout' | 'diagram' | 'lesson'
  // Lesson progress — IDs of levels the user has passed (5-in-a-row).
  completedLevels: readonly string[]
  // Which level the lesson runner is currently on (null = auto-pick next incomplete).
  currentLevelId: string | null
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
  setLeftSidebarOpen: (open: boolean) => void
  setRightSidebarOpen: (open: boolean) => void
  setActiveTab: (t: 'tuner' | 'readout' | 'diagram' | 'lesson') => void
  markLevelComplete: (levelId: string) => void
  setCurrentLevel: (levelId: string | null) => void
  resetLessonProgress: () => void
  resetToDefaults: () => void
}

export type SettingsState = SettingsData & SettingsActions

// Sa = C4 by convention (see docs/sargam-mapping.md §3a).
// Tolerances per docs/sprints.md cross-cutting concerns.
// Sidebar defaults: left open, right collapsed on initial load (mobile vs desktop
// is handled at the CSS level — user toggles persist via localStorage either way).
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
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  activeTab: 'tuner',
  completedLevels: [],
  currentLevelId: null,
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
      setLeftSidebarOpen: (leftSidebarOpen) => set({ leftSidebarOpen }),
      setRightSidebarOpen: (rightSidebarOpen) => set({ rightSidebarOpen }),
      setActiveTab: (activeTab) => set({ activeTab }),
      markLevelComplete: (levelId) =>
        set((s) => {
          if (s.completedLevels.includes(levelId)) return {}
          return { completedLevels: [...s.completedLevels, levelId] }
        }),
      setCurrentLevel: (currentLevelId) => set({ currentLevelId }),
      resetLessonProgress: () => set({ completedLevels: [], currentLevelId: null }),
      resetToDefaults: () => set(DEFAULTS),
    }),
    {
      name: 'music-teacher-settings-v1',
      // Bump when SettingsData shape changes. Without a migrate fn the older
      // stored state is discarded and DEFAULTS take over — fine for a personal
      // project; one manual re-pick of instrument/handedness is acceptable.
      version: 3,
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
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        activeTab: state.activeTab,
        completedLevels: state.completedLevels,
        currentLevelId: state.currentLevelId,
      }),
    },
  ),
)

export { DEFAULTS as SETTINGS_DEFAULTS }
