# SPEC — P08 School Result Processing and GPA Engine (Tier 02, 7.5 credit)

Repo `lsh26-t036-p08` · live https://lsh26-t036-p08.pages.dev · kit `starter-kit-react`
Team LSH26-T036 · event start code `LSH26-8490-C900`

This problem is a rules engine wearing a school costume. There is no map, no realtime,
no LLM, no auth, and no backend. Everything is a pure function over one JSON dataset,
which means it is unusually testable and unusually easy to get subtly wrong. The marks
live in getting the seven rules exactly right and showing the working.

---

## The four required items, verbatim

1. Create at least 60 students across two classes. Every student has six compulsory
   subjects and one optional fourth subject. Subjects with a practical part carry a
   separate theory mark and practical mark. Include at least eight students who land on
   a hard edge: one failed subject with a strong average, a practical fail with a
   passing theory mark, an optional subject below the point where it helps, and a
   student absent in one subject.
2. Work out each student's result using the rules above. Give a grade point for every
   subject, then the final GPA and the letter grade for the student.
3. Show a per student trace. For every subject, show the mark used, the grade point it
   produced and the rule that decided it. Where a student with a high average still
   failed, the trace must show the subject that caused it.
4. Give the office a checking list before results go out: every student whose result was
   changed by the optional subject rule, by a practical fail, or by an absent mark, so a
   teacher can verify those by hand.

### Constraints, verbatim

- Use the grading rules exactly as written in the problem. A different board's rules
  will not score.
- The trace must show the real numbers used for that student, not a general explanation
  of the rule.
- A student absent in a subject is not the same as a student who scored zero. Both must
  be handled and they must not produce the same output.

### Clarifications — judges mark by these

- Theory is out of 75 with a pass mark of 25. Practical is out of 25 with a pass mark of
  8. Failing either part fails the subject: grade point 0. (R-11)
- Absent in a compulsory subject: show AB, subject grade point 0, overall result F.
  Absent in the optional subject: it contributes 0 and the student appears on the
  checking list. (R-12)
- GPA = (sum of the compulsory grade points + the larger of 0 and the optional grade
  point minus 2) divided by 6, capped at 5.00, shown to 2 decimal places. (R-13)
- Any compulsory failure gives GPA 0.00 and letter F; the uncancelled average stays
  visible in the calculation trace. (R-13)
- Letter grade from the final GPA: A+ = 5.00, A = 4.00 to 4.99, A- = 3.50 to 3.99,
  B = 3.00 to 3.49, C = 2.00 to 2.99, D = 1.00 to 1.99, F = fail. (R-10)
- Checking lists: optional list = every student whose optional grade point is 2.0 or
  below (an absent optional counts); practical fail list = every student with a
  practical part below 8 in any subject; absent list = every student with AB in any
  subject. A student can be on more than one list. (R-29)

### The subject grade scale, from the problem statement

80 and above → 5.0 · 70–79 → 4.0 · 60–69 → 3.5 · 50–59 → 3.0 · 40–49 → 2.0 ·
33–39 → 1.0 · below 33 → 0 and counts as a fail.

---

## Data model

The organizers' fixture shape **is** the data model. Do not invent one and map to it
later — judges test with unpublished cases in this exact shape.

```
Dataset:
  case_id:     string
  subjects:    [{ code: string, name: string, practical: boolean }]      // 9 subjects
  compulsory:  [string]                                                   // 6 codes
  students:    [Student]

Student:
  id:       string          // "S001"
  name:     string
  class:    string          // "Class 9" | "Class 10"
  optional: string          // one of "HMT" | "AGR" | "REL"
  marks:    { [subjectCode]: Mark }    // exactly 7 entries: the 6 compulsory + the optional

Mark = number                              // subject with no practical, 0..100
     | { theory: number, practical: number } // theory 0..75, practical 0..25; mark = sum
     | "AB"                                  // absent in that subject
```

Reference case PUB-01 in `P08_school_results_public.json`: 80 students, Class 9 × 40 and
Class 10 × 40, optionals split HMT 30 / AGR 18 / REL 32, two students with an AB, ten
students with a practical part below 8. It satisfies item 1 on its own.

**Storage:** none. The dataset lives in React state, seeded from a bundled JSON on first
load. No localStorage, no Supabase — the app is a calculator, and persistence buys no
mark here.

**Seed data:** `src/data/seed-p08.json` is fixture case PUB-01 copied verbatim. The app
opens with all 80 students already computed. A judge never sees an empty state.

---

## The store module — integrator-owned, export shape fixed here

`src/lib/store.js`. Nobody but the integrator edits this file. Every unit imports from
it and can rely on exactly these names:

```js
export function useDataset()      // -> { dataset, results, load, error }
export function useSelected()     // -> { selectedId, select }
```

`results` is an array of `studentResult` objects in dataset order, recomputed whenever
`load(dataset)` is called. `load` throws nothing; it sets `error` to a string on a bad
shape and leaves the previous dataset in place.

---

## The engine — U2 owns it, everyone else imports it

`src/lib/grading.js`. These signatures are fixed. U3 and U4 build against them
immediately without waiting for U2 to finish.

```js
export const THEORY_TOTAL = 75
export const THEORY_PASS = 25
export const PRACTICAL_TOTAL = 25
export const PRACTICAL_PASS = 8

// raw: number | {theory, practical} | "AB"
// -> { absent, mark, theory, practical }   // mark/theory/practical are null when absent
export function readMark(raw)

// mark: number -> 5 | 4 | 3.5 | 3 | 2 | 1 | 0
export function gradePointForMark(mark)

// -> { absent, mark, theory, practical, gradePoint, failed, rule }
// `rule` is the short human sentence the trace prints, built from this student's real
// numbers, e.g. "absent — AB, grade point 0", "practical 6 is below the pass mark of 8",
// "theory 21 is below the pass mark of 25", "mark 31 is below 33", "mark 74 is in 70–79".
export function subjectResult(raw, hasPractical)

// -> {
//   id, name, class: className, optional,
//   subjects: { [code]: subjectResult },   // all 7
//   compulsoryPoints,                       // sum of the 6 compulsory grade points
//   optionalGradePoint,
//   optionalBonus,                          // Math.max(0, optionalGradePoint - 2)
//   uncancelledGpa,                         // (compulsoryPoints + optionalBonus) / 6, capped 5, 2dp
//   failedCompulsory,                       // [code] — every compulsory subject with grade point 0
//   gpa,                                    // 0 when failedCompulsory.length > 0, else uncancelledGpa
//   letter,                                 // 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F'
//   flags: { optionalRule, practicalFail, absent }
// }
export function studentResult(student, dataset)

export function letterGrade(gpa, hasCompulsoryFail)

// results: studentResult[] -> { optional: [], practicalFail: [], absent: [] }
export function checkingLists(results)
```

Four decisions that are easy to get wrong, decided here so nobody decides them twice:

1. **Rounding.** Compute the GPA exactly, cap at 5, then round to 2 decimals once. Derive
   the letter from that rounded value so the letter and the number on screen always
   agree. A student at 3.995 shows 4.00 and gets an A, not an A-.
2. **A compulsory fail zeroes the GPA, not the subject points.** `gpa` becomes 0 and the
   letter F, but `compulsoryPoints`, every `subjectResult.gradePoint`, and
   `uncancelledGpa` stay populated — R-13 requires the uncancelled average to remain
   visible in the trace.
3. **Absent is not zero.** `readMark("AB")` sets `absent: true` and `mark: null`. The
   trace prints `AB`, never `0`. A student who scored 0 prints `0` and the rule "mark 0
   is below 33". These must not render the same — it is an explicit constraint.
4. **The optional subject never enters `compulsoryPoints`** and never changes the
   divisor, which is always 6.

`src/lib/grading.test.mjs` runs under `node --test` and must cover, at minimum: each
band boundary (33, 39, 40, 49, 50, 59, 60, 69, 70, 79, 80), a theory fail with a passing
total, a practical fail with a passing theory, an AB in a compulsory subject, an AB in
the optional, an optional grade point of exactly 2.0 contributing nothing, a 5.00 cap,
and a strong average cancelled by one failed subject.

---

## Screens

One screen, three panels, no router.

- **Header** — school name, the case id loaded, student count, and the load control.
- **Left: roster** — searchable list of all students with class, GPA and letter. Clicking
  one selects it.
- **Right: trace** — the selected student's seven subjects, then the GPA calculation.
- **Below: checking lists** — three labelled lists with counts.

Theme: `civic` — this is a records-and-forms domain. One `@import` line in `app.css`,
integrator only.

## Recipes used

- `search-filter/search.js` → roster search in U1's list, if the roster needs it.
- `bd-formats/numerals.js` → only if Bangla digits are wanted; not required.
- Nothing else. No map, no realtime, no LLM, no auth, no upload.

---

## Unit list — build order is item order

Every function name below appears in exactly one unit's scope.

**U1 (item 1) — dataset and ingest.** Branch `u1-dataset`.
Files: `src/data/seed-p08.json`, `src/lib/dataset.js`, `src/features/DataSource.jsx`.
Copy fixture case PUB-01 verbatim into `seed-p08.json`. `dataset.js` exports
`parseDataset(json)` which validates the shape and throws a readable message, and
`SEED` which is the parsed seed. `DataSource.jsx` renders the header strip: case id,
student count, class breakdown, a textarea that accepts a pasted case object, and a file
input. It also renders a short "hard edges in this data" line naming the students that
land on each edge, so a judge can find them without hunting.
*Done when:* the live URL opens with 80 students across two classes listed and no upload
performed; pasting case PUB-02 from the public fixture swaps the roster and the count
changes on screen.

**U2 (item 2) — the grading engine and results table.** Branch `u2-grading-engine`.
Files: `src/lib/grading.js`, `src/lib/grading.test.mjs`, `src/features/ResultsTable.jsx`.
Write the contract and the `node --test` suite before the component — this is the
no-recipe bullet and it goes tests-first. `ResultsTable.jsx` renders every student with
class, GPA to 2 decimals, and letter, with failing students visually distinct.
*Done when:* the live URL lists all 80 students with a GPA and a letter; a student with a
compulsory fail shows GPA 0.00 and F while their individual subject grade points are
still visible and non-zero.

**U3 (item 3) — the per-student trace.** Branch `u3-trace`.
Files: `src/features/StudentTrace.jsx`.
For the selected student, one row per subject: subject name, the mark used (for a
practical subject show `theory + practical = mark`, for an absent subject show `AB`), the
grade point, and the rule sentence from `subjectResult.rule`. Below the rows, the GPA
calculation written out with this student's real numbers: the six compulsory points
summed, the optional bonus as `max(0, gp − 2)`, the division by 6, the cap, and the
result. When `failedCompulsory` is non-empty, a banner names those subjects and shows
the uncancelled average beside the final 0.00 so the teacher sees what was cancelled.
*Done when:* on the live URL, clicking a student opens a trace listing all seven subjects
with mark, grade point and rule text; for a student with a high uncancelled average and a
compulsory fail, the trace names the subject that caused the F.

**U4 (item 4) — the checking lists.** Branch `u4-checking-lists`.
Files: `src/features/CheckingLists.jsx`.
Three lists side by side, each with a count and a one-line explanation of what puts a
student on it: optional list (optional grade point 2.0 or below, an absent optional
counts), practical fail list (a practical part below 8 in any subject), absent list (an
AB in any subject). Each entry links to that student's trace. A student appearing on more
than one list appears on each.
*Done when:* the live URL shows the three lists with counts, and at least one student is
visibly present on two of them.

**U5+ (only after 4/4).** Bonus features, in this order of value: paste-a-marksheet
import that reports which rows were rejected and why; class summary with pass rate,
grade distribution and the subject that failed the most students; printable individual
marksheet.

---

## Out of scope — written down so nobody builds it

Authentication. User accounts. Persistence of any kind. A second route. Editing marks in
the UI. Dark mode. Any grading rule from a real board that is not written in this file.
Charts, unless item 4's bonus class summary is reached after 4/4.

---

## Acceptance script

Qualitative assertions, not baked-in numbers — seed values move.

1. Open the live URL cold → the roster is already populated with students across two
   classes, and the header states how many.
2. Read the header's hard-edges line → it names a student for each of the four edges.
3. Click a student with a clean record → the trace shows seven subjects, each with a
   mark, a grade point and a rule; the GPA calculation below adds up to the GPA shown in
   the roster.
4. Click the flagged student who has a strong average but one failed compulsory subject →
   GPA reads 0.00 and F, the banner names the failing subject, and the uncancelled
   average is still shown beside it.
5. Click a student with a practical fail → the trace shows the theory mark passing and
   the practical mark below 8, and the rule sentence says the practical caused it.
6. Click the student with an AB → the trace prints AB, not 0, and the rule says absent.
7. Scroll to the checking lists → three lists with counts; point at a student who is on
   two of them.
8. Paste fixture case PUB-02 into the load box → the roster, the traces and the lists all
   change, and the case id in the header updates.

---

## Ready-to-paste unit prompts

Fill `<name>` from PICKS.md. One per unit, per session.

```text
Set effort low. Read CLAUDE.md, SPEC.md and BOARD.md in full. This repo is P08; you are
the builder for unit U1, owned by <name>, on branch u1-dataset. Build only U1 — its files
are src/data/seed-p08.json, src/lib/dataset.js, src/features/DataSource.jsx. Shared files
(App.jsx, src/lib/store.js, app.css, index.html, package.json) are off limits; if you need
a change there, write the exact diff as a request on BOARD.md instead of making it.

Build: copy fixture case PUB-01 verbatim into src/data/seed-p08.json. Export
parseDataset(json) and SEED from src/lib/dataset.js — parseDataset validates the fixture
shape and throws a readable message naming the missing field. DataSource.jsx renders the
header strip: case id, student count, class breakdown, a paste textarea and a file input
that both call parseDataset, and a "hard edges in this data" line naming a student for
each of: a failed subject with a strong average, a practical fail with a passing theory
mark, an optional below the point where it helps, and an absent subject.

Done means: npm run build passes AND the live URL opens with 80 students across two
classes listed without any upload, and pasting fixture case PUB-02 swaps the roster and
changes the count. Verify with bash scripts/smoke-live.sh <url> first, then in a browser.
Return: files changed, the build output tail, and how you verified the done-when.
```

```text
Set effort low. Read CLAUDE.md, SPEC.md and BOARD.md in full. This repo is P08; you are
the builder for unit U2, owned by <name>, on branch u2-grading-engine. Build only U2 — its
files are src/lib/grading.js, src/lib/grading.test.mjs, src/features/ResultsTable.jsx.
Shared files are off limits; request changes on BOARD.md.

This is the no-recipe unit: write the contract and the node --test suite BEFORE the
component. Implement exactly the export shape in SPEC.md's "The engine" section — U3 and
U4 are already coding against those names. Follow SPEC.md's four decisions verbatim:
round the GPA once at 2dp and derive the letter from the rounded value; a compulsory fail
zeroes the GPA but leaves subject points and the uncancelled average populated; absent
renders as AB and never as 0; the optional never enters the compulsory sum and the
divisor is always 6. Tests must cover every band boundary (33, 39, 40, 49, 50, 59, 60, 69,
70, 79, 80), a theory fail with a passing total, a practical fail with a passing theory,
an AB in a compulsory subject, an AB in the optional, an optional grade point of exactly
2.0, the 5.00 cap, and a strong average cancelled by one failed subject.

Done means: node --test src/lib/grading.test.mjs passes, npm run build passes, AND the
live URL lists every student with a GPA to 2 decimals and a letter, with a compulsory-fail
student showing 0.00 and F while their subject grade points remain visible and non-zero.
Return: files changed, the test output tail, the build output tail, and how you verified
the done-when.
```

```text
Set effort low. Read CLAUDE.md, SPEC.md and BOARD.md in full. This repo is P08; you are
the builder for unit U3, owned by <name>, on branch u3-trace. Build only U3 — its file is
src/features/StudentTrace.jsx. Shared files are off limits; request changes on BOARD.md.
Import from src/lib/grading.js and src/lib/store.js; do not edit either.

Build the per-student trace for the selected student. One row per subject: subject name,
the mark used — for a practical subject show theory + practical = mark, for an absent
subject show AB and never 0 — the grade point, and the rule sentence from
subjectResult.rule. Below the rows, write out the GPA calculation with this student's real
numbers: the six compulsory points summed, the optional bonus as max(0, gp − 2), the
division by 6, the cap, the result. When failedCompulsory is non-empty, show a banner
naming those subjects with the uncancelled average beside the final 0.00.

The constraint judges mark by: the trace must show the real numbers used for that student,
not a general explanation of the rule.

Done means: npm run build passes AND on the live URL, clicking a student opens a trace
listing all seven subjects with mark, grade point and rule text, and for a student with a
high uncancelled average and a compulsory fail the trace names the subject that caused the
F. Return: files changed, the build output tail, and how you verified the done-when.
```

```text
Set effort low. Read CLAUDE.md, SPEC.md and BOARD.md in full. This repo is P08; you are
the builder for unit U4, owned by <name>, on branch u4-checking-lists. Build only U4 — its
file is src/features/CheckingLists.jsx. Shared files are off limits; request changes on
BOARD.md. Import checkingLists from src/lib/grading.js; do not edit it.

Build three lists side by side, each with a count and a one-line explanation of what puts
a student on it, exactly per clarification R-29: optional list = optional grade point 2.0
or below, an absent optional counts; practical fail list = a practical part below 8 in any
subject; absent list = an AB in any subject. A student can be on more than one list and
must appear on each. Each entry selects that student so their trace opens.

Done means: npm run build passes AND the live URL shows the three lists with counts, with
at least one student visibly present on two of them. Return: files changed, the build
output tail, and how you verified the done-when.
```
