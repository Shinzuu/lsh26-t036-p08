# School Result Processing and GPA Engine

| Field | Value |
|---|---|
| Team | Miasma |
| Team ID | LSH26-T036 |
| Problem ID | P08 (Tier 02) |
| Live URL | https://lsh26-t036-p08.pages.dev |
| Repository | https://github.com/Shinzuu/lsh26-t036-p08 |
| Event start code | LSH26-8490-C900 |

## What it does

A secondary school works out every student's final result by hand, and the grading rules
are more intricate than they look: a subject with a practical part must be passed twice,
the optional fourth subject only helps above a threshold, and one failed compulsory
subject cancels an otherwise strong average. This app takes the raw marks and produces
the same result every time, and — the part that matters to the teacher — shows exactly
which rule produced each number, so a wrong entry is caught before results are published.

## How to run it

Live, with no setup: **https://lsh26-t036-p08.pages.dev** — it opens with a full roster
already computed. Nothing to install, no login, no configuration.

Locally:

```bash
npm install
npm run dev
```

No environment variables are required. There is no backend; the app is a pure
calculation over a JSON dataset.

## Sample data

The app is seeded on start with case PUB-01 from the organizers' participant release v2.1
fixture `P08_school_results_public.json`, copied unmodified — 80 students across Class 9
and Class 10. Any case in the same shape can also be pasted into the load box or uploaded
as a file, and the roster, traces and checking lists all recompute.

## The four required items

All four are complete and verified on the live URL. Each proof names exactly what to
click, so a judge can confirm it in under a minute without reading any code.

**1. A dataset of at least 60 students across two classes** — six compulsory subjects and
one optional fourth each, practical subjects carrying separate theory and practical marks,
including at least eight students on a hard edge. ✅

> **Proof:** open the live URL. The header reads *"80 students across Class 10 (40) and
> Class 9 (40), 6 compulsory subjects plus one optional."* Beneath it, *"Hard edges in this
> data — 29 students sit on at least one"* names a student for each of the four edge types
> the item lists: a failed subject with a strong average (Imran Sultana, averages 82.0 but
> fails Mathematics), a practical fail with a passing theory mark (Hasib Das, Chemistry
> theory 27 passes and practical 7 does not), an optional below where it helps (Lamia
> Islam, Agriculture at 36), and an absent subject (Hasib Khatun, absent in Biology). Those
> names are computed from whatever data is loaded, never hard-coded — load a different case
> with **Load other marks** and every one of them changes.

**2. Each student's result: a grade point per subject, the final GPA and the letter
grade.** ✅

> **Proof:** the **Results** panel lists all 80 students with class, GPA to two decimal
> places and letter grade, and a count of passing against failing. Select any row to see
> the subject-by-subject grade points behind it. A student with a compulsory failure — for
> example Imran Sultana (S004) — reads GPA 0.00 and F while their individual subject grade
> points remain visible and non-zero, which is what clarification R-13 requires.

**3. A per-student trace: the mark used, the grade point it produced, and the rule that
decided it — with the causing subject named when a strong average still failed.** ✅

> **Proof:** select **Imran Sultana**. The **Trace** panel shows all seven subjects with
> the real mark used (for a practical subject as `theory + practical = mark`, e.g. Physics
> `75 + 25 = 100`), the grade point, and the rule sentence that produced it (*"mark 32 is
> below 33"*, *"mark 76 is in 70–79"*). A banner reads *"Failed compulsory subject:
> Mathematics (MAT)"* and explains that the uncancelled average of 4.67 becomes 0.00 and F.
> Below, **How this GPA was reached** writes out that student's own arithmetic:
> `5.0 + 5.0 + 0.0 + 5.0 + 5.0 + 5.0 = 25.0`, then `max(0, 5.0 − 2.0) = 3.0`, then
> `(25.0 + 3.0) ÷ 6 = 4.6667`, the cap, and the cancellation.
>
> Select **Hasib Khatun** to see the absent case: Biology reads `AB`, never `0`, with the
> rule *"absent — AB, grade point 0"* and an overall result of F. A student who genuinely
> scored zero reads `0` with the rule *"mark 0 is below 33"* — the two are distinct
> outputs, as the problem's constraints require.

**4. The office's checking list before results go out.** ✅

> **Proof:** the **Checking list before results go out** panel shows three lists with
> counts — optional subject rule (25), practical fail (10), absent (2) — each with a
> one-line statement of what puts a student on it. Every entry gives the student's class
> and the specific reason (*"Agriculture (AGR) — grade point 1.0, at or below 2.0"*), and a
> student who qualifies for more than one list appears on each, badged *"also on Practical
> fail"*. The panel header states how many students are on more than one list. Clicking any
> entry opens that student's trace.

## How the engine was checked

The grading rules are a pure module, `src/lib/grading.js`, with a `node --test` suite
written before the interface — 26 cases covering every grade-band boundary (33, 39, 40, 49,
50, 59, 60, 69, 70, 79, 80), a theory fail with a passing total, a practical fail with a
passing theory, an absence in a compulsory subject, an absence in the optional, an optional
grade point of exactly 2.0 contributing nothing, the 5.00 cap, and a strong average
cancelled by one failed subject.

```bash
node --test src/lib/grading.test.mjs   # 26 pass, 0 fail
```

It was then checked a second way. A second implementation of the rules was written
independently from the published clarifications and run against all 80 seeded students:
every GPA, uncancelled average, letter grade, compulsory-point total, optional bonus and
failed-subject list matched, and all three checking lists matched exactly — 0 mismatches.
Tests prove the cases we thought of; the independent cross-check catches the ones we did
not.

## The grading rules implemented

Exactly as written in the problem statement and its published clarifications, and no
others:

- Subject grade points from the subject mark: 80+ → 5.0, 70–79 → 4.0, 60–69 → 3.5,
  50–59 → 3.0, 40–49 → 2.0, 33–39 → 1.0, below 33 → 0 and a fail.
- A subject with a practical part: theory out of 75 with a pass mark of 25, practical out
  of 25 with a pass mark of 8. Failing either part fails the subject, grade point 0. (R-11)
- Absent in a compulsory subject shows AB, grade point 0, and an overall result of F.
  Absent in the optional subject contributes 0 and puts the student on the checking
  list. (R-12)
- GPA = (the six compulsory grade points, plus the larger of 0 and the optional grade
  point minus 2) ÷ 6, capped at 5.00, to two decimal places. (R-13)
- Any compulsory failure gives GPA 0.00 and letter F, while the uncancelled average stays
  visible in the trace. (R-13)
- Letter grade from the final GPA: A+ = 5.00, A = 4.00–4.99, A- = 3.50–3.99,
  B = 3.00–3.49, C = 2.00–2.99, D = 1.00–1.99, F = fail. (R-10)
- Checking lists: optional grade point 2.0 or below (an absent optional counts);
  a practical part below 8 in any subject; an AB in any subject. A student can be on more
  than one list. (R-29)

## Major decisions

- **The organizers' fixture shape is the data model.** Rather than designing a schema and
  mapping the published sample data onto it, the app's types are the fixture's types, so
  an unpublished case in the same shape loads without a translation layer.
- **The GPA is rounded once, at two decimals, and the letter is derived from that rounded
  value**, so the letter and the number on screen can never disagree.
- **A compulsory failure zeroes the GPA but not the subject points.** The individual grade
  points and the uncancelled average stay populated, because the clarification requires
  the uncancelled average to remain visible in the trace.
- **Absent and zero are different values end to end.** An absent subject carries a null
  mark and renders as `AB`; a zero renders as `0` with the rule "mark 0 is below 33".

## What we would build next

- **Paste or upload a raw marks sheet** (CSV or tab-separated) and report which rows were
  rejected and exactly why. Right now a case must already be in the organizers' JSON shape.
- **A printable individual marksheet**, so the trace a teacher checks on screen is the
  document that goes to the parent.
- **A class summary** — pass rate, grade distribution, and the subject that failed the most
  students — which turns the checking list from a per-student task into a per-subject one.

## Known limitations

- **Nothing is persisted.** Marks live in memory for the session; reloading restores the
  seeded case. That is deliberate for a judged demo — a judge always gets a working screen
  with no stale state — but it means edits cannot be saved.
- **Marks cannot be edited in the interface.** The app computes and explains results; it
  does not enter them. Correcting a wrong mark means loading a corrected case.
- **The four hard-edge examples show one representative each**, with a count of the rest
  (*"+3 more"*). The full membership of each category is in the checking list, not the
  header strip.
- **The grading rules are exactly those in the problem statement and its clarifications,
  and no others.** They are not a general board rule engine — a school using different
  pass marks or a different optional-subject rule would need the constants changed.

## AI assistant use

Disclosed here in full. Claude Code was used throughout: to read and reconcile the
organizer documents, to author the specification in `SPEC.md`, and to implement units
against it. Every required item was verified by a human on the live URL before being
marked complete. The design decisions, the problem selection and the acceptance criteria
are the team's.

## Licences

See `LICENSES.md`.
