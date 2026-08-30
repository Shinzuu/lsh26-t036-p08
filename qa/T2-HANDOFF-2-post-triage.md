# T2 handoff 2 — post-triage code and document read

**Robiul · `main` at `33f3820` · written 20:36**

Supersedes nothing in `qa/T2-HANDOFF.md` — that file closed the T2 testing round, and
triage closed every item in it. This is a fresh read of the merged codebase.

**Three one-line edits in `README.md` need you. Everything else is either fine or mine.**
There is also one finding in a teammate's handoff that I could not reproduce — details at
the bottom, because it concerns my file and I would rather it were not "fixed".

---

## 1. Needs you — three edits in the judged README

All three are in `README.md`, all three are single-line, and all three are things a judge
can walk into. Ready to apply as-is.

### R1 · The item 3 proof quotes a rule sentence that is not on screen

`README.md` line 77 directs a judge to Imran Sultana's trace and quotes two rule
sentences. The first is right; **the second does not exist for that student.** S004's
seven marks are 83, 100, 32, 100, 89, 88, 86 — so every sentence on her trace is either
*"is 80 or above"* or the Mathematics *"mark 32 is below 33"*. There is no 76 and no
70–79 sentence anywhere on that student.

```
- below 33"*, *"mark 76 is in 70–79"*). A banner reads *"Failed compulsory subject:
+ below 33"*, *"mark 83 is 80 or above"*). A banner reads *"Failed compulsory subject:
```

This is the one I would fix even if you fix nothing else. Everything else in that proof
block is correct and I checked it line by line — Physics `75 + 25 = 100`, the uncancelled
4.67, and the full arithmetic `5.0 + 5.0 + 0.0 + 5.0 + 5.0 + 5.0 = 25.0`, then
`max(0, 5.0 − 2.0) = 3.0`, then `(25.0 + 3.0) ÷ 6 = 4.6667`. A judge following that block
confirms four things and fails to find the fifth, which reads as work nobody checked.

### R2 · The test count is stale in two places, one of them a runnable command

The suite is **28** since the two T2-03 boundary tests were added in triage. `README.md`
still says 26 twice, and line 108 is a command a judge can paste.

```
line 101:  - written before the interface — 26 cases covering every grade-band boundary (33, 39, 40, 49,
           + written before the interface — 28 cases covering every grade-band boundary (33, 39, 40, 49,

line 108:  - node --test src/lib/grading.test.mjs   # 26 pass, 0 fail
           + node --test src/lib/grading.test.mjs   # 28 pass, 0 fail
```

`qa/TRIAGE.md` already records 28 correctly, so this is only the judged file.

### R3 · "Select Hasib Khatun" is ambiguous — that name is in PUB-01 three times

Fifteen names are duplicated in the seeded case; **Hasib Khatun appears 3 times** and only
S032 is the absent one. The hard-edges line is a button, so a judge who *clicks* lands on
the right student. A judge who types the name into the roster search gets three rows, and
opening either of the other two shows no `AB` — which makes the claim look false.

```
line 83:  - > Select **Hasib Khatun** to see the absent case: Biology reads `AB`, never `0`, with the
          + > Select **Hasib Khatun (S032)** to see the absent case: Biology reads `AB`, never `0`, with the
```

Item 2's proof already names its student as "Imran Sultana (S004)" — this just makes item
3 consistent with it.

---

## 2. Also outstanding, already tracked elsewhere

- **The repository is still private** — `api.github.com/repos/Shinzuu/lsh26-t036-p08`
  returns 404. Already the top line of `qa/COMPLIANCE.md`, so I am not duplicating it as a
  finding; noting only that I confirmed it independently at 20:33.
- **`SUBMISSION.md` has a stale tick.** "Fill the four `registered_name` fields" is still
  unchecked, but `f4115c6` did it — the manifest carries all four names with evidence
  paths. Cosmetic, and only if you are passing through that file anyway.

---

## 3. A finding of mine I am *not* asking you to act on

**The practical pass mark now exists in three places.** `grading.js` owns it as
`PRACTICAL_PASS`; `dataset.js` redeclares it as `PRACTICAL_PASS_MARK` with a comment
explaining why the ingest layer should not import the engine, which I think is right; and
`CheckingLists.jsx:68` uses a bare `8` with no comment. All three agree today, so nothing
is wrong on screen. Related and mine: `StudentTrace.jsx` hardcodes the cap as `5` because
`GPA_CAP` is not exported from `grading.js`.

Both are single-character-risk items in code nobody is going to change tonight. Recording
them so they are known, not proposing a change at 20:36.

---

## 4. Correction: T1's F-03 does not reproduce

`qa/T1-HANDOFF-2-post-triage.md` F-03 says an eighth mark "produces eight entries in
`subjects`, so the trace lists a subject the student does not sit," and recommends leaving
it because "the fix touches the trace."

**The first half is true and the conclusion is not.** `subjects` does carry eight entries —
the engine reads whatever `marks` it is given. But `StudentTrace` never iterates
`Object.keys(result.subjects)`. It builds its rows from `dataset.compulsory` plus that
student's own `optional`, which is exactly seven codes, deliberately, so that all seven
render even when the engine hands back a partial result. An extra subject in `marks` has
nowhere to appear.

Checked, not argued — a case with an eighth subject (`AGR`, theory 50 / practical 3) on a
student whose optional is `REL`, rendered through the shipped component:

```
Bangla BAN | 70 | 4.0 | mark 70 is in 70–79
English ENG | 70 | 4.0 | ...
Mathematics MAT | 70 | 4.0 | ...
Physics PHY | 50 + 20 = 70 | 4.0 | ...
Chemistry CHE | 50 + 20 = 70 | 4.0 | ...
Biology BIO | 50 + 20 = 70 | 4.0 | ...
Religion REL optional | 45 | 2.0 | mark 45 is in 40–49
```

**Seven rows. AGR is absent from the trace**, and the GPA reads 4.00 as it should.

There *is* a real consequence of an eighth mark, and it is the one I filed as T2-02 in the
first round: `flags.practicalFail` reads across every entry in `subjects`, so AGR's
practical of 3 puts this student on the **checking list**. That was declined in triage on
the grounds that R-29's literal wording is satisfied, and I still agree with declining it.

So: no change to the trace, and F-03 can be closed as not-reproducible rather than as
declined. I have said the same in one line in `NOTES.md`. Rimjhim reasoned from the shape
of `subjects`, which is a completely reasonable place to look — the row list just does not
come from there.

---

## 5. What I re-verified on the merged build, so you do not have to

Pulled `main` after your triage merge and checked the state myself rather than reading the
triage file and nodding.

| Check | Result |
|---|---|
| `npm run build` | ✓ 181 ms · 239.57 kB JS, 71.80 kB gzip |
| `node --test src/lib/grading.test.mjs` | **28 pass, 0 fail** |
| `node --test qa/T2-cases.mjs` (mine) | **45 pass, 0 fail** with the fixture, 43 + 2 skipped without |
| `bash scripts/preflight.sh` | passed — no secrets, no template branding |
| Live URL | HTTP 200 |
| README item 1 proof numbers | ✓ 80 students, Class 10 (40) / Class 9 (40), 29 on a hard edge, all four edge names and details match the app exactly |
| README item 4 proof numbers | ✓ 25 / 10 / 2, and 10 students on more than one list |
| README item 3 proof numbers | ✓ except R1 above |

**Your three fixes, checked rather than assumed:**

- **T1-01** — the row key now carries position, so duplicate ids can no longer share a key.
  The reconciler cannot keep a stale child.
- **T2-01** — the `parseDataset` guard is in the right place and the message names the
  subject. I added a test that the guard does not over-reject: **all 25 published cases,
  the QA boundary case and a normal optional still parse.** That was the risk worth
  checking on this one, since a validator that refuses a judge's case is worse than the
  bug it fixes.
- **T3-01** — the cap line now reads *"5.00 is exactly at the cap → unchanged"* at exactly
  5.00, and still reads *"above 5.00 → 5.00"* above it.

One housekeeping note: my `D · [T2-01]` probe deliberately pinned the *pre-fix* behaviour,
so your fix turned it red, exactly as its comment said it would. I have updated it to
assert the fix instead (`33f3820`). Nothing was wrong with your change.

---

## 6. Status of my unit

Required item 3 is merged, deployed and verified live. Nothing outstanding on it, and I am
proposing no change to `StudentTrace.jsx`. Available for whatever you need next —
including applying the three README edits above if you would rather hand them off than do
them yourself.
