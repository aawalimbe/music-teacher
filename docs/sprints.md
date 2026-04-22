# Sprint plan

Sprint plan for Music Teacher. Split into **MVP sprints** (Sprints 1–5 — delivers roadmap steps 1–3) and **product sprints** (Sprints 6–11 — delivers roadmap steps 4–6, 8).

Each sprint is one coherent chunk of work, not a time-boxed week. Ship one before starting the next. "Done when" is the acceptance line — if those boxes aren't all checked, the sprint isn't done.

---

## Sprint 0 — Docs (current)

**Goal:** Align on architecture, domain rules, sprint plan, and pitch math before writing a single line of app code.

**Deliverables:**
- [x] `README.md`
- [x] `CLAUDE.md`
- [x] `docs/sprints.md` *(this file)*
- [x] `docs/sargam-mapping.md`
- [ ] `docs/architecture.md` *(can be deferred — CLAUDE.md covers most of it)*

**Done when:** the sprint plan and sargam-mapping doc are reviewed and agreed. Next is Sprint 1.

---

# MVP sprints

Target: a working web app that listens to a note and tells you the swara + octave, tunes your instrument, and runs a basic guided lesson on the 7 shuddha swaras in madhya saptak.

## Sprint 1 — Scaffold & settings

**Goal:** Boot an empty React app with the folder structure from CLAUDE.md, a settings screen, and persisted user preferences. No audio yet.

**Deliverables:**
- Vite + React + TypeScript (strict) project in `web/`.
- Dependencies: `react`, `zustand`, `pitchy`. (Pitchy installed but not wired up yet.)
- Folder skeleton: `audio/`, `music/`, `instruments/`, `curriculum/`, `components/`, `store/` — each with an `index.ts` placeholder.
- **Settings screen** with:
  - Instrument picker: acoustic guitar / ukulele / keyboard / harmonium.
  - Handedness toggle: right / left (hidden for keyboard & harmonium).
  - Sa mode: fixed (with concert-pitch picker, default C4) / movable (no picker yet — placeholder).
  - Sargam script: Latin (default) / Devanagari (placeholder toggle, Latin only in v1).
  - **Advanced** collapsible section (empty in Sprint 1, populated by later sprints):
    - Reserved keys in the store: `tunerGreenCents` (Sprint 3), `tunerYellowCents` (Sprint 3), `lessonCents` (Sprint 5).
    - "Reset to defaults" button — will appear once there's anything to reset.
- Settings persisted to `localStorage` via a Zustand store with a persist middleware.

**Done when:** `npm run dev` opens a settings screen, selections persist across reload, and the folder tree matches CLAUDE.md.

**Out of scope:** any audio, any diagrams, any lesson content.

---

## Sprint 2 — Mic capture, pitch detection, swara display

**Goal:** Turn live mic input into a live "You played: Ga (madhya) — 294 Hz" readout. This is the heart of step 1 of the roadmap.

**Deliverables:**
- Mic permission flow with a clear denied/revoked state.
- `web/src/audio/` module: a hook `useLivePitch()` that returns `{ frequency, clarity }` at ~30 Hz using `pitchy`'s YIN.
- Noise gate: below a configurable RMS threshold, report "silence" instead of a nonsense frequency.
- `web/src/music/` module (built per [docs/sargam-mapping.md](sargam-mapping.md)):
  - `frequencyToSwara(hz, sa, mode) → { swara, octave, centsOff }`
  - `saMidiForMode(mode, concertPitch?) → midi`
  - All math reads Sa from the store — no hardcoded 440 in UI.
- Live readout component: large swara label, octave marker (dot above/below), cents-off indicator, frequency in Hz as a debug line.
- Confidence indicator: gray out the readout when `clarity < 0.8` or RMS below threshold.

**Done when:** playing/singing a note produces the correct swara+octave for at least guitar (EADGBE) and a keyboard octave, in both fixed Sa = C4 and a movable Sa set manually via a debug slider.

**Out of scope:** instrument-specific tuner UI, diagrams, lessons.

---

## Sprint 3 — Tuner

**Goal:** A per-instrument tuner that beats using a generic guitar tuner app. Step 2 of the roadmap.

**Deliverables:**
- Per-instrument "expected notes" data in `web/src/instruments/<name>.ts`:
  - Guitar: E2, A2, D3, G3, B3, E4.
  - Ukulele: G4, C4, E4, A4 (standard re-entrant).
  - Keyboard/harmonium: reference A4 (or user-picked Sa).
- Tuner UI:
  - Shows the six (or four) strings, or the reference key.
  - For each, shows current pitch vs. target, with a needle or bar.
  - Green / yellow / red zones driven by **user-configurable tolerances** (see below).
  - Auto-detects which string the user is attempting (nearest target by cents).
- User-configurable cents tolerance for the tuner, stored in settings:
  - `tunerGreenCents` (default 10).
  - `tunerYellowCents` (default 25).
  - Exposed in a Settings → Advanced panel. Reset-to-defaults button.
- Fixed vs. movable Sa is irrelevant here — tuner always uses concert pitch.
- **Landscape layout:** on short-viewport landscape (phone on a stand), the tuner needle/bar takes centre stage full-width; the string list compresses to icons/short labels down the side. In portrait, stack vertically.

**Done when:** a real guitar can be tuned with this tool (verified against another tuner), and the ukulele + keyboard modes show correct targets.

**Out of scope:** chord tuning (one note at a time), custom tunings (drop-D, etc.), low-E detection sub-40-Hz subharmonic issues — defer if they bite.

---

## Sprint 4 — Instrument diagrams (handedness-aware)

**Goal:** Draw SVG instrument diagrams and highlight the note currently being played. Prerequisite for Sprint 5 (guided practice).

**Deliverables:**
- SVG components under `web/src/instruments/`:
  - `GuitarFretboard.tsx` — 6 strings × 12 frets, nut, fret markers at 3/5/7/9/12, string labels.
  - `UkuleleFretboard.tsx` — 4 strings × 12 frets, same treatment.
  - `Keyboard.tsx` — 2 octaves of piano keys (reusable for harmonium).
- Handedness: fretted diagrams accept a `hand: 'right' | 'left'` prop. Right = nut on left edge, body on right. Left = horizontally mirrored. String labels and fret numbering flip to stay readable to the user.
- Highlighting for a target note (lesson mode, Sprint 5): show **all** valid positions for the swara/octave on the diagram.
  - One position is **primary** (bright, larger marker) — the user's preferred fingering for that note.
  - Others are **secondary** (dimmer, smaller) — shown at their respective positions so the user learns the full map.
  - Tapping/clicking any secondary position promotes it to primary.
  - The preference persists in `localStorage`, keyed by `(instrument, swara, octave)` — e.g., a user can prefer 5th-string-3rd-fret for Ga (madhya) on guitar, and that choice sticks across sessions.
  - Sensible initial primary: lowest-fret match on the lowest-numbered string (the "first position" default).
- Highlighting for a detected note (live/tuner mode): lights up whichever position(s) the user is actually playing — no preference logic, just position matching.
- Live mode: hook up to `useLivePitch()`. Harmonium/keyboard: trivial single-key highlight. Fretted: highlight all positions that match the detected frequency (fret-position detection from pitch alone is ambiguous by design, so we don't try to disambiguate — we just light up every possibility).
- **Landscape is the primary orientation** for fretboard diagrams on phones — frets extend horizontally, matching how the instrument actually sits. In portrait on a phone, the diagram should either (a) rotate 90° so frets still extend along the longer axis, or (b) compress vertically and scroll horizontally. Decide empirically in this sprint. Tablets/desktops: landscape orientation of the diagram regardless of window orientation.

**Done when:** playing an open E on a right-handed guitar highlights the correct string(s); flipping to left-handed mirrors the diagram; a C5 on keyboard highlights the correct key; in a lesson that targets Ga (madhya), all positions are visible with one marked primary, and clicking another position changes and persists the preference.

**Out of scope:** finger-position hints (which finger to use), animation of transitions, voicing suggestions for chords.

---

## Sprint 5 — Guided practice (MVP complete)

**Goal:** Deliver step 3 of the roadmap — target note on screen, diagram highlights the position, live listening, pass/fail feedback. This is what makes it a *teacher*, not a *tuner*.

**Deliverables:**
- Curriculum data under `web/src/curriculum/`:
  - Level 1: identify `Sa` (madhya). Level 2: `Re`. … Level 7: `Ni`. Level 8: "any of these, random".
  - Each level is a JSON/TS data object: `{ id, name, prerequisites, targets: [swara], octave, mode }`.
- Lesson runner component:
  - Shows target swara (big), the instrument diagram with **all** positions for that swara/octave visible (primary + secondary markers per Sprint 4), and a "play it now" prompt.
  - Listens; passes when detected pitch is within the user's configured lesson tolerance, sustained ≥ 300 ms.
  - Feedback: ✓ correct / "a bit flat" / "a bit sharp" / "try again".
  - 5 correct in a row = level complete, unlock next.
- User-configurable cents tolerance for lessons, stored in settings:
  - `lessonCents` (default 15).
  - Same Advanced settings panel as the tuner tolerances.
- Lesson progress persisted to localStorage.
- **Landscape layout:** split side-by-side — target swara (left) | instrument diagram (right), with feedback/correct-count beneath. In portrait, stack vertically (target → diagram → feedback).

**Done when:** a first-time user can open the app, pick guitar + right-handed + fixed Sa = C4, and work through Sa → Ni in madhya via on-screen guidance with no outside help.

**→ MVP is done. Roadmap steps 1, 2, 3 shipped.**

---

# Product sprints

Target: the full 8-step roadmap (minus reserved step 7). Backend arrives in Sprint 8.

## Sprint 6 — Komal, teevra, and octave expansion

**Goal:** Broaden the notation system. Still pure frontend — no backend needed.

**Deliverables:**
- `web/src/music/` gains komal Re/Ga/Dha/Ni and teevra Ma as first-class values.
- Diagrams: lit positions show the variant marker (underline / small flat / sharp glyph alongside the swara label).
- Curriculum extensions:
  - Level 9–14: komal variants in madhya.
  - Level 15: teevra Ma.
  - Level 16–20: mandra (lower) octave.
  - Level 21+: taar (upper) octave.
- Settings: a "practice range" toggle lets advanced users skip re-doing basics.

**Done when:** all 12 semitones × 3 octaves are identifiable and teachable, and curriculum levels unlock in order.

---

## Sprint 7 — Chords (roadmap step 4)

**Goal:** Detect simultaneous notes and teach basic chords. Hardest DSP sprint in the MVP+ phase.

**Deliverables:**
- Multi-pitch detection in `web/src/audio/`: FFT-based peak picking with harmonic suppression. YIN is monophonic; this needs a separate pipeline.
- Chord library under `web/src/music/chords.ts`: major, minor, sus2/sus4, 7th, expressed as sets of swaras relative to a root.
- Guided chord lessons: show the chord name, show the fingering on the diagram (fretted), listen for the set of notes, pass when all component notes are detected within a short window.
- No chord recognition from arbitrary audio in v1 — only validation against a *given* expected chord. That's much easier and sufficient for teaching.

**Done when:** the app can validate that the user played a C major on guitar (right or left handed) correctly, and teach it from scratch.

**Deferred:** freeform chord identification ("what did I just play?"), inversions, voicings.

---

## Sprint 8 — Backend scaffold + notation DSL

**Goal:** Stand up the FastAPI service and define the sargam notation format that later sprints consume.

**Deliverables:**
- `backend/` scaffold: `pyproject.toml` via `uv`, FastAPI app at `backend/app/main.py`, `/health` endpoint.
- Notation format (YAML or JSON — decide in this sprint; YAML is more human-friendly). Schema roughly:
  ```yaml
  title: "Sare Jahan Se Achha"
  sa: C4             # fixed-Sa reference
  tempo: 80          # bpm
  beats_per_bar: 4
  bars:
    - [sa, re, ga, ma]
    - [pa, pa, ma, ga]
    # …
  ```
  Each slot is `swara` or `{swara, octave, duration}` where duration is in beats (default 1).
- Backend endpoints:
  - `POST /notation/validate` — lint a notation file, return structured errors.
  - `GET /notation/:id` — serve a bundled song.
- A small seed library of 3–5 simple notations under `backend/data/songs/`.
- Frontend integration: load a notation via fetch, display it as a scrollable bar-by-bar view — no listening yet.

**Done when:** a YAML notation file round-trips backend ↔ frontend and displays correctly. Endpoint `/health` returns `{ok: true}`.

---

## Sprint 9 — Notation following (roadmap step 5)

**Goal:** User plays along to a displayed notation at their own pace (or with a metronome); app scores each note.

**Deliverables:**
- Metronome in the frontend (pure Web Audio, optional on/off).
- Playhead on the notation: advances either (a) on metronome tick or (b) on correct note detected (user-selectable).
- Per-note feedback: ✓ ✗ with cents-off logging.
- End-of-song summary: accuracy %, list of notes missed.
- No reference audio yet — just notation + mic.

**Done when:** a user can load a notation, play it on guitar or keyboard, and see a per-note scored result.

---

## Sprint 10 — Reference audio + notation sync (roadmap step 6)

**Goal:** Play a reference recording alongside the notation, with notation scrolling in sync. User plays along.

**Deliverables:**
- Upload reference audio (WAV/MP3) paired with a notation file.
- Backend: offline alignment of reference audio to notation using onset detection (aubio) + dynamic time warping. Produces a timeline mapping `notation_position → audio_timestamp`.
- Frontend: audio player with synchronized notation scroll.
- Same per-note scoring as Sprint 9, but now against the audio-driven playhead rather than the metronome.

**Done when:** a reference recording of a simple song plays, notation scrolls in time with it, and the user's mic input is scored against the expected notes at each moment.

**Caveat:** DTW alignment is fiddly. Expect to iterate. Start with clean mono recordings.

---

## Sprint 11 — Vocal mode (roadmap step 8)

**Goal:** User sings a song; app shows lyrics + target pitch + actual pitch, both in sync.

**Deliverables:**
- Notation format extended with lyrics per note/slot.
- Vocal pitch tracking: likely still YIN in-browser, but with longer smoothing (vocals have vibrato). Evaluate whether a backend offline pass is needed for better pitch curves — probably not for real-time use.
- UI: two-line scroll — upper line is target pitch curve, lower is detected pitch curve, with lyrics beneath. Color-code deviation.
- Per-syllable and whole-song pitch-accuracy scores.

**Done when:** a user can sing along with "Sare Jahan Se Achha", see lyrics scroll, see the pitch overlay in real time, and get a summary at the end.

---

## Beyond Sprint 11

Not planned in detail — reassess after Sprint 11 ships. Candidates:

- **Devanagari display toggle** — UI-only, small.
- **Flutter mobile app** — against the same FastAPI.
- **Recording & playback of user performances** — requires storage.
- **Microtonal / shruti analysis** — moves into Hindustani music theory proper.
- **Raga-aware lessons** — aarohana/avarohana, pakad.
- **Tala / rhythm tracking** — orthogonal to everything above and substantial on its own.

---

# Cross-cutting concerns

- **Latency budget.** Real-time pitch path (mic → display, mic → diagram highlight, mic → lesson pass/fail) must stay under ~50 ms end-to-end. Any sprint that risks blowing this must profile and document the tradeoff.
- **Cents tolerance.** User-configurable in Settings → Advanced. Defaults: tuner green ±10 ¢, tuner yellow ±25 ¢, lesson pass ±15 ¢. Reset-to-defaults button always available. Stored in the same Zustand settings store as instrument/handedness/Sa.
- **Offline-first.** The MVP (Sprints 1–5) should work with no network once loaded. Backend sprints introduce network dependence only for backend-gated features.
- **No migration burden.** This is a personal app. If a data format changes, break it and regenerate — don't build migrations.
