# CLAUDE.md

Guidance for Claude Code sessions working on this repository.

## Project

A personal, non-AI music teacher for Indian notation (sargam). Live mic in, real-time swara/octave identification out, progressing toward tuner → guided practice → chords → song-notation matching → vocal pitch matching.

See [README.md](README.md) for the user-facing overview and the 8-step roadmap.

## Current phase

**Sprint 0 — documentation only.** No code scaffolded yet. Do not create `web/` or `backend/` directories until the sprint plan (`docs/sprints.md`) has been written and agreed.

## Core principles (do not violate without asking)

- **No AI / ML.** Pitch detection is deterministic DSP only (YIN, autocorrelation, FFT). No neural models (crepe, spice, etc.), no timbre classification, no audio-generation models. If a feature seems to require ML, stop and ask first.
- **Sargam only.** UI strings, variable names in the music layer, and documentation use Sa/Re/Ga/Ma/Pa/Dha/Ni — never Do/Re/Mi or staff notation. Komal → lowercase or `_komal` suffix convention (e.g., `re_komal`). Teevra → `ma_teevra`.
- **Live mic only (v1).** No file upload, no pre-recorded clips, no camera feed.
- **Browser handles real-time. Backend handles offline.** Never stream live mic audio to the server. Real-time pitch display, tuner, and guidance feedback must all run in-browser with target end-to-end latency < 50 ms.
- **Personal-use project.** No accounts, auth, multi-tenancy, cloud sync, analytics, or telemetry.

## Tech stack (decided)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | React + TypeScript + Vite | User preference (React); TS is non-negotiable at this project size; Vite over CRA for speed. |
| Real-time pitch | Web Audio API + `pitchy` (YIN in JS) | < 50 ms latency, works offline, no backend dependency. Swap to a custom `AudioWorklet` YIN implementation only if `pitchy` proves too slow. |
| Instrument diagrams | SVG | Scalable, animatable, no Canvas redraw loop needed for static-plus-highlight rendering. |
| State | Zustand | Lightweight; app state is small (instrument, handedness, Sa mode, current lesson). Don't reach for Redux. |
| Backend (phase 2) | FastAPI + librosa | Offline analysis (notation matching, vocal alignment) only. Not yet created. |
| Mobile (phase 3) | Flutter | Against the same FastAPI. Not planned yet — don't scaffold. |

## Domain rules

### Sa reference modes

Two modes, user-switchable at runtime:

- **Fixed Sa**: Sa maps to a fixed concert pitch chosen at setup (default Sa = C4). Meant for instrument learners (keyboard, guitar tuning to a reference).
- **Movable Sa**: user sets their Sa by playing/singing a reference tone, or by dragging a slider. Required for vocalists — a vocalist's Sa rarely aligns with a fixed Western pitch.

All frequency → swara conversion must read the current Sa from the single source of truth (`web/src/music/`), never hardcoded.

### Octaves

Three octaves in v1: **mandra** (lower, dot below), **madhya** (middle, plain), **taar** (upper, dot above). Further octaves (ati-mandra, ati-taar) are a later extension — don't add them preemptively.

### Notation depth unfolds with progress

Start with the 7 shuddha swaras in madhya. Komal/teevra and other octaves unlock as the user advances through the curriculum. Treat curriculum as **data** (levels, prerequisites, targets) under `web/src/curriculum/`, not hardcoded gates inside UI components.

### Instrument handling (step 2)

Supported in v1: **acoustic guitar** (EADGBE), **ukulele** (GCEA), **keyboard**, **harmonium** (equal-tempered, same layout as keyboard). Each instrument has a definition file under `web/src/instruments/<name>.ts` that exports: display name, tuning/notes, diagram SVG/geometry, and the mapping from `{string, fret}` or `{key}` → frequency.

"Instrument understanding" here means **calibration and tuner**, not timbre classification. We do not try to detect what instrument is being played.

### Handedness (right vs. left)

Fretted instruments (guitar, ukulele) must respect handedness. The user picks right or left at setup; it is persisted.

The diagram is rendered from the user's **first-person POV** — what they would see looking down at their own instrument while playing it. Not an observer/audience view. Not a camera feed. Concretely:

- Right-handed: neck extends to the user's left on screen (nut on the left edge of the diagram, body on the right).
- Left-handed: horizontally mirrored — nut on the right, body on the left.

The flip is a simple horizontal transform of the entire diagram group plus re-indexed string/fret labels. Don't build two separate SVGs; parameterize one.

Keyboard and harmonium are handedness-agnostic.

## Conventions

- **Single source of truth for pitch math**: all `frequency ↔ swara ↔ midi` conversion lives in `web/src/music/`. Components must not hardcode `A4 = 440` or do their own conversions.
- **Instrument definitions are pure data** under `web/src/instruments/<name>.ts`. No React, no audio imports.
- **UI copy**: Latin sargam (`Sa`, `Re`, `Ga`, ...) by default; Devanagari (`सा`, `रे`, `ग`, ...) as an optional display toggle (future).
- **No magic numbers for pitch**. All constants (A4 reference, cent thresholds for "in tune", note duration buckets) live in config modules.
- **TypeScript strict mode on.** No `any` unless genuinely unknown (e.g., raw WebAudio types); prefer `unknown` + narrowing.
- **Responsive: portrait AND landscape, both first-class.** All screens must work in both orientations. Practice-mode screens (tuner, fretboard diagrams, lesson runner, notation-follow) should actively *benefit* from landscape on phones — fretboards and notation timelines want the horizontal real estate; a phone on a stand in landscape is the natural practice posture. Minimum tap target 44 × 44 px everywhere. Test matrix for every UI sprint: 375 × 667 (phone portrait), 667 × 375 (phone landscape), 768 × 1024 (tablet portrait), 1024 × 768 (tablet landscape).

## What NOT to do

- Don't add camera or video features.
- Don't add AI-based pitch detection, timbre classification, music generation, or recommendation.
- Don't add accounts, auth, cloud sync, multi-user, or analytics.
- Don't use Western solfège (Do Re Mi) anywhere user-facing, including variable names in the music/UI layers.
- Don't stream mic audio to the server. (Backend is batch/offline only.)
- Don't add file upload in v1.
- Don't scaffold the backend or mobile until their phase arrives.
- Don't add ragas, tala, or rhythm tracking until explicitly requested — notation matching comes first.

## Running (once scaffolded)

```bash
# Web (frontend)
cd web
npm install
npm run dev
```

```bash
# Backend — phase 2 only, not yet created
cd backend
uv venv && uv sync
uvicorn app.main:app --reload
```

## Where things live

| Path | Purpose |
|---|---|
| `web/src/audio/` | Mic capture, AudioWorklet, pitch detection glue |
| `web/src/music/` | Frequency ↔ swara ↔ midi conversion, Sa mode, tuning config — **single source of truth** |
| `web/src/instruments/` | Per-instrument definitions and SVG diagram components |
| `web/src/curriculum/` | Lesson/level data: which swaras/octaves/modes are unlocked when |
| `web/src/components/` | React UI |
| `web/src/store/` | Zustand stores (app-global state) |
| `backend/app/` | FastAPI (phase 2+) |
| `docs/` | Architecture notes, sargam-mapping reference, sprint plan |

## Open questions / decisions not yet made

- Exact `pitchy` configuration: window size, threshold, smoothing — to be tuned empirically in Sprint 1.
- "In-tune" cent tolerance for the tuner UI (likely ±10 ¢ green / ±25 ¢ yellow / beyond that red — confirm in Sprint 2).
- Whether movable-Sa calibration uses a single-tone drone, a slider, or both.
- Curriculum content — which swaras/sequences appear in which level. To be drafted alongside Sprint 4.
