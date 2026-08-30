# T1 handoff 2 — post-triage code read

**From:** Rimjhim Dey (`RimjhimD`) · U2 — grading engine, test suite, results table
**To:** shinzuu, integrator
**Project:** P08 · Result Processor — School Result Processing and GPA Engine
Team Miasma · LSH26-T036 · https://lsh26-t036-p08.pages.dev
**Written:** 30 Aug, 20:10 — after the triage round closed (`9b25ea7`), against a
21:15 merge freeze.

This is the second and final handoff from me. The first (`qa/T1-HANDOFF.md`)
covered the T1 test pack. This one covers a whole-codebase read done after your
merge, and carries **three findings that exist in no other file**.

---

## Decision needed from you: one guard, or decline it

Findings F-01 and F-02 are closed by a single check in `src/lib/dataset.js` —
**require `compulsory` to hold exactly six distinct codes, and refuse anything
else with a message naming what was wrong.** That file is yours, so I have not
touched it; this is a request, not a change.

Both readings are defensible and I am not pushing for either:

- **Take it** — it is the same class of defect as T2-01, which you chose to
  refuse rather than compute, and the message can follow the wording you already
  wrote there.
- **Decline it** — every published case carries exactly six compulsory subjects,
  judges test "in this exact shape", so realistic likelihood is low, and editing
  the validator an hour before the freeze carries its own risk.

If you decline, say so and I will record it as declined in the triage file. What
should not happen is it sitting undecided.

---

## The three findings

One root cause: **`parseDataset` validates that fields are present, but never
their cardinality or uniqueness**, while `grading.js` hard-codes `DIVISOR = 6`
per R-13. Where the data disagrees with that assumption, the app computes
confidently instead of refusing.

### F-01 · `compulsory` length is unchecked against the hard-coded divisor

A case declaring **seven** compulsory subjects loads without complaint:

```
compulsory: 7 codes  →  compulsoryPoints 29  →  29 ÷ 6 = 4.83  + optional bonus  → capped
on screen:  GPA 5.00, grade A+
```

R-13 fixes the divisor at 6, so a seven-subject case is structurally invalid for
this problem. Nothing says so. The screen shows a confident, wrong, top grade.
Severity: **minor**, on likelihood alone — the failure mode itself is the bad
kind, a silent wrong answer rather than a visible error.

### F-02 · A duplicate code inside `compulsory` is counted twice

```
compulsory: ["BAN","BAN","ENG","MAT","PHY","CHE"]   — five distinct subjects
compulsoryPoints 24 (BAN counted twice)  →  GPA 4.25, grade A, no warning
```

Severity: **minor**. Same guard closes it.

### F-03 · Marks beyond the seven render extra trace rows

A student carrying an eighth mark, for a subject that is neither compulsory nor
their own optional, produces eight entries in `subjects`, so the trace lists a
subject the student does not sit. The GPA is unaffected — the extra subject
enters neither the compulsory sum nor the optional bonus.

Severity: **minor, cosmetic.** My recommendation is to leave it: it is only
reachable on data the problem never describes, and the fix touches the trace.

---

## What I verified before writing this

Pulled `main` at 20:10 and checked the merged state myself rather than taking
the triage file on trust.

| Check | Result |
|---|---|
| `node --test src/lib/grading.test.mjs` | **28 pass, 0 fail** (my 26, plus 2 added for T2-03) |
| `npm run build` | ✓ 270 ms · 239.57 kB, 71.80 kB gzip |
| `bash scripts/preflight.sh` | passed — no secrets, no template branding |
| Live URL | 200 |
| Tracked files | 41 — `src/recipes/`, `db.js`, Supabase and the four unused themes are genuinely gone, matching what `evaluation-manifest.json` declares |
| Runtime dependencies | `react` + `react-dom`, nothing else |

**T1-01 confirmed fixed on the deployed build**, re-run by me rather than assumed:
loading the duplicate-id case gives 3 rows, then a clean 2-student case claims 2
and renders 2, first row `C1 C01`. That same sequence rendered 3 before the fix.

Landing screen reads PUB-01, 80 students across Class 10 (40) and Class 9 (40),
80 rows, 80 students / 59 passing / 21 failing.

`evaluation-manifest.json` R4 evidence claims checking-list counts of 25 / 10 / 2;
I recomputed those from the engine against PUB-01 and they match exactly.

---

## Status of my unit

Required item 2 is complete, merged and live. Engine, suite and results table are
all in `main`. I have nothing outstanding and nothing uncommitted.

The only open question on my side is the decision at the top of this file.
