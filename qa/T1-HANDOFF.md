# T1 handoff — Rimjhim · input path, validation and bad input

**One file, everything from my test round.** Share this; nothing else needs reading.

| | |
|---|---|
| Tester | Rimjhim Dey (U2 built the engine, so U1's input path is what I tested) |
| Target | https://lsh26-t036-p08.pages.dev — live, bundle `/assets/index-2l7d83Iu.js` |
| Deploy state | `smoke-live.sh` passed: 200, and the live bundle matches a fresh build of `main` |
| Run | 30 Aug, 19:25–19:40 · real Chrome via Playwright, plus the same `parseDataset` / `studentResult` functions run headlessly under node |
| Verdict | **Input path is solid.** 12 of 12 malformed inputs refused correctly. One major defect found, already fixed and waiting on a merge. |

---

## What the integrator needs to do

**One thing: merge `u2-grading-engine` (commit `5924283`) and redeploy.**
It fixes [T1-01] below. It touches only `src/features/ResultsTable.jsx`, which is
U2's file. Engine untouched — 26/26 `node --test` still pass, `npm run build`
passes, preflight passes.

Two smaller items are *not* fixed, because they live in files I do not own:
[T1-02] is in `store.js` (integrator-only) and [T1-03] is in `DataSource.jsx`
(U1) and `App.jsx` (integrator-only). Both are minor. Neither is reachable with
valid data. My recommendation is to fix T1-03 if there is time before the freeze
and leave T1-02 alone.

---

## The three findings

### [T1-01] · major · A duplicate-id case leaves a ghost row that survives every later case

Load a case where two students share an `id`, then load **any** other case. The
header and the counts line report the new case correctly, but the table renders
one row too many — and the extra row is a student from the case that was
discarded. It does not go away.

| Sequence | header says | counts say | table renders |
|---|---|---|---|
| clean → clean (control) | CLEAN-B, 2 students | 2 | **2 rows** ✅ |
| dup-id → clean | CLEAN-C, 2 students | 2 | **3 rows** ❌ |
| dup-id → PUB-05 | PUB-05, 64 students | 64 | **65 rows** ❌ |

The stray row read `First Duplicate D01 … 4.25 A`, a student in none of those
cases. It persisted across five subsequent loads in one session, and clicking it
selects nothing — the trace stays on "No student selected", because its id is no
longer in `results`.

**Cause:** duplicate React keys. Rows were keyed `r.id`; once two rows share a
key, React's reconciler keeps one child mounted across every later render.
React's duplicate-key warning is compiled out of the production build, which is
why the console stays clean — I checked, 0 errors and 0 warnings all session.

**Fixed** on `u2-grading-engine` (`5924283`): key on `${r.id}-${i}`. Verified
against a local preview by replaying the exact failing sequence — dup-id, then a
clean 2-student case, then a clean 5-student case — which now renders 2 then 5
rows where live renders 3. The control path was never affected and still is not.

### [T1-02] · minor · With duplicate ids, clicking the second student opens the first one's trace

Paste a case with `D01` twice — first passing, second failing — and click the
**second** row. The trace opens for the first: clicking "Second Duplicate"
(0.00, F) shows "Trace — First Duplicate" (4.25, A).

**Cause:** `store.js` resolves selection with `results.find(r => r.id === selectedId)`,
which cannot tell two rows with the same id apart. A real fix means selecting by
index instead of id — an integrator-owned change, so I did not make it.
Duplicate ids are already on the known-and-accepted list and are invalid data;
filed only because the pack asks whether selection "behaves sanely". It does not.

### [T1-03] · minor · Counts read "1 students" instead of "1 student"

Any case with exactly one student:

```
1 students across Class 9 (1), 6 compulsory subjects plus one optional.
HARD EDGES IN THIS DATA — 1 STUDENTS SIT ON AT LEAST ONE
1 students computed. Absent Test selected.
```

Three separate strings — two in `DataSource.jsx`, one in `App.jsx`'s `sr-only`
line. Not reachable from the seeded PUB-01; a judge pasting a minimal case would
see it.

---

## What passed — do not re-run any of this

**A · The seeded case.** Opens on PUB-01: `80 students across Class 10 (40) and
Class 9 (40), 6 compulsory subjects plus one optional`. All four hard-edge lines
present under `29 students sit on at least one`, each naming a real student —
Imran Sultana, Hasib Das, Lamia Islam, Hasib Khatun. Table renders exactly 80
rows. No perpetual loading, no blank panel.

**B · Loading other cases.** The **whole 25-case fixture file** uploads and loads
PUB-01 without choking on the other 24. Pasting a single case works. Uploading a
single extracted case works — PUB-05 gave 64 students, Class 10 (32) / Class 9
(32), with all four edge lines recomputed to different people (Kamal Sultana,
Bithi Khatun, Mahin Karim, Bithi Karim). **Restore sample data** returns to
PUB-01 from anywhere. **Reload** returns to PUB-01 — nothing persists, as
intended. The nine-case spread (PUB-02/05/07/11/13/17/20/23/25) was checked
through the same `parseDataset` + `summarise` + `describeEdges` the live page
calls: counts 60/64/69/79/68/61/80/70/74, every one splitting evenly across the
two classes.

**C · Malformed input — 12 of 12 refused correctly, live.** Each produced a
dismissible alert naming the problem and left the loaded roster untouched. No
blank page, no stack trace, no silent no-op, no wiped roster.

| # | Input | Message shown |
|---|---|---|
| 11 | `hello` | That is not valid JSON. Paste the contents of a case, or the whole fixture file. |
| 12 | `{` | same |
| 13 | `[1,2,3]` | Expected a JSON object. |
| 14 | `{}` | Missing `subjects` — expected a list of {code, name, practical}. |
| 15 | `{"cases":[]}` | That fixture file has an empty `cases` list. |
| 16 | unknown code in `compulsory` | `compulsory` names "ZZZ", which is not in `subjects`. |
| 17 | student missing `optional` | students[2] (S003) is missing its `optional`. |
| 18 | `optional` names unknown code | students[2] (S003) names optional subject "ZZZ", which is not in `subjects`. |
| 19 | missing a compulsory mark | students[1] (S002) has no mark for "MAT". |
| 20 | `"BAN": "70"` | students[0] (S001) has an unreadable mark for "BAN" — expected a number, {theory, practical}, or "AB". |
| 21 | `"BAN": null` | same |
| 22 | empty `students` | Missing `students` — expected a non-empty list. |

**23 · Recovery.** After all twelve refusals back to back, a student could still
be selected and their trace rendered, and the next valid paste loaded normally
with no lingering alert. Checked twice.

**24 · Non-JSON upload.** A `.md` file was refused with "That is not valid JSON",
roster intact at PUB-01 / 80 rows.

**31 · A big case.** 1,000 students, 233 KB: header read `1000 students across
Class 10 (480) and Class 9 (520)`, table rendered 1,000 rows, no hang. Roster
search re-filtered in **30 ms**, selecting a student re-rendered in **209 ms**.
Headless, the same 1,000 parse in 2 ms and compute in 12 ms.

**Console.** 0 errors, 0 warnings across the whole session.

---

## D · Out-of-range values — recorded, not judged

All load and compute, as the pack says they currently do.

| # | Input | Grade point | Rule printed | GPA |
|---|---|---|---|---|
| 25 | `"BAN": 101` | 5.0 | mark 101 is 80 or above | 4.42 A |
| 26 | `"BAN": -5` | 0 | mark -5 is below 33 | 0.00 F |
| 27 | `PHY {theory:80, practical:20}` | 5.0 | mark 100 is 80 or above | 4.42 A |
| 28 | `PHY {theory:50, practical:30}` | 5.0 | mark 80 is 80 or above | 4.42 A |
| 29 | `"BAN": 0` | 0 | mark 0 is below 33 | 0.00 F |

For 27 the trace does write the sum out — `Physics PHY | 80 + 20 = 100` — so an
impossible theory mark is at least visible rather than hidden inside a total.

**The problem's explicit constraint holds.** Absent and a scored zero do not
produce the same output:

```
Bangla BAN | 0  | 0.0 | mark 0 is below 33
Bangla BAN | AB | 0.0 | absent — AB, grade point 0
```

The AB student also lands on the absent checking list (`Absent 1 — Absent Test
T01, Class 9 · AB in Bangla`); the zero student does not. The uncancelled average
stays visible in both: *"This student's uncancelled average of 3.58 becomes a
final GPA of 0.00 and letter F."*

---

## The open decision: should the app flag impossible marks?

**(b) — compute, but badge the subject in the trace.** Refusing a whole case over
one odd value is the one outcome that can cost us a required item on a judge's
unseen data, and computing silently contradicts the problem's own premise of
catching a wrong entry before results go out. A badge on the offending subject
row keeps every case loadable while still doing the job the school asked for.

---

## Separately — engine evidence, since I built it and cannot be the one to clear it

For whoever runs T2. The engine already survived, before this round:

- Its own suite: 26 of 26 passing (`node --test src/lib/grading.test.mjs`).
- All 25 published cases, 1,765 students: zero invariant violations — GPA finite,
  0–5, exactly 2dp; compulsory fail always both `0.00` and `F`; letter always
  agreeing with the rounded number; all 7 subjects present; absent always `null`,
  never 0; every subject carrying a rule sentence; the optional never leaking
  into `compulsoryPoints`.
- A second implementation written independently from the clarifications, diffed
  over the same 1,765 students: zero disagreements.
- `qa/qa-boundary-case.json`, 22 students: every band edge (33/39/40/49/50/59/60/
  69/70/79/80), both part-failures, absence in a compulsory and in the optional,
  the optional threshold at exactly 2.0, and the 5.00 cap — all correct.

That is exactly why T2 is worth running by someone else: the obvious paths are
covered, so what is left is what I would not think to look for.
