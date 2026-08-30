# EVENT.md

| Field | Value |
|---|---|
| Team | Miasma |
| Team ID | LSH26-T036 |
| Problem ID | P08 — School Result Processing and GPA Engine |
| Tier | Tier 02 (7.5 difficulty credit) |
| Event start code | LSH26-8490-C900 |
| Live URL | https://lsh26-t036-p08.pages.dev |
| Repository | https://github.com/Shinzuu/lsh26-t036-p08 |

## Declaration of material already in this repository before 6:00 PM

This repository's first commit, `Starter kit baseline (pre-existing work, MIT — see
LICENSES.md)`, is a **generic React starter kit** the team wrote before the event. It
contains no solution to P08 or to any other released problem — it was written before the
problems were known.

What it is:

- A Vite + React 19 + Tailwind 4 application shell: `index.html`, `src/main.jsx`,
  `src/App.jsx`, `src/app.css`, and a placeholder `src/lib/Loop.jsx` demo component.
- `src/lib/db.js`, a storage adapter that falls back to `localStorage` when no Supabase
  keys are present.
- `src/recipes/`, a library of thirteen generic, self-contained capabilities
  (csv-import, search-filter, charts, auth, upload, map, realtime, llm, bd-formats,
  export, matching, queue, corroborate) with their own test suites. None of them is
  specific to any released problem. Unused recipes are deleted before submission.
- `src/themes/`, five accessible colour palettes.
- `scripts/preflight.sh` (secret scan), `scripts/smoke-live.sh` (live-deployment check),
  `scripts/compress-video.sh`.
- Documentation templates: `README-TEMPLATE.md`, `SUBMISSION-TEMPLATE.md`, `LICENSES.md`,
  `BOARD.md`, `DEPLOY.md`, `CLAUDE.md`.

Everything from the second commit onward is event work, written after 6:00 PM on
30 August 2026.

## Third-party material

Listed in full with licences in `LICENSES.md`.

## Sample data

`src/data/seed-p08.json` is case PUB-01 from the organizers' published participant
release v2.1 fixture `P08_school_results_public.json`, copied unmodified. It is used as
the application's seed data so the live URL is never empty. The application also accepts
any case in the same shape by paste or file upload.

## AI assistant use

Disclosed in `README.md`.
