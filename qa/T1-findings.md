# T1 findings — data loading, validation and bad input

**Tester:** Rimjhim Dey · **Pack:** T1 · **Built by:** shinzuu (U1)
**Target:** https://lsh26-t036-p08.pages.dev — verified live, bundle
`/assets/index-2l7d83Iu.js`, which `smoke-live.sh` confirms matches `main`.
**Run:** 30 Aug, 19:25–19:40. Chrome via Playwright, plus the same
`parseDataset` / `studentResult` functions run headlessly under node.

Three findings, newest at the top. Everything else in the pack passed; the
section-by-section log is at the bottom so nobody re-runs it.

---

### [T1-03] Counts read "1 students" instead of "1 student"

- **Severity:** minor
- **Where:** header strip, hard-edges line, and the results panel's screen-reader
  summary — any case with exactly one of something.
- **Steps:** paste any case containing a single student.
- **Expected:** "1 student across Class 9 (1)", "1 student sits on at least one".
- **Actual:** `1 students across Class 9 (1), 6 compulsory subjects plus one optional.`
  · `HARD EDGES IN THIS DATA — 1 STUDENTS SIT ON AT LEAST ONE` ·
  `1 students computed. Absent Test selected.`
- **Evidence:** case `R29ab`, one student. Three separate strings, so three
  separate fixes: `DataSource.jsx` (twice) and `App.jsx`'s `sr-only` line.
- **Note:** only reachable with a one-row case. A judge pasting their own
  minimal case would see it; the seeded PUB-01 never does.

---

### [T1-02] With duplicate student ids, clicking the second one opens the first one's trace

- **Severity:** minor
- **Where:** results table → trace panel. Any case where two students share an `id`.
- **Steps:** paste a case with `D01` twice — first passing, second failing —
  then click the **second** row.
- **Expected:** the trace for the row that was clicked.
- **Actual:** the trace opens for the **first** `D01`. Clicking "Second
  Duplicate" (GPA 0.00, F) shows "Trace — First Duplicate", GPA 4.25, A.
- **Evidence:** live, case `DUP-ID`. Row text confirms two distinct students:
  `First Duplicate D01 … 4.25 A` and `Second Duplicate D01 … 0.00 F`.
  `traceOpenedFor: "First Duplicate"`.
- **Cause:** selection is by id — `store.js` does `results.find(r => r.id === selectedId)`,
  which cannot distinguish two rows sharing an id. Fixing it properly means
  selecting by index rather than id, which is an integrator-owned change to
  `store.js`; I have not touched it.
- **Weight:** duplicate ids are already listed as accepted-and-known, and are
  invalid data anyway. Filed because the pack asks whether selection "behaves
  sanely" — it does not, but nothing a judge does with valid data reaches it.

---

### [T1-01] A case with duplicate ids leaves a ghost row that survives every later case

- **Severity:** major
- **Where:** results table (required item 2), after any case with duplicate ids
  has been loaded once.
- **Steps:**
  1. Open the live URL fresh.
  2. Paste a case with two students sharing `id: "D01"` (3 students total).
  3. Paste any other valid case — I used a clean 2-student case, and separately
     the published PUB-05.
- **Expected:** the roster shows exactly the students in the newly loaded case.
- **Actual:** a row from the **discarded** case stays in the table and never
  leaves. The header, the counts line and the table disagree:

  | | header says | panel counts say | table renders |
  |---|---|---|---|
  | after clean → clean (control) | CLEAN-B, 2 students | 2 | **2 rows** ✅ |
  | after dup-id → clean | CLEAN-C, 2 students | 2 | **3 rows** ❌ |
  | after dup-id → PUB-05 | PUB-05, 64 students | 64 | **65 rows** ❌ |

  The extra row is `First Duplicate D01 … 4.25 A` — a student who is not in the
  loaded case at all. It persisted across five subsequent case loads in one
  session, and clicking it selects nothing (the trace stays on "No student
  selected"), because its id is no longer in `results`.
- **Evidence:** live. Control proves the case swap itself is clean — clean → clean
  always matches. Only a prior duplicate-id case triggers it. Full sequence
  recorded: `fresh PUB-01 80/80 → CLEAN-A 4/4 → CLEAN-B 2/2 → DUP 3/3 →
  CLEAN-C claimed 2, rendered 3`.
- **Cause:** duplicate React keys. `ResultsTable.jsx` renders rows with
  `key={r.id}`; once two rows share a key, React's reconciler keeps a stale
  child that is never unmounted, and it outlives every later dataset. React's
  duplicate-key warning is stripped from the production build, which is why the
  console is clean — I checked, 0 errors and 0 warnings throughout.
- **Fix:** one line, in my own file — key on position as well as id
  (`key={`${r.id}-${i}`}`). This is U2's file, so it is mine to repair; the fix
  is on branch `u2-grading-engine` (commit `5924283`) for the integrator to merge,
  and is verified against a local preview: the exact sequence that renders 3 rows
  live now renders 2. It does **not**
  fix [T1-02], which lives in the integrator-owned store.

---

## What passed

Nothing below needs re-testing.

**A · The seeded case (all pass).** Opens on PUB-01 with `80 students across
Class 10 (40) and Class 9 (40), 6 compulsory subjects plus one optional`. All
four hard-edge lines present, each naming a real student — Imran Sultana,
Hasib Das, Lamia Islam, Hasib Khatun — under `29 students sit on at least one`.
Results table renders exactly 80 rows. No perpetual loading, no blank panel.

**B · Loading other cases (all pass).**
- Uploading the **whole 25-case fixture file** loads PUB-01 and says so. It does
  not choke on the file holding 25 cases.
- Pasting a single case works (`TINY-01`, `RECOVER-01`, `DUP-ID`, six range cases).
- Uploading a single extracted case works (`PUB-05` → header PUB-05, 64 students,
  Class 10 (32) / Class 9 (32), all four edge lines recomputed to different
  students: Kamal Sultana, Bithi Khatun, Mahin Karim, Bithi Karim).
- **Restore sample data** returns to PUB-01, 80 rows, from any case.
- **Reload** returns to PUB-01 — nothing is persisted, as intended.
- The nine-case spread (PUB-02/05/07/11/13/17/20/23/25) was verified through the
  same `parseDataset` + `summarise` + `describeEdges` functions the live page
  calls; every student count and class split matches the fixture: 60/64/69/79/68/
  61/80/70/74, each splitting evenly across the two classes.

**C · Malformed input — 12 of 12 refused correctly on the live URL.** Every one
produced a dismissible alert naming the problem, and left the previously loaded
roster untouched on screen. No blank page, no stack trace, no silent no-op, no
wiped roster.

| # | Input | Message |
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

**23 · Recovery (pass).** After all twelve refusals in a row: a student could
still be selected and their trace rendered, and the next valid paste loaded
normally with no lingering alert. Checked twice.

**24 · Non-JSON upload (pass).** Uploaded a `.md` file. Refused with "That is not
valid JSON", roster intact at PUB-01 / 80 rows.

**31 · A big case (pass).** 1,000 students, 233 KB, uploaded: header reads
`1000 students across Class 10 (480) and Class 9 (520)`, table renders 1,000
rows, no hang. Roster search re-filtered in **30 ms**; selecting a student
re-rendered the trace in **209 ms**. Headless, the same 1,000 students parse in
2 ms and compute in 12 ms.

**Console.** 0 errors, 0 warnings across the entire session, including the
1,000-student case and all twelve refusals.

---

## D · Out-of-range values — recorded, not judged

All load and compute, as the pack says they currently do. Values are from the
live URL; the rule text is what the trace prints.

| # | Input | Grade point | Rule printed | Student GPA |
|---|---|---|---|---|
| 25 | `"BAN": 101` | 5.0 | mark 101 is 80 or above | 4.42 A |
| 26 | `"BAN": -5` | 0 | mark -5 is below 33 | 0.00 F (compulsory fail) |
| 27 | `PHY {theory:80, practical:20}` | 5.0 | mark 100 is 80 or above | 4.42 A |
| 28 | `PHY {theory:50, practical:30}` | 5.0 | mark 80 is 80 or above | 4.42 A |
| 29 | `"BAN": 0` | 0 | mark 0 is below 33 | 0.00 F |

For 27 the trace does show the sum written out — `Physics PHY | 80 + 20 = 100`
— so an impossible theory mark is at least visible as a number, not hidden
inside a total.

**29 is the constraint the problem states explicitly, and it holds.** Absent and
a scored zero render differently:

```
Bangla BAN | 0  | 0.0 | mark 0 is below 33
Bangla BAN | AB | 0.0 | absent — AB, grade point 0
```

The AB student also lands on the absent checking list (`Absent 1 — Absent Test
T01, Class 9 · AB in Bangla`), and the zero student does not. The uncancelled
average stays visible in both: `uncancelled average of 3.58 becomes a final GPA
of 0.00 and letter F`.

---

## The open decision: should the app flag impossible marks?

**(b) — compute, but badge the subject in the trace.** Refusing a whole case
over one odd value is the one outcome that can cost us a required item on a
judge's unseen data, and silence contradicts the problem's own premise of
catching a wrong entry before results go out; a badge on the offending subject
row keeps every case loadable while still doing the job the school asked for.
