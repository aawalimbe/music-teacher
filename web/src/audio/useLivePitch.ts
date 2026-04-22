import { useCallback, useEffect, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'

export type MicState = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

export type LivePitchReading = {
  frequency: number | null
  clarity: number | null
  rms: number | null
}

export type UseLivePitch = {
  state: MicState
  reading: LivePitchReading
  error: string | null
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
const DEFAULT_RMS = 0.01
const DEFAULT_CLARITY = 0.8
const DEFAULT_BUFFER_SIZE = 2048

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
  }, [])

  const start = useCallback(async () => {
    if (sessionRef.current) return
    setError(null)
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = bufferSize
      source.connect(analyser)

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

  return { state, reading, error, start, stop }
}
