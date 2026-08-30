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
| U2 | R2 — grade point per subject, GPA, letter grade | Rimjhim | `u2-grading-engine` | done-live | 19:05 — merged and deployed. Verified live: Results panel lists all 80 students with GPA to 2dp and letter, 59 passing / 21 failing; S004 reads 0.00 F with subject points 5.0/5.0/0.0/5.0/5.0/5.0 still visible. 26/26 node --test pass, and an independently written implementation of the clarifications matched all 80 students on GPA, letter, uncancelled average and all three checking lists — 0 mismatches. |
| U3 | R3 — per-student trace: mark, grade point, and the rule that decided it | Robiul | `u3-trace` | done-live | 19:05 — merged and deployed. Verified live: opened Imran Sultana (S004), trace lists all 7 subjects with mark used, grade point and rule text; banner names Mathematics as the cause and shows the uncancelled 4.67 beside the final 0.00. Opened Hasib Khatun (S045): Biology renders AB with rule 'absent — AB, grade point 0', not 0. |
| U4 | R4 — checking lists: optional rule, practical fail, absent | Dip | `u4-checking-lists` | done-live | 19:05 — merged and deployed. Verified live: three lists with counts 25 / 10 / 2, each stating its rule; header reports 10 students on more than one list; Lamia Islam appears under the optional rule badged 'also on Practical fail'. NOTE: the branch was pushed with the board row left at todo — merged on the operator's instruction. |

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
- **19:05 — all four required items are merged, deployed and verified live. P08 is 4/4.** The team's early-submission gate needs 3 of 4 on BOTH problems; this repo has met its half.
- 19:10 — dead code removed before the freeze: `src/recipes/` (all thirteen unused modules), `src/lib/db.js`, the placeholder demo component, four unused themes, the Supabase schema templates and the doc templates, plus the now-unused `@supabase/supabase-js` dependency. CSS bundle fell from 30.9 kB to 22.2 kB. `LICENSES.md` rewritten to match what actually ships, every licence re-verified with `npm view`.
- 20:28 — UI/UX round, integrator items done: the five-colour palette placed by measured contrast (42 text pairs audited live, 0 below AA), dark mode removed so the 22:00 capture matches what we audited, skip links, and **a student's trace now opens on arrival** so items 1, 2 and 3 are all demonstrated on the first screen with no clicks.
- ~~Still needed from the operator: the four registered names.~~ **Done** — all four filled, manifest has zero placeholders.
- 19:12 — TEST READY. Cross-checked the engine against an independently written implementation of the clarifications over **all 25 published cases, 1,765 students: 0 mismatches** on GPA, uncancelled average, letter, compulsory points and all three checking lists.
- 19:12 — Judge simulation on the live URL: loaded case PUB-17, which had never been opened during the build. 61 students rendered, all four hard edges found with different students, no error, no console warning.
- 19:12 — Live checks all pass: 375 px viewport has no horizontal scroll and nothing overflowing; bad input shows a dismissible alert naming the missing field and keeps the previous roster; console is clean (0 errors, 0 warnings); smoke-live confirms the deployed bundle carries all four items' strings.
- **Remaining before submission: fill the four registered names, make the repository public, copy the exact 40-character SHA.** Checklist in SUBMISSION.md.
