# Result Processor

Solution for **LofiStack Hackathon 2026 — P08**

## Project information

- **Team:** `Miasma`
- **Team ID:** `LSH26-T036`
- **Problem:** `P08 — School Result Processing and GPA Engine`
- **Live application:** <https://lsh26-t036-p08.pages.dev>
- **Demo video:** none supplied

> Judges will evaluate only the exact commit SHA entered in the Final Submission Form.

## Solution summary

A secondary school works out every student's final result by hand, and the grading rules
are more intricate than they look: a subject with a practical part must be passed twice,
the optional fourth subject only helps above a threshold, and one failed compulsory
subject cancels an otherwise strong average. This application takes the raw marks and
produces the same result every time — and, the part that matters to the teacher, shows
exactly which rule produced each number, so a wrong entry is caught before results are
published.

## Requirements

| Requirement | Status | Where to verify |
|---|---|---|
| R1 — A dataset of ≥60 students across two classes, six compulsory subjects and one optional each, practical subjects split into theory and practical, including ≥8 students on a hard edge | **Complete** | Landing screen, "The marks this result is built from" |
| R2 — A grade point for every subject, then the final GPA and letter grade for each student | **Complete** | "Every student's result" panel |
| R3 — A per-student trace: the mark used, the grade point it produced and the rule that decided it, naming the subject that cancelled a strong average | **Complete** | "Why that result" panel |
| R4 — A checking list of every student changed by the optional rule, a practical fail, or an absence | **Complete** | "Check these before results go out" panel |

## How to test the application

1. Open <https://lsh26-t036-p08.pages.dev>. It loads with the published sample case
   already computed — no setup, no login.
2. **R1** — the header reads *"80 students across Class 10 (40) and Class 9 (40), 6
   compulsory subjects plus one optional."* Below it, *"Hard edges in this data — 29
   students sit on at least one"* names a student for each of the four edge types the
   requirement lists. Those names are computed from whatever case is loaded, never
   hard-coded: load another case and every one of them changes.
3. **R2** — the results panel lists all 80 students with class, GPA to two decimals and
   letter grade, and a passing/failing count. A student with a compulsory failure reads
   GPA `0.00` and `F` while their individual subject grade points remain non-zero, which
   is what clarification R-13 requires.
4. **R3** — the trace opens on **Imran Sultana (S004)** without any clicking. It lists all
   seven subjects with the mark used (a practical subject as `75 + 25 = 100`), the grade
   point, and the rule sentence that produced it (*"mark 83 is 80 or above"*, *"mark 32 is
   below 33"*). A banner names **Mathematics** as the cause and shows the uncancelled
   average of **4.67** beside the final `0.00`. Below it, the GPA arithmetic is written out
   with that student's own numbers.
5. **R3, absence** — search the roster for `S032` and open **Hasib Khatun**. Biology reads
   `AB`, never `0`, with the rule *"absent — AB, grade point 0"*. A student who genuinely
   scored zero reads `0` with *"mark 0 is below 33"* — the two are distinct outputs, as the
   problem's constraints require. Use the id: fifteen names repeat in this dataset.
6. **R4** — the checking list shows three lists with counts **25 / 10 / 2**, each stating
   its rule, each entry giving that student's own reason, and students who qualify for
   more than one list appearing on each with an "also on" badge. Ten students are on more
   than one; the panel header says so.
7. **Beyond the four** — the **Sign off, then publish** section turns that checking list
   into the job the office is actually doing. The 37 list entries collapse to the **27
   distinct students** who need a human eye, each showing every reason they were flagged.
   Tick them off and the counter and progress bar move; nothing reads as ready to publish
   until all 27 are signed off. Then **Export results (CSV)** writes the office's file and
   **Print marksheet** prints the open student's trace as a statement of result.

### Test or sample data

The application is seeded on start with case **PUB-01** from the organizers' published
fixture `P08_school_results_public.json`, copied unmodified — 80 students across two
classes.

- **To load another case:** press **Load other marks**, then paste a case object or upload
  a `.json` file. A file containing several cases is accepted and its first case is used,
  so the organizers' whole fixture file can be uploaded as-is.
- **To reset:** press **Restore sample data**, or simply reload the page. Nothing is
  persisted to storage or to a server, so a reload always returns the initial data.

## Run locally

### Requirements

- Node.js 20 or newer (built and tested on 22)
- No database, no API keys, no paid account

### Setup

```bash
git clone https://github.com/Shinzuu/lsh26-t036-p08.git
cd lsh26-t036-p08
npm install
npm run dev
```

No environment variables are required. `.env.example` lists variable names only and both
are intentionally blank — the application is a pure calculation over a JSON file and uses
no backend.

To run the rule tests:

```bash
node --test src/lib/grading.test.mjs   # 28 pass, 0 fail
```

## Problem-solving approach

**How we understood the problem.** The grading rules are the whole problem and the
interface is a view of them. The requirement that earns most is not computing a GPA but
explaining it, because the school's actual pain is a wrong result reaching a parent.

**The chosen solution.** The rules live in one pure module with a `node --test` suite
written before any component. The organizers' published fixture shape was adopted directly
as the data model rather than designing our own and mapping onto it, because judges test
with cases in that shape that are not in the published pack, and a translation layer is
one more thing that can be wrong about data we have never seen.

**The most important decision.** A compulsory failure zeroes the GPA but leaves every
subject grade point and the uncancelled average populated, and the trace shows both. That
is what clarification R-13 requires, and it is also the only way a teacher can see what was
cancelled and by which subject.

**How it was tested.** Three ways. The rule suite covers every grade-band boundary and each
edge case named in the clarifications. A second implementation of the rules, written
independently from the clarifications, was run against every published case — **25 cases,
1,765 students, zero mismatches** on GPA, uncancelled average, letter, compulsory points and
all three checking lists. And each of the four requirements was verified by a team member
on the deployed URL, not on a local server, before being recorded as complete.

## Technology used

- **Frontend:** React 19, Tailwind CSS 4
- **Backend:** none — the application is a pure client-side calculation
- **Database:** none — nothing is persisted
- **Deployment:** Cloudflare Pages
- **Other material tools:** Vite 8 (build), Wrangler (deploy CLI, not shipped)
- **Exports:** CSV written in-browser with the Blob API; the marksheet uses a print
  stylesheet — no third-party export or PDF library

See [`LICENSES.md`](LICENSES.md) for third-party materials.

## Team contributions

| Registered member | GitHub username | Major contribution | Evidence |
|---|---|---|---|
| MD. Nishadul Islam Chy Shezan | `Shinzuu` | Integrator: application shell, state module, stylesheet, every merge, deploy and live verification. Also R1 — the seeded case, the fixture validator, and the hard-edge finder that derives the four edge types from whatever data is loaded. | `src/App.jsx`, `src/lib/store.js`, `src/lib/dataset.js`, `src/features/DataSource.jsx`, `src/data/seed-p08.json` |
| Rimjhim Dey | `RimjhimD` | R2 — the grading engine as a pure tested module: grade points per subject, the GPA calculation with the optional-subject rule and the 5.00 cap, letter grades, the compulsory-failure cancellation and the checking-list derivation, plus the results table. | `src/lib/grading.js`, `src/lib/grading.test.mjs`, `src/features/ResultsTable.jsx` |
| Robiul Hassan | `MDRobiulhassan` | R3 — the per-student trace: every subject with the real mark used, the grade point it produced and the rule sentence that decided it, the named subject that cancelled a strong average, and the written-out GPA arithmetic. | `src/features/StudentTrace.jsx` |
| Dip Jyoti Ghosh | `Dip-it11` | R4 — the office checking list: the three lists required by clarification R-29 with counts, each student's specific reason for appearing, and cross-list badging. | `src/features/CheckingLists.jsx` |

Commit count alone does not represent contribution. Each member also tested another
member's requirement rather than their own; the findings and their resolutions are in
[`qa/`](qa/).

## AI usage

**Claude Code (Anthropic)** was used throughout: to read and reconcile the organizer
documents, to author the build specification in [`SPEC.md`](SPEC.md), and to implement
units against that specification.

**How the output was verified.** The grading rules are covered by a `node --test` suite
exercising every grade-band boundary and each edge case named in the clarifications. The
engine was then cross-checked against a second implementation written independently from
the clarifications across all 25 published cases and 1,765 students, with zero mismatches.
Every requirement was checked by a team member on the deployed URL before being recorded
as complete, and each member tested a requirement they had not built.

## Major design decisions

- **Decision:** The organizers' published fixture shape is the application's data model,
  rather than a schema of our own with a mapping layer — so an unpublished case in the same
  shape loads unchanged.
- **Decision:** The GPA is rounded once at two decimal places and the letter grade is
  derived from that rounded value, so the letter and the number shown can never disagree at
  a band boundary.
- **Decision:** A compulsory failure zeroes the GPA and sets `F`, but leaves every subject
  grade point and the uncancelled average populated, because R-13 requires the uncancelled
  average to stay visible in the trace.
- **Decision:** An absent subject and a subject scored zero are distinct values end to end —
  absent carries a null mark and renders as `AB`, zero renders as `0` with its own rule text
  — because the problem states explicitly that they must not produce the same output.
- **Decision:** The four requirements are anchored sections on one page rather than routes
  behind navigation, so a judge reaches every scored item with no setup and no clicks.
- **Decision:** The application is built around the office's actual task — load, review,
  sign off, publish — rather than stopping at a read-only report. The checking list is the
  requirement; the sign-off queue and the two export artefacts are what make it usable by a
  school that has to hand a parent a piece of paper.
- **Decision:** Sign-off state is in memory only. A school's marks are never written to
  storage or to a server, and a judge who reloads gets a clean desk.

## Known limitations

- Nothing is persisted. Marks live in memory for the session and reloading restores the
  seeded case. Deliberate for a judged demo, but it means edits cannot be saved.
- Marks cannot be edited in the interface. The application computes and explains results;
  it does not enter them. Correcting a wrong mark means loading a corrected case.
- The hard-edge summary shows one representative per edge type with a count of the rest;
  the full membership of each category is in the checking list.
- A `compulsory` list of a length other than six is accepted and still divided by six, per
  the problem's fixed six-subject rule. A malformed case could therefore produce a high GPA
  without warning.
- On a narrow phone the trace table scrolls horizontally within its own panel to reach the
  rule column.
- The grading rules are exactly those in the problem statement and its clarifications and
  no others. This is not a general board rule engine.

## Repository records

- [`EVENT.md`](EVENT.md) — event start code and pre-event-material declaration
- [`evaluation-manifest.json`](evaluation-manifest.json) — structured judging evidence
- [`LICENSES.md`](LICENSES.md) — frameworks, libraries, templates and assets
- [`SPEC.md`](SPEC.md) — the build specification, with the clarifications verbatim
- [`qa/`](qa/) — the testing round: findings, triage and the compliance audit
