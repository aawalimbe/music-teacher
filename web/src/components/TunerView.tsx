import { useEffect, useMemo, useState } from 'react'
import { centsOffset, midiToHz } from '../music'
import { getInstrumentDef, type TuningTarget } from '../instruments'
import { useSettings } from '../store'
import type { LivePitchReading, MicState } from '../audio'

type Props = {
  state: MicState
  reading: LivePitchReading
}

type Zone = 'green' | 'yellow' | 'red'

type Nearest = {
  target: TuningTarget
  targetHz: number
  cents: number // signed: negative = flat, positive = sharp
}

// Hard display clamp — anything further than ~2 semitones from every target is
// treated as "ambiguous: you're between targets, play closer to one".
const AMBIGUOUS_THRESHOLD_CENTS = 200

// Bar visualises ±50 ¢ (one full semitone above/below target).
const BAR_RANGE_CENTS = 50

export function TunerView({ state, reading }: Props) {
  const { instrument, tunerGreenCents, tunerYellowCents } = useSettings()
  const def = getInstrumentDef(instrument)

  const nearest = useMemo<Nearest | null>(() => {
    if (reading.frequency == null) return null
    let best: Nearest | null = null
    // Octave-aware match: compare the detected pitch AND its ±1-octave partners
    // against each target, picking whichever is closest. YIN often latches the
    // 2nd harmonic of a low guitar string (E2 heard as ~164 Hz, not 82) because
    // the harmonic is louder than the fundamental; this recovers the right string.
    // False positives are bounded by the 200¢ ambiguous threshold downstream.
    const candidates = [
      reading.frequency,
      reading.frequency / 2,
      reading.frequency * 2,
    ]
    for (const t of def.tuningTargets) {
      const targetHz = midiToHz(t.midi)
      let bestCents = Infinity
      for (const f of candidates) {
        const c = centsOffset(f, targetHz)
        if (Math.abs(c) < Math.abs(bestCents)) bestCents = c
      }
      if (best == null || Math.abs(bestCents) < Math.abs(best.cents)) {
        best = { target: t, targetHz, cents: bestCents }
      }
    }
    return best
  }, [reading.frequency, def])

  const ambiguous = nearest != null && Math.abs(nearest.cents) > AMBIGUOUS_THRESHOLD_CENTS
  const zone: Zone | null =
    nearest == null || ambiguous
      ? null
      : classifyZone(Math.abs(nearest.cents), tunerGreenCents, tunerYellowCents)

  // Latch "tuned this session" per string label — cleared on Reset.
  // This genuinely needs effect-driven accumulation across frames (can't be derived
  // from the current reading alone), so the set-state-in-effect rule doesn't apply.
  const [tunedSession, setTunedSession] = useState<ReadonlySet<string>>(new Set())
  useEffect(() => {
    if (nearest && !ambiguous && zone === 'green') {
      const label = nearest.target.label
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTunedSession((prev) => (prev.has(label) ? prev : new Set(prev).add(label)))
    }
  }, [nearest, ambiguous, zone])

  const resetSession = () => setTunedSession(new Set())

  if (state !== 'active') {
    return (
      <div className="tuner tuner--dim">
        <div className="tuner__placeholder">Start listening to use the tuner.</div>
      </div>
    )
  }

  return (
    <div className="tuner">
      <div className="tuner__needle-area">
        <div className="tuner__target">
          {nearest == null ? (
            <span className="tuner__target-label tuner__target-label--dim">—</span>
          ) : (
            <>
              <span className="tuner__target-label">{nearest.target.shortLabel}</span>
              {ambiguous && <span className="tuner__hint">between notes</span>}
            </>
          )}
        </div>

        <div
          className={`tuner__bar ${zone ? `tuner__bar--${zone}` : ''}`}
          style={barGradient(tunerGreenCents, tunerYellowCents)}
          aria-hidden
        >
          <div className="tuner__tick tuner__tick--left">−50¢</div>
          <div className="tuner__tick tuner__tick--center">0</div>
          <div className="tuner__tick tuner__tick--right">+50¢</div>
          {nearest != null && !ambiguous && (
            <div
              className="tuner__needle"
              style={{ left: `${needleLeftPct(nearest.cents)}%` }}
            />
          )}
        </div>

        <div className="tuner__cents-readout">
          {nearest == null
            ? 'play a note'
            : ambiguous
              ? `${signed(nearest.cents)} ¢ from ${nearest.target.shortLabel}`
              : zoneText(nearest.cents, zone)}
        </div>
      </div>

      <div className="tuner__strings">
        {def.tuningTargets.map((t) => {
          const active = nearest?.target.label === t.label
          const tuned = tunedSession.has(t.label)
          return (
            <div
              key={t.label}
              className={`string ${active ? 'string--active' : ''} ${tuned ? 'string--tuned' : ''}`}
              title={`${t.label} · ${midiToHz(t.midi).toFixed(2)} Hz`}
            >
              <span className="string__label">{t.shortLabel}</span>
              <span className="string__status">
                {tuned ? '✓' : active ? '●' : ''}
              </span>
            </div>
          )
        })}
        {tunedSession.size > 0 && (
          <button type="button" className="pill pill--small" onClick={resetSession}>
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

function classifyZone(absCents: number, green: number, yellow: number): Zone {
  if (absCents <= green) return 'green'
  if (absCents <= yellow) return 'yellow'
  return 'red'
}

function needleLeftPct(cents: number): number {
  const clamped = Math.max(-BAR_RANGE_CENTS, Math.min(BAR_RANGE_CENTS, cents))
  return 50 + (clamped / BAR_RANGE_CENTS) * 50
}

function signed(cents: number): string {
  const sign = cents >= 0 ? '+' : ''
  return `${sign}${cents.toFixed(0)}`
}

function zoneText(cents: number, zone: Zone | null): string {
  if (zone === 'green') return 'in tune'
  const direction = cents < 0 ? 'flat' : 'sharp'
  return `${signed(cents)} ¢ — ${direction}`
}

function barGradient(
  green: number,
  yellow: number,
): { background: string } {
  // Zones are user-configurable and painted on the fixed ±50 ¢ bar.
  const g = (Math.min(green, BAR_RANGE_CENTS) / BAR_RANGE_CENTS) * 50
  const y = (Math.min(yellow, BAR_RANGE_CENTS) / BAR_RANGE_CENTS) * 50
  const greenL = 50 - g
  const greenR = 50 + g
  const yellowL = 50 - y
  const yellowR = 50 + y
  return {
    background: `linear-gradient(to right,
      #3a1f1f 0%, #3a1f1f ${yellowL}%,
      #3a2e1d ${yellowL}%, #3a2e1d ${greenL}%,
      #1e3a22 ${greenL}%, #1e3a22 ${greenR}%,
      #3a2e1d ${greenR}%, #3a2e1d ${yellowR}%,
      #3a1f1f ${yellowR}%, #3a1f1f 100%)`,
  }
}
