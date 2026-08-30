# T2 handoff → shinzuu (P08 integrator)

**Robiul · testing round T2 · the grading rules and their boundaries · 19:39, `main` at `6b40c4d`**

## Verdict

**The grading engine is correct. Nothing needs fixing before submission.**

Every value in the T2 pack's expected table is produced correctly, the 22-student
boundary case renders correctly in the real results table, and 1,765 students across all
25 published cases show zero disagreement between GPA and letter. **No blockers, no
majors.** Four minors, none of which I would spend clock on — see the decision table.

If you read one line of this file, read the operational warning below it.

---

## Operational warning — before the 21:40 phone test

**`scripts/smoke-live.sh` will tell you the deploy is stale when it is not.** It reports

```
FAIL live bundle differs from local dist
  (live: /assets/index-2l7d83Iu.js, local dist: /assets/index-C_ZqkDqh.js)
```

against a live URL that is perfectly current. I downloaded both and compared them: the
**JS is byte-identical** (`cmp`, 238578 bytes each) and the CSS differs by 550 bytes of
5th-decimal float noise in Tailwind's oklch→lab conversion. Vite's asset filename hash is
not reproducible across two machines, and the check compares filenames.

**What to do:** if the content greps pass (`ok deployed bundle contains "…"`), the deploy
is fine. Only the machine that ran the deploy can trust the filename comparison. Do not
re-deploy at 21:40 on the strength of that FAIL — that is the moment it costs the most.
Already noted in `NOTES.md` so the other sessions see it too.

---

## Decision table — all four are yours to decline

| # | What | Severity | Cost to fix | My call |
|---|---|---|---|---|
| T2-04 | `smoke-live.sh` false "stale deploy" | minor, tooling | none — it is a reading habit, above | **Do not touch the script.** Know the behaviour. |
| T2-01 | A case whose `optional` also appears in `compulsory` loads and double-counts that subject | minor | one line in `parseDataset` (U1's file) | **Your call.** Cheapest real fix on the list; also the only one that produces a wrong number. See below. |
| T2-02 | `flags.practicalFail` can list a student no practical rule failed | minor | not worth it | **Leave.** Documented in `NOTES.md`. |
| T2-03 | No test asserts the pass marks at exactly 25 and exactly 8 | minor, coverage | two asserts in U2's suite | **Leave, or Rimjhim adds it if idle.** Behaviour is correct; only the test is missing. |

### The only one worth a sentence of thought — T2-01

A student with grade point 4.0 in all six compulsory subjects should read `4.00`. If a
case sets that student's `optional` to a code already in `compulsory` (say `"MAT"`), the
app reads **4.33** — the subject is counted inside `compulsoryPoints` and again as the
optional bonus — with no warning anywhere.

- **Why it is minor:** every published case uses `HMT`/`AGR`/`REL` as the optional, none
  of which are compulsory, and SPEC.md's data model calls the optional a *fourth* subject.
  A judge's unpublished case would have to be malformed to hit it.
- **Why you might still take it:** `parseDataset` already validates that the optional
  exists in `subjects`; adding "and is not in `compulsory`" is one condition in a function
  that is already doing exactly this kind of check, and it converts a silently wrong GPA
  into the readable error message that function already specialises in.
- **Why you might not:** it is U1's file, it is post-merge, and nothing scored is broken.
  Declining this is a perfectly defensible call — R6 says the default answer to a change
  is no.

I have deliberately **not** made this change. It is outside my unit and outside my
testing remit.

---

## The open decision you asked testers to weigh in on

**Is `0` distinguishable enough from `AB` on screen?** Yes — leave it.

The constraint is that they "must not produce the same output", and the app already
produces different output in two places: the trace shows `AB` with "absent — AB, grade
point 0" versus `0` with "mark 0 is below 33", and the absent checking list names every
absentee. The results table showing both as `0.00 F` is correct, because at that point
they genuinely *do* have the same result. If anyone insists, the cheapest version is an
`AB` chip on the roster row — and only once nothing scored is open.

---

## Evidence, if a judge or a teammate asks

Everything is re-runnable rather than asserted:

```bash
node --test qa/T2-cases.mjs          # 42 pass, 2 skipped
P08_FIXTURE=<prep-repo>/brief/participant-pack-v2.1/fixtures/P08_school_results_public.json \
  node --test qa/T2-cases.mjs        # 44 pass, 0 fail
node --test src/lib/grading.test.mjs # U2's own suite: 26 pass, 0 fail
```

- `qa/T2-cases.mjs` — 44 checks. The boundary case is inlined so the file stands alone.
  Sections A–D match the sections of `qa/T2-findings.md`; the three probes carry their
  finding ids and assert *current* behaviour, so a failure there means a finding was
  fixed, not that something regressed.
- `qa/T2-findings.md` — the full write-up, including eight students hand-computed from
  the raw fixture marks with the arithmetic shown.

**What was verified, concretely:** all 22 boundary students match on grade point, GPA and
letter, confirmed both through the engine and by rendering the shipped `App.jsx` with
QA-BOUNDARY loaded (header reads `22 students · 18 passing · 4 failing`). `B12` keeps its
five non-zero subject points and its **3.33 uncancelled average** beside the `0.00`, so
R-13 holds. `P03` fails on practical 7 despite a **total of 82**. `A02` (absent optional)
is `4.00 A`, not failed, and matches `O01` exactly. `C01` caps `5.5 → 5.00`. PUB-01 reads
80 / 59 passing / 21 failing.

For step 10 I re-derived R-10's letter bands from the clarification text independently of
the engine and compared the two over all 25 cases — two implementations disagreeing is
the only thing that catches a shared assumption.

**Nothing in this round is stale-dated:** the engine has not changed since I tested it.
If U2's file changes before submission, re-run the two commands above; they take under a
second.

---

## Scope boundary — what I did *not* test

- **The trace panel itself.** I built it, so it is Dip's T3 pack, not mine. One thing I
  noticed while testing the rules and passed to him rather than fixing quietly: the
  trace's intermediate quotient prints `= 4` rather than `4.00`. The GPA lines themselves
  are correct to two decimals; this is the working above them.
- **Data loading and malformed input** (T1, Rimjhim) and **the checking lists and the
  judge's environment** (T4, Dip → you). T2-01 and T2-02 touch the edges of T1's and T4's
  territory respectively; I have written them up here rather than in their files.

---

*Demo suggestion, take it or leave it: PUB-09 `S007` is the best single student in the
published data for the video. A-grade average of 4.67, failed outright because one theory
mark came in at 24 against a pass mark of 25 — it shows R-11 and R-13 doing their work in
one screen, and the trace names the subject that caused it.*
