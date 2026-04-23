import { useMemo } from 'react'
import { midiToNoteName } from '../music'

type Props = {
  detectedMidi: number | null
  // Lesson-mode target: key is outlined in amber. When user plays it, the green
  // "active" fill overlays the amber outline so both stay visible together.
  targetMidi?: number | null
  // Default range: C3 (MIDI 48) through C5 (MIDI 72) — covers most sargam practice
  // notes when Sa is anywhere in the C3–C4 region.
  fromMidi?: number
  toMidi?: number
}

// Chromatic pitch classes — 0=C, 1=C#, 2=D, 3=D#, 4=E, 5=F, 6=F#, 7=G, 8=G#, 9=A, 10=A#, 11=B.
const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11])

const WHITE_KEY_WIDTH = 48
const WHITE_KEY_HEIGHT = 180
const BLACK_KEY_WIDTH = 30
const BLACK_KEY_HEIGHT = 110
const LABEL_PAD = 28

export function Keyboard({
  detectedMidi,
  targetMidi = null,
  fromMidi = 48,
  toMidi = 72,
}: Props) {
  const { whiteKeys, blackKeys } = useMemo(() => {
    const whites: number[] = []
    const blacks: number[] = []
    for (let m = fromMidi; m <= toMidi; m++) {
      if (WHITE_PCS.has(m % 12)) whites.push(m)
      else blacks.push(m)
    }
    return { whiteKeys: whites, blackKeys: blacks }
  }, [fromMidi, toMidi])

  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH
  const totalHeight = WHITE_KEY_HEIGHT + LABEL_PAD

  // x of a black key's left edge: it straddles the boundary between two whites,
  // centered on the fret-wire between its neighbors.
  function xForBlack(midi: number): number {
    const prevWhite = whiteKeys.filter((w) => w < midi).pop()
    if (prevWhite == null) return 0
    const prevWhiteIdx = whiteKeys.indexOf(prevWhite)
    return (prevWhiteIdx + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
  }

  const noteLabel = detectedMidi != null ? midiToNoteName(detectedMidi) : null

  return (
    <svg
      className="keyboard"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Keyboard diagram"
    >
      {/* white keys */}
      {whiteKeys.map((midi, idx) => {
        const active = midi === detectedMidi
        const isTarget = midi === targetMidi
        const cls = [
          'keyboard__white',
          active ? 'keyboard__white--active' : '',
          isTarget ? 'keyboard__white--target' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <g key={`w-${midi}`}>
            <rect
              x={idx * WHITE_KEY_WIDTH}
              y={0}
              width={WHITE_KEY_WIDTH}
              height={WHITE_KEY_HEIGHT}
              className={cls}
            />
            {/* C labels under every C key */}
            {midi % 12 === 0 && (
              <text
                x={idx * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2}
                y={WHITE_KEY_HEIGHT + 18}
                textAnchor="middle"
                className="keyboard__octave-label"
              >
                C{Math.floor(midi / 12) - 1}
              </text>
            )}
          </g>
        )
      })}

      {/* black keys drawn on top */}
      {blackKeys.map((midi) => {
        const active = midi === detectedMidi
        const isTarget = midi === targetMidi
        const cls = [
          'keyboard__black',
          active ? 'keyboard__black--active' : '',
          isTarget ? 'keyboard__black--target' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <rect
            key={`b-${midi}`}
            x={xForBlack(midi)}
            y={0}
            width={BLACK_KEY_WIDTH}
            height={BLACK_KEY_HEIGHT}
            className={cls}
          />
        )
      })}

      {/* active-key note label bubble */}
      {detectedMidi != null &&
        (() => {
          const isWhite = WHITE_PCS.has(detectedMidi % 12)
          let cx: number
          let cy: number
          if (isWhite) {
            const idx = whiteKeys.indexOf(detectedMidi)
            if (idx < 0) return null
            cx = idx * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2
            cy = WHITE_KEY_HEIGHT - 24
          } else {
            cx = xForBlack(detectedMidi) + BLACK_KEY_WIDTH / 2
            cy = BLACK_KEY_HEIGHT - 18
          }
          return (
            <g pointerEvents="none">
              <circle cx={cx} cy={cy} r={13} className="keyboard__highlight-bubble" />
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                className="keyboard__highlight-label"
              >
                {noteLabel}
              </text>
            </g>
          )
        })()}
    </svg>
  )
}
