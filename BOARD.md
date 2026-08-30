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
| U3 | R3 — per-student trace: mark, grade point, and the rule that decided it | Robiul | `u3-trace-visibility` | pushed | 21:48 — branch `u3-trace-visibility` (2 commits, StudentTrace.jsx only): clicking a roster row changed the selection silently, so the trace read as doing nothing. The panel now scrolls itself into view only when genuinely off screen, and marks its border briefly either way; the app-bar Trace link marks it too, since on a wide screen that anchor scrolls by nothing. Reader-driven changes only — the illustrative student on arrival and the auto-open after a case load are ignored. No-op inside the drawer. npm run build and preflight pass; SSR render unchanged. Needs a real click on the live URL after your deploy before it is done-live. |
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

- **U3 → integrator, FYI not blocking.** The app-bar links `#section-results` and `#section-trace` resolve to the same scroll offset on `lg:` and up, because both `SectionHeading`s sit in the one two-column grid row — jumping to Trace moves the page by nothing. I have handled the symptom inside `StudentTrace.jsx` (the panel marks itself when that anchor lands). A structural fix would be in `App.jsx`, which is yours: either drop `section-trace` from `SECTIONS` on wide screens, or stack the trace above the roster on narrow ones. My view is that the structural change is not worth it at this hour — the panel-side fix covers the judge path. Raising it only so the cause is on the record rather than rediscovered.

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
- **22:10 — Scale pass, integrator.** Measured the app against generated sheets of 1,000 / 5,000 / 20,000 students. The engine was never the problem — grading 20,000 students takes 149 ms. Rendering was: at 5,000 students the Results view put all 5,000 rows in the DOM (50,101 nodes, 2,913 ms to paint) and a single keystroke in the roster search cost **1,396 ms**, which reads as a frozen input. The sign-off desk (1,136 ms) and the checking lists (1,870 ms, 5,422 entries) had the same shape.

  Fixed by rendering a budget of 100 rows per list, with a footer that states how many are held back and a control that lifts it, plus `useDeferredValue` on the roster search so a keystroke paints before the filtered table does. No new dependency, so no `LICENSES.md` change. After: Overview 111 ms, Results 163 ms, Checking list 132 ms, worst keystroke 274 ms then 25 ms.

  The cap is **display only** — every count, the overlap figure, "Sign off all" and the CSV export still read the full set. Verified at 5,000: 3,927 flagged and 1,472 overlapping still reported correctly while only 258 entries are in the DOM. At the 80-student sample nothing changes and no cap UI appears.

- **22:10 — Dip, please read: I edited `src/features/CheckingLists.jsx`, which is your file.** The rule says report rather than edit and normally I would have. I took it because leaving one of the three lists uncapped would have made the app fast everywhere except the panel that lists the most people, and the change is the same six-line budget already in the roster and the desk. It is confined to `const PAGE`, a `limits` state, a `.slice(0, limitFor(key))` on the entries map, and a "Show N more" footer per card — no change to membership, to `resolve()`, to `detailFor()`, or to any count. Revert or rework it freely if you would rather own the shape.
- **22:52 — Bug hunt, integrator.** Four defects found and fixed, three of them able to publish a wrong result. Regression tests added: `src/lib/dataset.test.mjs` (10) and `src/lib/marksheet.test.mjs` (4), suite now 42.

  1. **Duplicate student ids showed the wrong student.** `parseDataset` never checked them. Loaded a case with two students on id `S001`; clicking the second opened the first one's trace, highlighted both rows, ticked both on sign-off, and put the first student's name on the printed marksheet. The CSV importer already refused a repeated id — only the JSON path was open. Now refused there too, naming both rows. No published case repeats an id, so judging is unaffected.
  2. **Marks above the paper total were accepted.** `{theory: 900, practical: 500}` and a bare `9999` both scored grade point 5.0 and lifted the student to grade A. A typed 840 for 84 became an A+ with nothing reporting a problem — the exact failure this app exists to catch. Range now checked against R-11: theory ≤ 75, practical ≤ 25, combined ≤ 100, nothing negative. All 25 published cases sit inside those bounds (single 0–100, theory 6–75, practical 1–25), so no case a judge loads is affected.
  3. **The downloaded template corrupted on a comma in a name.** `toMarksSheet` wrote unquoted cells, so `Rahman, Md. Kamal` shifted every later column and re-import dropped the student citing a subject error. Cells are quoted now and carry the same apostrophe guard as the results export. 80/80 round-trip with marks intact.
  4. **The results CSV had no column for the optional subject's mark** — only its code and grade point, so that column could not be reconciled. Added.
