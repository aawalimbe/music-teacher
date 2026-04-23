import {
  frequencyToSargam,
  hzToMidi,
  midiToNoteName,
  saMidiForMode,
  SAPTAK_COMBINING,
  swaraLabel,
} from '../music'
import { getInstrumentDef } from '../instruments'
import { useSettings } from '../store'
import { useStickyPitch, type LivePitchReading, type MicState } from '../audio'
import { Fretboard } from './Fretboard'
import { Keyboard } from './Keyboard'
import './DiagramTab.css'
import './Fretboard.css'
import './Keyboard.css'

type Props = {
  state: MicState
  reading: LivePitchReading
}

export function DiagramTab({ state, reading }: Props) {
  const { instrument, handedness, saMode, fixedSaMidi, movableSaHz, sargamScript } =
    useSettings()
  const def = getInstrumentDef(instrument)
  const saMidi = saMidiForMode(saMode, fixedSaMidi, movableSaHz)

  // Sticky swara for the caption so it doesn't flicker mid-sustain.
  const sticky = useStickyPitch(reading.frequency, saMidi)

  // Current MIDI for position highlighting. Taken raw from the current reading —
  // we want the diagram to track the live pitch without latching, since "how fast
  // does the highlight move" is itself useful information on a diagram.
  const detectedMidi =
    state === 'active' && reading.frequency != null
      ? Math.round(hzToMidi(reading.frequency))
      : null

  // Caption: what swara + Western note the user is playing. Uses the sticky result
  // so the caption doesn't flash between frames.
  const captionSargam =
    sticky?.kind === 'in_range'
      ? {
          swara: swaraLabel(sticky.swara, sargamScript),
          octave: sticky.octave,
          glyph: SAPTAK_COMBINING[sticky.octave],
        }
      : null
  const captionWestern =
    detectedMidi != null ? midiToNoteName(detectedMidi, sargamScript) : null

  // Precompute an in-range check purely for caption context, not for highlighting.
  void frequencyToSargam // referenced indirectly via useStickyPitch

  return (
    <div className="diagram">
      <div className="diagram__caption">
        {state !== 'active' ? (
          <span className="diagram__caption-text">
            Start listening to see notes light up on the diagram.
          </span>
        ) : captionWestern == null ? (
          <span className="diagram__caption-text diagram__caption-text--dim">
            Listening… play a note.
          </span>
        ) : (
          <>
            <span className="diagram__caption-label">Playing:</span>
            {captionSargam && (
              <span className="diagram__caption-swara">
                {captionSargam.swara}
                {captionSargam.glyph}
              </span>
            )}
            <span className="diagram__caption-western">({captionWestern})</span>
          </>
        )}
      </div>

      <div className="diagram__svg-wrap">
        {def.kind === 'fretted' ? (
          <Fretboard def={def} detectedMidi={detectedMidi} hand={handedness} />
        ) : (
          <Keyboard detectedMidi={detectedMidi} />
        )}
      </div>

      {def.kind === 'fretted' && (
        <p className="diagram__note note">
          {handedness === 'right' ? 'Right-handed' : 'Left-handed'} view, looking down
          at your own instrument. The detected note is highlighted at every position
          where it lives on the fretboard.
        </p>
      )}
    </div>
  )
}
