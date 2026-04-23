import { useCallback, useEffect, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'

export type MicState = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export type LivePitchReading = {
  frequency: number | null
  clarity: number | null
  rms: number | null
}

export type MicDiagnostics = {
  sampleRate: number
  bufferSize: number
  contextState: AudioContextState
  rmsThreshold: number
  clarityThreshold: number
  bandpassHighpassHz: number
  bandpassLowpassHz: number
}

export type UseLivePitch = {
  state: MicState
  reading: LivePitchReading
  error: string | null
  deviceLabel: string | null
  diagnostics: MicDiagnostics | null
  start: () => Promise<void>
  stop: () => void
}

export type UseLivePitchOptions = {
  // Target readout update rate. Higher = more responsive, more re-renders.
  updateHz?: number
  // Below this RMS, the hook reports silence (null frequency) instead of noise.
  rmsThreshold?: number
  // Below this clarity (0..1, pitchy's YIN confidence), frequency is suppressed.
  clarityThreshold?: number
  // Samples per pitch-detection window. 2048 @ 48 kHz ≈ 43 ms — good balance.
  bufferSize?: number
}

const DEFAULT_UPDATE_HZ = 30
// Laptop mics pick up acoustic instruments quietly, and low-E plucks peak around
// ~0.002-0.003 RMS after filtering. 0.002 catches those while still rejecting
// pure idle silence (~1e-5 after enhancements are disabled).
const DEFAULT_RMS = 0.002
// Acoustic guitar's harmonic content can briefly dip YIN clarity below 0.8.
// 0.6 is a reasonable floor before the result becomes unreliable.
const DEFAULT_CLARITY = 0.6
// 4096 samples @ 48 kHz ≈ 85 ms window — enough for clean detection of low E2 (82 Hz)
// at the cost of a little latency. Latency budget still inside the <50 ms target
// for the readout since we update at 30 Hz regardless.
const DEFAULT_BUFFER_SIZE = 4096

const INITIAL_READING: LivePitchReading = {
  frequency: null,
  clarity: null,
  rms: null,
}

type Session = {
  stream: MediaStream
  ctx: AudioContext
  analyser: AnalyserNode
  detector: PitchDetector<Float32Array<ArrayBuffer>>
  buffer: Float32Array<ArrayBuffer>
  rmsThreshold: number
  clarityThreshold: number
  minIntervalMs: number
  lastUpdate: number
  running: boolean
  rafId: number
}

export function useLivePitch(options: UseLivePitchOptions = {}): UseLivePitch {
  const {
    updateHz = DEFAULT_UPDATE_HZ,
    rmsThreshold = DEFAULT_RMS,
    clarityThreshold = DEFAULT_CLARITY,
    bufferSize = DEFAULT_BUFFER_SIZE,
  } = options

  const [state, setState] = useState<MicState>('idle')
  const [reading, setReading] = useState<LivePitchReading>(INITIAL_READING)
  const [error, setError] = useState<string | null>(null)
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<MicDiagnostics | null>(null)

  const sessionRef = useRef<Session | null>(null)

  const stop = useCallback(() => {
    const session = sessionRef.current
    sessionRef.current = null
    if (!session) return
    session.running = false
    if (session.rafId) cancelAnimationFrame(session.rafId)
    session.stream.getTracks().forEach((t) => t.stop())
    void session.ctx.close().catch(() => {})
    setState('idle')
    setReading(INITIAL_READING)
    setDeviceLabel(null)
    setDiagnostics(null)
  }, [])

  const start = useCallback(async () => {
    if (sessionRef.current) return
    setError(null)
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Keep echoCancellation/noiseSuppression off so pitch fidelity isn't munged,
          // but autoGainControl ON — laptop mics are too quiet for an acoustic guitar
          // 1-3 ft away without it, and dynamic compression doesn't affect pitch.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      })

      const ctx = new AudioContext()
      // Chromium-based browsers open AudioContexts in "suspended" state until a user
      // gesture resumes them. getUserMedia's grant counts as a gesture but doesn't
      // auto-resume — without this, the graph never processes and every frame reads zero.
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const source = ctx.createMediaStreamSource(stream)

      // Bandpass the signal before pitch detection so YIN works on the guitar-relevant
      // spectrum, not the full mic stream. 55 Hz gives E2 (82 Hz) clear headroom above
      // the corner — biquad filters have a gentle rolloff, not a brick wall, so 70 Hz
      // was attenuating E2 meaningfully. 55 Hz still rejects 50/60 Hz mains hum.
      // 2000 Hz keeps several harmonics for clarity-gated detection while rejecting
      // high-freq noise and stray transients.
      const highpass = ctx.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 55
      highpass.Q.value = 0.707 // Butterworth-ish, no resonance

      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 2000
      lowpass.Q.value = 0.707

      const analyser = ctx.createAnalyser()
      analyser.fftSize = bufferSize

      source.connect(highpass)
      highpass.connect(lowpass)
      lowpass.connect(analyser)

      const tracks = stream.getAudioTracks()
      if (tracks.length === 0) {
        throw new Error('mic stream returned no audio tracks')
      }
      setDeviceLabel(tracks[0].label || 'unnamed device')

      setDiagnostics({
        sampleRate: ctx.sampleRate,
        bufferSize,
        contextState: ctx.state,
        rmsThreshold,
        clarityThreshold,
        bandpassHighpassHz: highpass.frequency.value,
        bandpassLowpassHz: lowpass.frequency.value,
      })

      const detector = PitchDetector.forFloat32Array(bufferSize)
      // Pitchy rejects 0; it accepts (0, 1]. A tiny positive effectively disables its own
      // gating so every frame's real clarity flows through — we gate downstream to dim the
      // UI instead of silencing it.
      detector.clarityThreshold = 1e-9

      // Allocate over an explicit ArrayBuffer so the element type is narrowed for pitchy's API.
      const buffer = new Float32Array(new ArrayBuffer(bufferSize * Float32Array.BYTES_PER_ELEMENT))

      const session: Session = {
        stream,
        ctx,
        analyser,
        detector,
        buffer,
        rmsThreshold,
        clarityThreshold,
        minIntervalMs: 1000 / updateHz,
        lastUpdate: 0,
        running: true,
        rafId: 0,
      }
      sessionRef.current = session

      const tick = (now: number) => {
        if (!session.running) return
        if (now - session.lastUpdate >= session.minIntervalMs) {
          session.analyser.getFloatTimeDomainData(session.buffer)

          let sumSq = 0
          for (let i = 0; i < session.buffer.length; i++) {
            const s = session.buffer[i]
            sumSq += s * s
          }
          const rms = Math.sqrt(sumSq / session.buffer.length)

          if (rms < session.rmsThreshold) {
            setReading({ frequency: null, clarity: null, rms })
          } else {
            const [pitch, clarity] = session.detector.findPitch(
              session.buffer,
              session.ctx.sampleRate,
            )
            const frequency = clarity >= session.clarityThreshold ? pitch : null
            setReading({ frequency, clarity, rms })
          }
          session.lastUpdate = now
        }
        session.rafId = requestAnimationFrame(tick)
      }
      session.rafId = requestAnimationFrame(tick)
      setState('active')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setState('denied')
      } else {
        setState('error')
        setError(err instanceof Error ? err.message : String(err))
      }
    }
  }, [updateHz, rmsThreshold, clarityThreshold, bufferSize])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { state, reading, error, deviceLabel, diagnostics, start, stop }
}
