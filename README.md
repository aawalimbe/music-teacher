# Music Teacher

A personal music-teaching application built around **Indian notation** (Sa Re Ga Ma Pa Dha Ni). It listens to live microphone input and teaches you to identify notes, tune your instrument, and progress through chords, songs, and eventually vocal pitch matching — all without relying on AI.

## Why

Most ear-training and tuner apps use Western solfège (Do Re Mi) or staff notation. This one uses **sargam** (the Indian notation system) throughout, and is designed as a progression:

> "What note did I just play?" → "Am I playing this song in tune?" → "Am I singing this raga on pitch?"

## Roadmap

| # | Step | Phase |
|---|---|---|
| 1 | Note detection — identify which swara (Sa/Re/Ga/…) and octave (mandra/madhya/taar) | MVP |
| 2 | Per-instrument support + tuner (acoustic guitar, ukulele, keyboard, harmonium) | MVP |
| 3 | Guided practice — target note on screen + instrument diagram + live feedback | MVP |
| 4 | Chord recognition and teaching | v1 |
| 5 | Notation-following — match user's playing against a written song notation | v1 |
| 6 | Playback + notation + feedback (play the reference audio alongside the notation) | v1 |
| 7 | *(reserved)* | — |
| 8 | Vocal mode — sing and get real-time lyrics + pitch-accuracy overlay | v2 |

## Tech stack

- **Web frontend**: React + TypeScript + Vite
- **Real-time audio**: Web Audio API + `pitchy` (YIN-based pitch detection, in-browser)
- **Instrument visuals**: SVG
- **Backend (phase 2, not yet built)**: FastAPI + librosa — used only for offline analysis (notation matching, vocal alignment)
- **Mobile (phase 3, not planned yet)**: Flutter against the same FastAPI

**No AI/ML. Deterministic DSP only.**

## Key design decisions

- **Sargam-first.** Sa Re Ga Ma Pa Dha Ni everywhere, with komal (lowered Re/Ga/Dha/Ni) and teevra (raised Ma) variants. No Do Re Mi in the UI.
- **Sa is configurable per session** — choose between:
  - *Fixed Sa*: e.g. Sa = C4, useful for keyboard/guitar learners.
  - *Movable Sa*: user picks their own Sa at runtime. Essential for vocalists.
- **Octave markers**: mandra (lower, dot below), madhya (middle, plain), taar (upper, dot above).
- **Notation depth unfolds with progress.** Beginners see only the 7 shuddha swaras in madhya. Komal/teevra and other octaves unlock as the user advances.
- **Handedness-aware instrument diagrams.** Guitar and ukulele diagrams flip horizontally for left-handed users. The diagram is shown from the user's **first-person POV** (as if looking down at their own instrument) — not an observer view, not a camera feed. Keyboard and harmonium are handedness-agnostic.
- **Browser-first real-time path.** All live pitch work happens in the browser to keep end-to-end latency under ~50 ms. The Python backend is for offline / batch analysis only.
- **Live mic only in v1.** No file upload, no pre-recorded clips, no camera.

## Project structure

```
music_teacher/
├── README.md
├── CLAUDE.md                # guidance for Claude Code sessions
├── web/                     # React + TypeScript frontend
│   └── src/
│       ├── audio/           # mic capture, pitch detection
│       ├── music/           # frequency → sargam mapping, tuning, scales
│       ├── instruments/     # per-instrument definitions + SVG diagrams
│       ├── curriculum/      # lesson progression data
│       ├── components/      # React UI components
│       └── store/           # Zustand global state
├── backend/                 # FastAPI service (phase 2, not yet created)
└── docs/
    ├── architecture.md
    ├── sargam-mapping.md
    └── sprints.md           # MVP + full-product sprint plan
```

## Status

**Sprint 0** — project documentation. No runnable code yet.

## Running (once scaffolded)

```bash
cd web
npm install
npm run dev
```

Backend (phase 2+):

```bash
cd backend
uv venv && uv sync
uvicorn app.main:app --reload
```

## Sprints

See [docs/sprints.md](docs/sprints.md) for the full MVP and product sprint plan. *(Not yet written — pending planning discussion.)*
