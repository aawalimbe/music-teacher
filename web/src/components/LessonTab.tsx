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
  GROUP_LABEL,
  GROUP_ORDER,
  LEVEL_PASS_STREAK,
  LEVELS,
  findLevel,
  groupOf,
  nextIncompleteLevel,
  type Level,
  type LevelGroup,
  type LessonTarget,
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

  // Sticky active level — only changes on explicit user action.
  const [activeLevelId, setActiveLevelIdLocal] = useState<string>(() => {
    const persisted = currentLevelId ? findLevel(currentLevelId) : null
    if (persisted && !completed.has(persisted.id)) return persisted.id
    return nextIncompleteLevel(completed).id
  })

  const activeLevel: Level = useMemo(
    () => findLevel(activeLevelId) ?? nextIncompleteLevel(completed),
    [activeLevelId, completed],
  )

  function pickLevel(id: string) {
    setActiveLevelIdLocal(id)
    setCurrentLevel(id)
  }

  // ------------- Sequence-match state machine -------------
  // sequenceIndex: which target in the level we're currently waiting for.
  // framesRef: consecutive frames the current target has been within tolerance.
  // awaitingReleaseRef: set after a match, cleared as soon as we see a frame
  //   NOT within the new current-target's tolerance. Prevents a single held
  //   pluck from auto-advancing through repeated targets like "Sa Sa".
  // correctCount: number of complete sequences this level.
  // progress: 0-1 hold-progress bar for the current position.
  const [sequenceIndex, setSequenceIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [awaitingRelease, setAwaitingRelease] = useState(false)
  const framesRef = useRef(0)

  const currentTarget: LessonTarget | undefined = activeLevel.targets[sequenceIndex]
  const currentTargetMidi =
    saMidi != null && currentTarget ? sargamToMidi(currentTarget, saMidi) : null

  // Detected MIDI for diagram highlighting (raw, not sticky — want responsive feedback).
  const detectedMidi =
    state === 'active' && reading.frequency != null
      ? Math.round(hzToMidi(reading.frequency))
      : null

  // Drives the state machine off every reading update. The set-state-in-effect
  // pattern here is the "subscribe to external events" case the rule exempts —
  // pitch detection is the external event, not derived state.
  useEffect(() => {
    if (
      state !== 'active' ||
      currentTargetMidi == null ||
      reading.frequency == null
    ) {
      framesRef.current = 0
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAwaitingRelease(false)
      setProgress(0)
      return
    }

    const cents = Math.abs(centsOffset(reading.frequency, midiToHz(currentTargetMidi)))
    const within = cents <= lessonCents

    if (!within) {
      framesRef.current = 0
      setAwaitingRelease(false) // release observed
      setProgress(0)
      return
    }

    if (awaitingRelease) return // just matched prior target; wait for release

    framesRef.current += 1
    setProgress(Math.min(1, framesRef.current / FRAMES_NEEDED))

    if (framesRef.current >= FRAMES_NEEDED) {
      framesRef.current = 0
      setAwaitingRelease(true)
      setProgress(0)

      const nextIdx = sequenceIndex + 1
      if (nextIdx >= activeLevel.targets.length) {
        // Full sequence completed — count 1, loop back to start.
        setCorrectCount((c) => c + 1)
        setSequenceIndex(0)
      } else {
        setSequenceIndex(nextIdx)
      }
    }
  }, [reading, state, currentTargetMidi, lessonCents, sequenceIndex, activeLevel.targets.length, awaitingRelease])

  // Reset all counters when the user switches level.
  useEffect(() => {
    framesRef.current = 0
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAwaitingRelease(false)
    setSequenceIndex(0)
    setCorrectCount(0)
    setProgress(0)
  }, [activeLevel.id])

  const levelComplete = correctCount >= LEVEL_PASS_STREAK
  useEffect(() => {
    if (levelComplete) markLevelComplete(activeLevel.id)
  }, [levelComplete, activeLevel.id, markLevelComplete])

  function advanceToNext() {
    const nextLevel = nextIncompleteLevel(new Set([...completed, activeLevel.id]))
    pickLevel(nextLevel.id)
  }

  const centsFromTarget =
    reading.frequency != null && currentTargetMidi != null
      ? centsOffset(reading.frequency, midiToHz(currentTargetMidi))
      : null

  const currentTargetLabel = currentTarget
    ? swaraLabel(currentTarget.swara, sargamScript) + SAPTAK_COMBINING[currentTarget.octave]
    : '—'

  const feedback = buildFeedback({
    state,
    saMidi,
    frequency: reading.frequency,
    centsFromTarget,
    tolerance: lessonCents,
    progress,
    awaitingRelease,
    levelComplete,
    targetLabel: currentTargetLabel,
    sequenceLength: activeLevel.targets.length,
  })

  // ------- Grouped level picker: flat list split into semantic sections -------
  const levelsByGroup = useMemo(() => {
    const map = new Map<LevelGroup, Level[]>()
    for (const lvl of LEVELS) {
      const g = groupOf(lvl)
      const list = map.get(g)
      if (list) list.push(lvl)
      else map.set(g, [lvl])
    }
    return map
  }, [])

  return (
    <div className="lesson">
      {saMidi == null && (
        <div className="lesson__sa-warning">
          Set your Sa in the sidebar (Movable Sa needs calibration) before starting lessons.
        </div>
      )}

      <div className="lesson__split">
        <div className="lesson__target-pane">
          <div className="lesson__level-name">{activeLevel.name}</div>

          <SequenceDisplay
            level={activeLevel}
            sequenceIndex={sequenceIndex}
            sargamScript={sargamScript}
            saMidi={saMidi}
          />

          <div
            className="lesson__progress"
            aria-label={`${correctCount} of ${LEVEL_PASS_STREAK} complete`}
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
              targetMidi={currentTargetMidi}
              hand={handedness}
            />
          ) : (
            <Keyboard detectedMidi={detectedMidi} targetMidi={currentTargetMidi} />
          )}
        </div>
      </div>

      <div className="lesson__selector-scroll">
        {GROUP_ORDER.map((grp) => {
          const levels = levelsByGroup.get(grp)
          if (!levels || levels.length === 0) return null
          return (
            <section key={grp} className="lesson__group">
              <h4 className="lesson__group-title">{GROUP_LABEL[grp]}</h4>
              <div className="lesson__group-list" role="radiogroup" aria-label={GROUP_LABEL[grp]}>
                {levels.map((lvl) => {
                  const done = completed.has(lvl.id)
                  const current = lvl.id === activeLevel.id
                  const cls = [
                    'lesson__level',
                    current ? 'lesson__level--current' : '',
                    done ? 'lesson__level--done' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      role="radio"
                      aria-checked={current}
                      className={cls}
                      onClick={() => pickLevel(lvl.id)}
                      title={lvl.name}
                    >
                      <span className="lesson__level-label">{lvl.name}</span>
                      {done && <span className="lesson__level-mark">✓</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type SeqDisplayProps = {
  level: Level
  sequenceIndex: number
  sargamScript: 'latin' | 'devanagari'
  saMidi: number | null
}

function SequenceDisplay({ level, sequenceIndex, sargamScript, saMidi }: SeqDisplayProps) {
  return (
    <div className="lesson__sequence" aria-label={`Target sequence ${level.name}`}>
      {level.targets.map((t, i) => {
        const isCurrent = i === sequenceIndex
        const isPast = i < sequenceIndex
        const cls = [
          'lesson__seq-item',
          isCurrent ? 'lesson__seq-item--current' : '',
          isPast ? 'lesson__seq-item--past' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const midi = saMidi != null ? sargamToMidi(t, saMidi) : null
        return (
          <span key={i} className={cls}>
            <span className="lesson__seq-swara">
              {swaraLabel(t.swara, sargamScript)}
              {SAPTAK_COMBINING[t.octave]}
            </span>
            {midi != null && (
              <span className="lesson__seq-western">
                {midiToNoteName(midi, sargamScript)}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feedback text
// ---------------------------------------------------------------------------

type FeedbackArgs = {
  state: MicState
  saMidi: number | null
  frequency: number | null
  centsFromTarget: number | null
  tolerance: number
  progress: number
  awaitingRelease: boolean
  levelComplete: boolean
  targetLabel: string
  sequenceLength: number
}

type Feedback = { text: string; tone?: 'good' | 'flat' | 'sharp' | 'dim' }

function buildFeedback(a: FeedbackArgs): Feedback {
  if (a.levelComplete) return { text: 'Level complete — tap Next.', tone: 'good' }
  if (a.state !== 'active') return { text: 'Tap Listen above to start.', tone: 'dim' }
  if (a.saMidi == null) return { text: 'Calibrate Sa first.', tone: 'dim' }
  if (a.frequency == null || a.centsFromTarget == null) {
    return { text: `Play ${a.targetLabel}.`, tone: 'dim' }
  }
  const absC = Math.abs(a.centsFromTarget)
  if (absC <= a.tolerance) {
    if (a.awaitingRelease) {
      return {
        text: a.sequenceLength > 1 ? `Great. Release and play the next.` : `Nice. Play again.`,
        tone: 'good',
      }
    }
    return { text: 'Hold it…', tone: 'good' }
  }
  if (absC > AMBIGUOUS_CENTS) {
    return { text: `Play ${a.targetLabel}.`, tone: 'dim' }
  }
  return a.centsFromTarget < 0
    ? { text: 'A bit flat.', tone: 'flat' }
    : { text: 'A bit sharp.', tone: 'sharp' }
}
