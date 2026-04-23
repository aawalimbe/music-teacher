import { useMemo } from 'react'
import { midiToNoteName } from '../music'
import type { InstrumentDef, TuningTarget } from '../instruments'

type Props = {
  def: InstrumentDef
  detectedMidi: number | null
  // Lesson target — if set, every position where this MIDI lives is drawn as a
  // hollow "target" marker. When the user plays the right note, the detected
  // marker overlays the target so the two visuals merge (outline + filled).
  targetMidi?: number | null
  hand: 'right' | 'left'
  fretCount?: number
}

// SVG geometry (viewBox units). Actual rendered size is CSS-driven.
const WIDTH = 820
const HEIGHT_PER_STRING = 28
const TOP_PAD = 22
const BOTTOM_PAD = 24 // leaves room for fret numbers
const LEFT_PAD = 44 // leaves room for string labels on RH
const RIGHT_PAD = 44 // leaves room for string labels on LH
const INLAY_FRETS_SINGLE = [3, 5, 7, 9]
const INLAY_FRET_DOUBLE = 12

export function Fretboard({
  def,
  detectedMidi,
  targetMidi = null,
  hand,
  fretCount = 12,
}: Props) {
  // Draw strings top-to-bottom in physical order from player's POV:
  // thickest (lowest pitch, highest stringIndex) on top, thinnest on bottom.
  const strings = useMemo<TuningTarget[]>(
    () =>
      [...def.tuningTargets].sort(
        (a, b) => (b.stringIndex ?? 0) - (a.stringIndex ?? 0),
      ),
    [def],
  )

  const stringCount = strings.length
  const height = TOP_PAD + BOTTOM_PAD + (stringCount - 1) * HEIGHT_PER_STRING
  const boardLeft = LEFT_PAD
  const boardRight = WIDTH - RIGHT_PAD
  const boardTop = TOP_PAD
  const boardBottom = height - BOTTOM_PAD
  const boardWidth = boardRight - boardLeft
  const fretWidth = boardWidth / fretCount
  const mirror = (x: number): number =>
    hand === 'right' ? x : boardLeft + boardRight - x

  // x for the vertical line of fret N (N=0 is the nut).
  const xForFretLine = (fret: number): number => mirror(boardLeft + fret * fretWidth)
  // x for a position marker on fret N (open: just past the nut; fretted: center of the fret).
  const xForPosition = (fret: number): number => {
    if (fret === 0) return mirror(boardLeft - 14)
    return mirror(boardLeft + (fret - 0.5) * fretWidth)
  }
  const yForString = (idx: number): number => boardTop + idx * HEIGHT_PER_STRING
  const midY = (boardTop + boardBottom) / 2

  // Enumerate every {string, fret} position that produces the given MIDI.
  // Inlined per useMemo so deps are stable primitives/arrays.
  const highlights = useMemo(() => {
    if (detectedMidi == null) return [] as Array<{ stringIdx: number; fret: number }>
    const hits: Array<{ stringIdx: number; fret: number }> = []
    for (let i = 0; i < strings.length; i++) {
      const fret = detectedMidi - strings[i].midi
      if (fret >= 0 && fret <= fretCount) hits.push({ stringIdx: i, fret })
    }
    return hits
  }, [detectedMidi, strings, fretCount])

  const targets = useMemo(() => {
    if (targetMidi == null) return [] as Array<{ stringIdx: number; fret: number }>
    const hits: Array<{ stringIdx: number; fret: number }> = []
    for (let i = 0; i < strings.length; i++) {
      const fret = targetMidi - strings[i].midi
      if (fret >= 0 && fret <= fretCount) hits.push({ stringIdx: i, fret })
    }
    return hits
  }, [targetMidi, strings, fretCount])

  const noteLabel = detectedMidi != null ? midiToNoteName(detectedMidi) : null

  return (
    <svg
      className="fretboard"
      viewBox={`0 0 ${WIDTH} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={
        hand === 'right'
          ? 'Right-handed fretboard, first-person view'
          : 'Left-handed fretboard, first-person view (mirrored)'
      }
    >
      {/* fretboard surface */}
      <rect
        x={boardLeft}
        y={boardTop - 4}
        width={boardWidth}
        height={boardBottom - boardTop + 8}
        rx={3}
        className="fretboard__surface"
      />

      {/* inlay dots (centered in fret spaces) */}
      {INLAY_FRETS_SINGLE.map((f) => (
        <circle
          key={`inlay-${f}`}
          cx={xForPosition(f)}
          cy={midY}
          r={5}
          className="fretboard__inlay"
        />
      ))}
      {/* double inlay at fret 12 */}
      <circle
        cx={xForPosition(INLAY_FRET_DOUBLE)}
        cy={boardTop + (boardBottom - boardTop) * 0.3}
        r={5}
        className="fretboard__inlay"
      />
      <circle
        cx={xForPosition(INLAY_FRET_DOUBLE)}
        cy={boardTop + (boardBottom - boardTop) * 0.7}
        r={5}
        className="fretboard__inlay"
      />

      {/* fret wires (0 = nut, thicker) */}
      {Array.from({ length: fretCount + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={xForFretLine(i)}
          x2={xForFretLine(i)}
          y1={boardTop - 4}
          y2={boardBottom + 4}
          className={i === 0 ? 'fretboard__nut' : 'fretboard__fret'}
        />
      ))}

      {/* strings */}
      {strings.map((s, idx) => (
        <line
          key={`str-${s.label}`}
          x1={boardLeft}
          x2={boardRight}
          y1={yForString(idx)}
          y2={yForString(idx)}
          className="fretboard__string"
          // thicker strokes for lower (thicker) strings
          strokeWidth={1 + (stringCount - idx - 1) * 0.35}
        />
      ))}

      {/* string labels (outside the nut — left on RH, right on LH) */}
      {strings.map((s, idx) => (
        <text
          key={`label-${s.label}`}
          x={hand === 'right' ? boardLeft - 22 : boardRight + 22}
          y={yForString(idx) + 4}
          textAnchor="middle"
          className="fretboard__string-label"
        >
          {s.shortLabel}
        </text>
      ))}

      {/* fret numbers below the board */}
      {Array.from({ length: fretCount }, (_, i) => i + 1).map((f) => (
        <text
          key={`fnum-${f}`}
          x={xForPosition(f)}
          y={boardBottom + 16}
          textAnchor="middle"
          className="fretboard__fret-number"
        >
          {f}
        </text>
      ))}

      {/* target markers (lesson mode) — hollow outlines at every position for the target */}
      {targets.map(({ stringIdx, fret }) => (
        <circle
          key={`target-${strings[stringIdx].label}-${fret}`}
          cx={xForPosition(fret)}
          cy={yForString(stringIdx)}
          r={13}
          className="fretboard__target-dot"
        />
      ))}

      {/* detected-note highlights — show at EVERY matching position */}
      {highlights.map(({ stringIdx, fret }) => (
        <g
          key={`hl-${strings[stringIdx].label}-${fret}`}
          className="fretboard__highlight"
        >
          <circle
            cx={xForPosition(fret)}
            cy={yForString(stringIdx)}
            r={12}
            className="fretboard__highlight-dot"
          />
          {noteLabel && (
            <text
              x={xForPosition(fret)}
              y={yForString(stringIdx) + 4}
              textAnchor="middle"
              className="fretboard__highlight-label"
            >
              {noteLabel}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
