# Board — who is doing what, right now

**This file is the shared canvas between the four Claude sessions on this repo.** Chat
and memory do not sync across devices; this file does. Update your row when your status
changes, commit (`board: U2 building`), push. Pull before reading — a stale board is
worse than no board.

**Repo: `lsh26-t036-p08` · P08 School Result Processing and GPA Engine · Tier 02**
**Live: https://lsh26-t036-p08.pages.dev**
**Integrator: shinzuu** — owns merges, deploys, and `src/App.jsx`, `src/lib/store.js`,
`src/app.css`, `index.html`, `package.json`.

**MERGE FREEZE: 21:15.** After it, no feature merges — only fixes the integrator
explicitly requests, plus the submission artifacts.

**SUBMIT AS SOON AS THE GATE PASSES.** The early bonus is measured from the Google Form
receipt, not from any commit (organizer clarification: *"Commit times are not used."*).
The gate is at least 3 of the 4 required items fully passing on **both** P08 and P10.
The moment that is true on both repos, the team leader submits — do not wait for 4/4.
The submission can be edited later, but the recorded time becomes the time of the edit.

| Receipt | Bonus |
|---|---|
| 20:00 | 5.00 |
| 20:30 | 3.75 |
| 21:00 | 2.50 |
| 21:30 | 1.25 |
| 21:50+ | 0 |

Read `SPEC.md` in full before building. It carries the four required items and the
clarifications verbatim, the data model, the fixed engine and store export shapes, and
the per-unit prompts.

| Unit | Item | Owner | Branch | Status | Last update (time + note) |
|---|---|---|---|---|---|
| U1 | R1 — dataset of ≥60 students, two classes, ≥8 hard edges, loadable from the fixture shape | shinzuu | `u1-dataset` | done-live | 18:40 — verified live: page opens with 80 students across Class 9 (40) and Class 10 (40) with no upload, all four hard-edge lines naming real students; uploading fixture case PUB-02 switched the header to PUB-02, 60 students, Class 9 (30) and Class 10 (30), and every edge line recomputed to different students and counts. |
| U2 | R2 — grade point per subject, GPA, letter grade | Rimjhim | `u2-grading-engine` | pushed | 18:52 — engine + 26 node --test cases + results table pushed. node --test passes 26/26, npm run build passes. Ready to merge. |
| U3 | R3 — per-student trace: mark, grade point, and the rule that decided it | Robiul | `u3-trace` | pushed | 18:50 — StudentTrace.jsx pushed; npm run build passes, preflight passes. Branch touches one file only and carries a merge of main (U1). Rendered against the real PUB-01 fixture and a local reference engine before pushing: S004 (unc 4.67, MAT fail) banner names Mathematics; S011 PHY 60+5 rule says the practical; S032 BIO prints AB; S064 ENG prints 0 with "mark 0 is below 33" — AB and 0 verified distinct; S003 shows the 5.3333 -> 5.00 cap. Also renders without crashing against the grading.js placeholder. Awaiting merge + deploy for the live check. |
| U4 | R4 — checking lists: optional rule, practical fail, absent | Dip | `u4-checking-lists` | todo | — |

Status values: `todo` → `building` → `pushed` → **`done-live`**. A row only earns
`done-live` when its note names the exact live-URL check performed — e.g. "verified live:
opened S045's trace, AB printed for Biology, rule says absent". "The crash stopped" is
not `done-live`; "looks right" is not `done-live`.

## Rules that cost marks if broken

- **Do not squash, delete or rewrite git history after 18:00.** Judges read the history.
  Inside this repo use `git pull --no-rebase`, never `git pull --rebase`.
- Integrator-only files are `src/App.jsx`, `src/lib/store.js`, `src/app.css`,
  `index.html`, `package.json`. Need a change there? Post the exact diff below as a
  blocker; do not make it yourself.
- `BOARD.md` and `NOTES.md` are the only files committed directly to `main`.
- No docs or polish commits while any required item is broken.
- `bash scripts/preflight.sh` before every push.

## Blockers / requests to the integrator

One line each, newest on top. The integrator clears these and deletes the line.

- (none)

## Notes — things everyone should know

Gotchas found mid-build: rule quirks, deploy traps, licence flags. One line each.

- Repo went live at 18:13 on the starter-kit baseline; smoke-live passed (200, bundle matches local dist).
- The shell, `src/lib/store.js` and a placeholder for every unit-owned file are merged. Your placeholder names you in a banner — replace the file wholesale, do not build around it.
- `src/lib/grading.js` currently holds signature-only stubs so the app builds and U3/U4 can lay out against real shapes. U2 replaces it entirely, keeping every export name.
- U1 is merged and live, so `parseDataset`, `SEED`, `summarise` and `describeEdges` are available from `src/lib/dataset.js`, and the store seeds from a real 80-student roster.
- JSON imported into a `.js` module needs `with { type: 'json' }` — that keeps the module loadable by plain `node`, which is how U1's validation messages were exercised without a browser.
