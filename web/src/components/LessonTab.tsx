import { useEffect, useMemo, useRef, useState } from 'react'
import {
  centsOffset,
  hzToMidi,
  midiToHz,
  midiToNoteName,
  SAPTAK_COMBINING,
  sargamToMidi,
  saMidiForMode,
  swaraLabel,
} from '../music'
import {
  isUnlocked,
  LEVEL_PASS_STREAK,
  LEVELS,
  nextIncompleteLevel,
  findLevel,
  type Level,
} from '../curriculum'
import { getInstrumentDef } from '../instruments'
import { useSettings } from '../store'
import type { LivePitchReading, MicState } from '../audio'
import { Fretboard } from './Fretboard'
import { Keyboard } from './Keyboard'
import './DiagramTab.css'
import './Fretboard.css'
import './Keyboard.css'
import './LessonTab.css'

type Props = {
  state: MicState
  reading: LivePitchReading
}

// Runtime rate matches useLivePitch's DEFAULT_UPDATE_HZ.
const UPDATE_HZ = 30
const SUSTAIN_MS = 300
const FRAMES_NEEDED = Math.ceil((SUSTAIN_MS / 1000) * UPDATE_HZ)
const AMBIGUOUS_CENTS = 200

export function LessonTab({ state, reading }: Props) {
  const {
    instrument,
    handedness,
    saMode,
    fixedSaMidi,
    movableSaHz,
    sargamScript,
    lessonCents,
    completedLevels,
    currentLevelId,
    setCurrentLevel,
    markLevelComplete,
  } = useSettings()

  const def = getInstrumentDef(instrument)
  const saMidi = saMidiForMode(saMode, fixedSaMidi, movableSaHz)

  const completed = useMemo(() => new Set(completedLevels), [completedLevels])

  const activeLevel: Level = useMemo(() => {
    if (currentLevelId) {
      const lvl = findLevel(currentLevelId)
      if (lvl) return lvl
    }
    return nextIncompleteLevel(completed)
  }, [currentLevelId, completed])

  const targetMidi = saMidi != null ? sargamToMidi(activeLevel.target, saMidi) : null

  // Detected MIDI for diagram highlighting (raw, not sticky — want responsive feedback).
  const detectedMidi =
    state === 'active' && reading.frequency != null
      ? Math.round(hzToMidi(reading.frequency))
      : null

  // Sustained-match state machine driven by reading updates.
  //   framesRef   : consecutive in-tolerance frames (mutated at 30 Hz, no need to re-render).
  //   cooldown    : after a match fires, block further matches until pitch leaves tolerance.
  //                 Kept in state so the feedback text can read it during render.
  //   correctCount: times the user hit the target this level.
  //   progress    : 0-1 hold-progress for the progress bar.
  // Reading updates drive the effect below; the set-state-in-effect pattern is
  // exactly the "subscribe to external events" case the rule acknowledges, so the
  // per-call eslint suppressions carry that reason.
  const framesRef = useRef(0)
  const [cooldown, setCooldown] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (state !== 'active' || targetMidi == null || reading.frequency == null) {
      framesRef.current = 0
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCooldown(false)
      setProgress(0)
      return
    }

    const cents = Math.abs(centsOffset(reading.frequency, midiToHz(targetMidi)))
    const within = cents <= lessonCents

    if (!within) {
      framesRef.current = 0
      setCooldown(false)
      setProgress(0)
      return
    }

    if (cooldown) return

    framesRef.current += 1
    setProgress(Math.min(1, framesRef.current / FRAMES_NEEDED))

    if (framesRef.current >= FRAMES_NEEDED) {
      framesRef.current = 0
      setCooldown(true)
      setProgress(0)
      setCorrectCount((c) => c + 1)
    }
  }, [reading, state, targetMidi, lessonCents, cooldown])

  // Reset when target changes (new level picked).
  useEffect(() => {
    framesRef.current = 0
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCooldown(false)
    setCorrectCount(0)
    setProgress(0)
  }, [activeLevel.id])

  // Persist completion when the streak is reached.
  const levelComplete = correctCount >= LEVEL_PASS_STREAK
  useEffect(() => {
    if (levelComplete) markLevelComplete(activeLevel.id)
  }, [levelComplete, activeLevel.id, markLevelComplete])

  function advanceToNext() {
    const nextLevel = nextIncompleteLevel(new Set([...completed, activeLevel.id]))
    setCurrentLevel(nextLevel.id)
  }

  const targetSwaraLabel = swaraLabel(activeLevel.target.swara, sargamScript)
  const targetOctaveGlyph = SAPTAK_COMBINING[activeLevel.target.octave]
  const targetWestern = targetMidi != null ? midiToNoteName(targetMidi, sargamScript) : '—'

  const centsFromTarget =
    reading.frequency != null && targetMidi != null
      ? centsOffset(reading.frequency, midiToHz(targetMidi))
      : null

  const feedback = buildFeedback({
    state,
    saMidi,
    targetMidi,
    frequency: reading.frequency,
    centsFromTarget,
    tolerance: lessonCents,
    progress,
    cooldown,
    levelComplete,
    targetLabel: targetSwaraLabel,
  })

  return (
    <div className="lesson">
      {saMidi == null ? (
        <div className="lesson__sa-warning">
          Set your Sa in the sidebar (Movable Sa needs calibration) before starting lessons.
        </div>
      ) : null}

      <div className="lesson__split">
        <div className="lesson__target-pane">
          <div className="lesson__level-name">{activeLevel.name}</div>
          <div className="lesson__target-big">
            <span className="lesson__target-swara">
              {targetSwaraLabel}
              {targetOctaveGlyph}
            </span>
            <span className="lesson__target-western">({targetWestern})</span>
          </div>

          <div
            className="lesson__progress"
            aria-label={`${correctCount} of ${LEVEL_PASS_STREAK} correct`}
          >
            {Array.from({ length: LEVEL_PASS_STREAK }, (_, i) => (
              <div
                key={i}
                className={`lesson__dot ${i < correctCount ? 'lesson__dot--filled' : ''}`}
              />
            ))}
          </div>

          <div className="lesson__hold">
            <div
              className="lesson__hold-bar"
              style={{ width: `${progress * 100}%` }}
              aria-hidden
            />
          </div>

          <p className={`lesson__feedback ${feedback.tone ? `lesson__feedback--${feedback.tone}` : ''}`}>
            {feedback.text}
          </p>

          {levelComplete && (
            <div className="lesson__complete">
              <p className="lesson__complete-title">Level complete</p>
              <button type="button" className="pill pill--selected" onClick={advanceToNext}>
                Next level
              </button>
            </div>
          )}
        </div>

        <div className="lesson__diagram-pane">
          {def.kind === 'fretted' ? (
            <Fretboard
              def={def}
              detectedMidi={detectedMidi}
              targetMidi={targetMidi}
              hand={handedness}
            />
          ) : (
            <Keyboard detectedMidi={detectedMidi} targetMidi={targetMidi} />
          )}
        </div>
      </div>

      <div className="lesson__selector" role="tablist" aria-label="Levels">
        {LEVELS.map((lvl) => {
          const unlocked = isUnlocked(lvl, completed)
          const done = completed.has(lvl.id)
          const current = lvl.id === activeLevel.id
          const cls = [
            'lesson__level',
            current ? 'lesson__level--current' : '',
            done ? 'lesson__level--done' : '',
            !unlocked ? 'lesson__level--locked' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={lvl.id}
              type="button"
              role="tab"
              aria-selected={current}
              className={cls}
              onClick={() => unlocked && setCurrentLevel(lvl.id)}
              disabled={!unlocked}
              title={unlocked ? lvl.name : 'Locked — pass earlier levels first'}
            >
              <span>{lvl.name.split(' ')[0]}</span>
              <span className="lesson__level-mark">
                {done ? '✓' : !unlocked ? '🔒' : ''}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type FeedbackArgs = {
  state: MicState
  saMidi: number | null
  targetMidi: number | null
  frequency: number | null
  centsFromTarget: number | null
  tolerance: number
  progress: number
  cooldown: boolean
  levelComplete: boolean
  targetLabel: string
}

type Feedback = {
  text: string
  tone?: 'good' | 'flat' | 'sharp' | 'dim'
}

function buildFeedback(a: FeedbackArgs): Feedback {
  if (a.levelComplete) return { text: 'Level complete — tap Next.', tone: 'good' }
  if (a.state !== 'active') return { text: 'Tap Listen above to start.', tone: 'dim' }
  if (a.saMidi == null) return { text: 'Calibrate Sa first.', tone: 'dim' }
  if (a.frequency == null || a.centsFromTarget == null) {
    return { text: `Play ${a.targetLabel}.`, tone: 'dim' }
  }
  const absC = Math.abs(a.centsFromTarget)
  if (absC <= a.tolerance) {
    if (a.cooldown) return { text: `Nice. Move off and play ${a.targetLabel} again.`, tone: 'good' }
    if (a.progress > 0) return { text: 'Hold it…', tone: 'good' }
    return { text: 'Hold it…', tone: 'good' }
  }
  if (absC > AMBIGUOUS_CENTS) {
    return { text: `Try ${a.targetLabel}.`, tone: 'dim' }
  }
  return a.centsFromTarget < 0
    ? { text: 'A bit flat.', tone: 'flat' }
    : { text: 'A bit sharp.', tone: 'sharp' }
}
