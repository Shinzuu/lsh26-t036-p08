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

Each is checkable on the live URL in under a minute.

1. **A dataset of at least 60 students across two classes**, each with six compulsory
   subjects and one optional fourth, practical subjects carrying separate theory and
   practical marks, including at least eight students on a hard edge. — *status pending*
2. **Each student's result computed under the stated rules**: a grade point for every
   subject, then the final GPA and letter grade. — *status pending*
3. **A per-student trace** showing, for every subject, the mark used, the grade point it
   produced and the rule that decided it, with the causing subject named when a student
   with a strong average still failed. — *status pending*
4. **A checking list** of every student whose result was changed by the optional subject
   rule, by a practical fail, or by an absent mark. — *status pending*

*(Each line gets a ✅ and a one-sentence proof naming what to click, filled at the freeze.)*

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

*(Filled at the freeze. Placeholders for what is already decided:)*

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

## Known limitations

*(Filled at the freeze.)*

## AI assistant use

Disclosed here in full. Claude Code was used throughout: to read and reconcile the
organizer documents, to author the specification in `SPEC.md`, and to implement units
against it. Every required item was verified by a human on the live URL before being
marked complete. The design decisions, the problem selection and the acceptance criteria
are the team's.

## Licences

See `LICENSES.md`.
