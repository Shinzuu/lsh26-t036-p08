# Testing round — triage and outcome

All four packs reported. **One major, eight minors.** Everything is closed: four fixed and
re-verified on the live build, four declined with the tester's own agreement.

Integrator: shinzuu · closed 20:03 · live https://lsh26-t036-p08.pages.dev

## Fixed and re-tested on the deployed build

| id | Severity | Found by | What it was | Re-test result |
|---|---|---|---|---|
| **T1-01** | **major** | Rimjhim | A case with duplicate student ids left a ghost row that survived every later case — rows were keyed on id alone, so React's reconciler kept a stale child forever | Loaded the dup-id case (3 rows), then a clean 2-student case: **renders 2 rows**, header and count agree. Previously rendered 3. |
| **T2-01** | minor | Robiul | A case whose `optional` named a compulsory subject loaded and counted that grade point twice — 4.33 where the answer was 4.00 | Now refused: *"students[0] (S1) names \"MAT\" as its optional subject, but that is a compulsory subject."* Previous roster stays on screen. All 25 published cases still parse. |
| **T3-01** | minor | Dip | The cap line read *"5 is below the cap"* for a GPA of exactly 5.00, and printed a bare `5` where the panel uses two decimals | Now reads **"5.00 is exactly at the cap → unchanged"** beside *"GPA 5.00, grade A+"*. |
| **T1-03** | minor | Rimjhim | Three strings read *"1 students"* on a single-student case | Now reads **"1 student across Class 10 (1)"**. |

Also closed from the packs' outstanding lists:

- **Dip's item 1 — search, then clear.** Filtered the roster to "Urmi", selected S034, cleared
  the search: roster returns to 80 rows, the trace stays open on S034, and the row is still
  marked `aria-selected`. **Passes.**
- **Dip's item 2 — live vs HEAD.** Redeployed; live is current. See T2-04 below for why the
  tool said otherwise.
- **Dip's question about T4.** It was run at 19:26 — no blockers, two minors, both closed.

## Declined, deliberately

| id | Severity | Why it stays |
|---|---|---|
| **T1-02** | minor | With duplicate ids, clicking the second row opens the first one's trace. Fixing it means selecting by index instead of id, which changes a contract three components call. Duplicate ids are invalid data, and Rimjhim's own recommendation was to leave it. |
| **T2-02** | minor | `flags.practicalFail` fires on a practical part below 8 even in a subject the grader itself did not apply the part rule to. R-29's literal wording — *"a practical part below 8 in any subject"* — is satisfied, so changing it would move away from the clarification, not toward it. In `NOTES.md`. |
| **T2-03** | minor | *Taken, not declined* — the suite never asserted the pass marks at exactly 25 and 8, which is the one place a `<` written as `<=` would hide. Two tests added on both sides of each mark. 28 of 28 pass. |
| **T2-04** | minor | `smoke-live.sh` reports a stale deploy when the deploy is current, because Vite's filename hash is not reproducible across machines while the content is byte-identical. The script is not changed — changing a verification tool at 20:00 is worse than knowing its one quirk. In `NOTES.md`. |

## The T2-04 quirk, confirmed independently

Worth recording because it will come up again at 21:40. Robiul found that a live bundle and
a local build of the same commit have different filenames but byte-identical JS, with the
CSS differing only in fifth-decimal float noise from Tailwind's oklch→lab conversion.

Checking from this machine: **two consecutive clean builds of the same commit produce an
identical hash**, so the build is deterministic *per machine* — it is reproducibility
*across* machines that fails. Both readings are consistent, and together they mean the rule
is: **trust the content greps, and trust the filename comparison only on the machine that
deployed.**

## Regression after all changes

- `node --test src/lib/grading.test.mjs` — **28 pass, 0 fail** (26 original, 2 added for T2-03).
- Independent cross-check of the engine against a second implementation written from the
  clarifications, over every published case — **25 cases, 1,765 students, 0 mismatches.**
- `preflight` passes; no secrets, no template branding.
- All four required items re-verified on the live URL after the final deploy: 80 students
  across both classes with the four hard edges named; 80 rows with 59 passing; S004's trace
  naming Mathematics as the cause; the checking lists reporting 10 students on more than one.

## What the round actually bought

The major would have been invisible to us. Our console was clean all evening — React strips
its duplicate-key warning from a production build — and the header and counts both reported
the *correct* number while the table rendered a student who was not in the loaded case. Only
somebody deliberately loading malformed data and then counting rows would have found it.

That is the argument for having tested each other's work rather than our own.
