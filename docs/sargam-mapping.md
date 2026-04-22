# Sargam mapping — the pitch math contract

This document defines the math and conventions used to convert between frequency, MIDI, and sargam (swara + octave). It is the contract that `web/src/music/` implements. All other modules — audio, components, instruments, curriculum — go through it.

> **Rule:** no other module may hardcode `A4 = 440`, convert Hz to swara, or compare pitches in cents. All of that lives here.

---

## 1. The twelve semitones and their sargam names

Indian music, like Western equal temperament, divides the octave into 12 equal semitones. Each semitone has a unique sargam label:

| Semitone above Sa | Name (Latin) | Short | Notes |
|---:|---|---|---|
| 0  | Sa           | `sa`       | Tonic. Always shuddha. |
| 1  | Komal Re     | `re_komal` | Flat Re. |
| 2  | Re           | `re`       | Shuddha. |
| 3  | Komal Ga     | `ga_komal` | Flat Ga. |
| 4  | Ga           | `ga`       | Shuddha. |
| 5  | Ma           | `ma`       | Shuddha. |
| 6  | Teevra Ma    | `ma_teevra`| Sharp Ma. The only teevra (raised) variant. |
| 7  | Pa           | `pa`       | Always shuddha. |
| 8  | Komal Dha    | `dha_komal`| Flat Dha. |
| 9  | Dha          | `dha`      | Shuddha. |
| 10 | Komal Ni     | `ni_komal` | Flat Ni. |
| 11 | Ni           | `ni`       | Shuddha. |

**Invariants:**

- Sa and Pa have **no** variants — they are always shuddha. The music layer must reject `sa_komal`, `pa_komal`, `pa_teevra`, etc. as invalid.
- Only Ma has a teevra variant. No `re_teevra`, `ga_teevra`, `dha_teevra`, `ni_teevra`.
- The 7 shuddha swaras are `sa`, `re`, `ga`, `ma`, `pa`, `dha`, `ni`.
- The 5 variant swaras are `re_komal`, `ga_komal`, `ma_teevra`, `dha_komal`, `ni_komal`.

## 2. Octaves (saptak)

Three octaves in v1, from lowest to highest:

| Octave | Name | Display glyph | Enum value |
|---|---|---|---|
| Lower  | Mandra | dot **below** the swara | `mandra` |
| Middle | Madhya | plain (no dot)          | `madhya` |
| Upper  | Taar   | dot **above** the swara | `taar`   |

**Rendering notes for the UI layer (not the music layer — but documented here for consistency):**

- Latin: use combining diacritics or CSS vertical offset. E.g., `Sa̠` (mandra), `Sa` (madhya), `Sȧ` (taar). Exact glyph choice is a Sprint 2/4 decision; mapping logic doesn't depend on it.
- Devanagari (future toggle): mandra = dot below the akshara, taar = dot above, madhya = plain.

Reserved but **not** implemented in v1: `ati_mandra` (two-lower), `ati_taar` (two-upper). The music layer's type system should be narrow and reject these until explicitly added.

## 3. Sa mode

Two modes, user-switchable at runtime. The music layer exposes a single getter `getSaMidi()` that returns the current MIDI number for madhya-Sa. Everything downstream reads through it.

### 3a. Fixed Sa

User picks a concert pitch for Sa at setup. Default: **Sa = C4 = MIDI 60**.

```
getSaMidi() = concertPitchMidi   // e.g. 60 for C4
```

### 3b. Movable Sa

User sets their Sa by playing/singing a reference tone, or by adjusting a slider. The picked frequency is quantized to the nearest semitone (we don't support microtonal Sa positions in v1 — that's a shruti-level feature and deferred).

```
getSaMidi() = round(69 + 12 * log2(referenceHz / 440))
```

If the user later changes Sa, already-displayed swaras re-label automatically (they're derived from frequency + current Sa, not stored as absolutes).

## 4. MIDI ↔ frequency

Standard 12-TET, A4 = 440 Hz:

```
midiToHz(m)  = 440 * 2^((m - 69) / 12)
hzToMidi(hz) = 69 + 12 * log2(hz / 440)    // returns a float (cents precision)
```

A4 = 440 is the only magic pitch number in the whole project. It lives as a single `const A4_HZ = 440` in `web/src/music/tuning.ts`. Nothing else may reference 440 directly.

## 5. The core conversion: frequency → sargam

Given a detected frequency `hz` and the current `saMidi`:

1. Compute `midiFloat = hzToMidi(hz)`.
2. Compute `semitonesFromSa = midiFloat - saMidi`. This is a float; the fractional part is how far off we are from the nearest semitone.
3. Round to nearest integer: `n = round(semitonesFromSa)`.
4. Cents off: `centsOff = (semitonesFromSa - n) * 100`. Range roughly `-50` to `+50`.
5. Octave index: `octaveIndex = floor(n / 12)`; swara index within octave: `swaraIndex = n mod 12` (positive modulo — if `n = -3`, then `octaveIndex = -1`, `swaraIndex = 9`).
6. Look up swara name by `swaraIndex` in the table in Section 1.
7. Map `octaveIndex` to a saptak label:

| octaveIndex | saptak | notes |
|---:|---|---|
| -1 | mandra | |
|  0 | madhya | |
| +1 | taar   | |
| other | — | out of v1 range; return `null` or a sentinel. Don't silently clamp. |

Return:

```ts
{
  swara: SwaraName,          // e.g. 'ga_komal'
  octave: Saptak,            // 'mandra' | 'madhya' | 'taar'
  centsOff: number,          // signed, in cents, range [-50, +50]
  frequency: number,         // echoed for debug
  midiFloat: number,         // echoed for debug
}
```

**Edge cases:**

- `hz <= 0` or NaN → return `null`. Callers treat `null` as "silence".
- `octaveIndex` outside `[-1, +1]` in v1 → return a typed out-of-range marker (don't throw). The UI shows "off range" or greys out the swara label.
- Extremely sharp inputs near the ±50-cent boundary: the rounding in step 3 handles this correctly (the float is equidistant from two semitones; JS `Math.round` rounds half-up to the higher, which is what we want — but document this explicitly so nobody "fixes" it to banker's rounding later).

## 6. The reverse: sargam → frequency

For the tuner, curriculum, and diagram highlighting, we need the opposite direction.

```
sargamToMidi({ swara, octave }, saMidi) = saMidi + 12 * octaveOffset(octave) + semitoneIndex(swara)
sargamToHz(sargam, saMidi) = midiToHz(sargamToMidi(sargam, saMidi))
```

where:

- `octaveOffset('mandra') = -1`, `octaveOffset('madhya') = 0`, `octaveOffset('taar') = +1`.
- `semitoneIndex` is the leftmost column in Section 1.

## 7. "In tune?" — cents-based comparison

Whether a detected pitch counts as matching a target is a simple `abs(centsOff) <= tolerance` check. The tolerance is **not** a constant in this module — it's read from the user settings store:

- Tuner green: `settings.tunerGreenCents` (default 10).
- Tuner yellow: `settings.tunerYellowCents` (default 25), above green.
- Lesson pass: `settings.lessonCents` (default 15).

The music module exposes a helper:

```ts
centsDistance(detectedHz: number, targetHz: number): number   // always ≥ 0
```

Comparison logic (pass/close/off, green/yellow/red) lives in the UI layer, not here.

## 8. Smoothing, silence, and clarity

Real-time pitch from `pitchy` is noisy. The music layer's conversion function is **pure and stateless** — it converts one frequency at a time. Smoothing is the audio layer's job, not the music layer's.

But there are two conventions the music layer enforces:

- `null` frequency in → `null` out. No imputation.
- The music layer does **not** filter by clarity or RMS — that's upstream in `web/src/audio/`. If a frequency arrives at the music layer, it's treated as valid.

## 9. Module shape

```
web/src/music/
├── index.ts            # public API re-exports
├── tuning.ts           # A4_HZ, midiToHz, hzToMidi, midi↔frequency primitives
├── sa.ts               # getSaMidi(), setSa(), mode logic, movable-Sa calibration
├── swaras.ts           # Swara type, semitoneIndex, table from Section 1
├── octaves.ts          # Saptak type, octaveOffset, display glyphs
├── convert.ts          # frequencyToSargam, sargamToHz, centsDistance
└── __tests__/          # unit tests for every function in this doc
```

**Public API** (re-exported from `index.ts`):

- Types: `Swara`, `Saptak`, `Sargam`, `FrequencyAnalysis`.
- Tuning: `midiToHz`, `hzToMidi`.
- Sa: `getSaMidi`, `setFixedSa`, `setMovableSaFromHz`.
- Convert: `frequencyToSargam`, `sargamToHz`, `sargamToMidi`, `centsDistance`.

Nothing else is exported.

## 10. Required tests (Sprint 2 gate)

The music module is the foundation for every later sprint. It must be unit-tested before it ships. Minimum test set:

- `midiToHz(69) === 440`, `hzToMidi(440) === 69`.
- `frequencyToSargam(440, saMidi: 60)` → `{ swara: 'dha', octave: 'madhya', centsOff: 0 }` (A4 is Dha in fixed Sa = C4).
- `frequencyToSargam(261.63, saMidi: 60)` → `{ swara: 'sa', octave: 'madhya', centsOff ≈ 0 }`.
- `frequencyToSargam(130.81, saMidi: 60)` → `{ swara: 'sa', octave: 'mandra', ... }`.
- `frequencyToSargam(523.25, saMidi: 60)` → `{ swara: 'sa', octave: 'taar', ... }`.
- Round-trip: `sargamToHz(frequencyToSargam(hz))` ≈ `hz` modulo cents quantization, for a sweep of frequencies.
- Komal/teevra: verify the 1/3/6/8/10 semitone offsets resolve correctly.
- Movable Sa: with Sa calibrated to F4 (MIDI 65), 440 Hz (A4) reads as Ga (madhya), not Dha. (Under fixed Sa = C4, 440 Hz is Dha. Same frequency, different label — this is the whole point of movable Sa.)
- Out-of-range: frequencies 4+ octaves from Sa return the typed out-of-range marker.
- Null input: `hz = null`, `hz = 0`, `hz = NaN` all return `null`.

## 11. Worked examples

For intuition, these are the frequencies of madhya-saptak shuddha swaras under fixed Sa = C4:

| Swara | Semitones above Sa | MIDI | Frequency (Hz) | Notes |
|---|---:|---:|---:|---|
| Sa  | 0  | 60 | 261.63 | C4 |
| Re  | 2  | 62 | 293.66 | D4 |
| Ga  | 4  | 64 | 329.63 | E4 |
| Ma  | 5  | 65 | 349.23 | F4 |
| Pa  | 7  | 67 | 392.00 | G4 |
| Dha | 9  | 69 | 440.00 | A4 |
| Ni  | 11 | 71 | 493.88 | B4 |

And the variants (madhya, fixed Sa = C4):

| Swara | Semitones | MIDI | Frequency (Hz) | Western |
|---|---:|---:|---:|---|
| Re komal     | 1  | 61 | 277.18 | C♯4/D♭4 |
| Ga komal     | 3  | 63 | 311.13 | D♯4/E♭4 |
| Ma teevra    | 6  | 66 | 369.99 | F♯4/G♭4 |
| Dha komal    | 8  | 68 | 415.30 | G♯4/A♭4 |
| Ni komal     | 10 | 70 | 466.16 | A♯4/B♭4 |

Under movable Sa (e.g., user sets Sa = 196 Hz ≈ G3), every value above shifts by a constant semitone offset. That's the only difference — the shape of the relationships is preserved.

## 12. What this document does NOT cover

- Ragas (which swaras are allowed in a given raga, aarohana/avarohana).
- Shruti (the 22-shruti microtonal system used in some Hindustani theory).
- Tala / rhythm.
- Chord theory (Sprint 7 will extend this doc or create `docs/chords.md`).
- Vocal-specific pitch handling (Sprint 11 — vibrato, sustain, syllabic alignment).

Those will live in their own docs when their sprints come up. This one stays focused on single-note pitch ↔ sargam math.
