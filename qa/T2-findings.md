# T2 findings — Robiul — the grading rules and their boundaries

Tested against `main` at `f4115c6` and the live URL. **No blockers. No majors.** Every
value in the pack's expected table is produced correctly by the shipped engine, and the
22-row boundary case renders correctly in the real results table.

Four minor findings below, then the evidence, then the open decision.

Every case behind this file is runnable: `node --test qa/T2-cases.mjs` — 44 checks,
44 passing. Two of them need the organizers' fixture, which lives in the prep repo, so
they skip unless you point at it:
`P08_FIXTURE=/path/to/P08_school_results_public.json node --test qa/T2-cases.mjs`.
The section letters in that file match the section letters here, and the three probes
carry their finding ids. Those three assert *current* behaviour — if one starts failing,
the finding it documents has been fixed and this file needs updating.

---

### [T2-04] `smoke-live.sh` reports a stale deploy when the deploy is current

- **Severity:** minor (tooling, not the app — but it can waste the 21:40 window)
- **Where:** `scripts/smoke-live.sh`, staleness check, against https://lsh26-t036-p08.pages.dev
- **Steps:** `npm run build` on `main` at `f4115c6`, then
  `bash scripts/smoke-live.sh https://lsh26-t036-p08.pages.dev`
- **Expected:** the check passes, because the deployed build is current — the last two
  commits touched only `README.md`, the manifest and `src/App.jsx`'s skip links.
- **Actual:** `FAIL live bundle differs from local dist (live: /assets/index-2l7d83Iu.js,
  local dist: /assets/index-C_ZqkDqh.js)` — while all four content greps passed.
- **Evidence:** I downloaded both and compared them directly:
  - JS: live `238578` bytes, local `238578` bytes, **`cmp` says byte-identical**.
  - CSS: same length, differs in **550 bytes**, all of it 5th/6th-decimal float noise in
    Tailwind's oklch→lab conversion — e.g. live `lab(97.6676% -.215054 -1.49847)` vs
    local `lab(97.6676% -.215024 -1.49848)`.

  So Vite's filename hash is not reproducible across two machines, and the staleness
  check compares filenames. **The deploy is current; the tool is wrong.** Anyone who did
  not personally run the deploy will see this FAIL. At 21:40 that reads as "the site is
  stale" and invites a re-deploy nobody needs. Suggested handling: treat a filename
  mismatch as informational when the content greps pass, or only trust the check on the
  machine that deployed.

### [T2-01] A case whose `optional` names a compulsory subject loads, and double-counts it

- **Severity:** minor (needs a malformed case; would be major if a judge's case does it)
- **Where:** `src/lib/dataset.js` `parseDataset`, feeding `studentResult`
- **Steps:** build a case identical to the boundary one but set a student's
  `optional` to `"MAT"`, which is already in `compulsory`. Load it.
- **Expected:** either rejected with a readable message, or the subject counted once.
- **Actual:** `parseDataset` **accepts** it. `MAT`'s grade point is then counted inside
  `compulsoryPoints` *and* again as the optional bonus.
- **Evidence:** a student with grade point 4.0 in all six compulsory subjects should read
  `(4×6)/6 = 4.00`. With `optional: "MAT"` the app reads **4.33** — `compulsoryPoints 24`,
  plus `optionalBonus max(0, 4−2) = 2`, `(24+2)/6 = 4.33`. No warning anywhere.
- **Why it is only minor:** every published case sets `optional` to `HMT`/`AGR`/`REL`,
  none of which are compulsory, and the data model in SPEC.md says the optional is a
  *fourth* subject. A judge's unpublished case would have to be malformed to hit it.
- **Fix if wanted (one line, U1's file):** `parseDataset` already checks the optional is
  in `subjects`; add that it is *not* in `compulsory`.

### [T2-02] The practical-fail checking list can flag a student no practical rule failed

- **Severity:** minor
- **Where:** `src/lib/grading.js`, `flags.practicalFail`, feeding U4's checking list
- **Steps:** two ways to reach it, both needing a case shaped unusually:
  1. give a subject declared `"practical": false` a `{theory, practical}` mark with the
     practical part below 8;
  2. put a subject in a student's `marks` that is neither compulsory nor their optional,
     with a practical part below 8.
- **Expected:** the practical-fail list holds students whose result a practical fail
  actually changed — that is what "verify these by hand" is for.
- **Actual:** in case 1 the subject is correctly graded on its total (`{theory 60,
  practical 5}` → mark 65 → grade point **3.5**, rule "mark 65 is in 60–69" — the part
  rule is correctly *not* applied), but `flags.practicalFail` is still `true` and the
  student appears on the practical-fail list. In case 2 the extra subject counts toward
  nothing yet still sets the flag.
- **Evidence:** probe output — `BAN = {theory 60, practical 5}` on a `practical:false`
  subject: `GPA 3.92 A-`, `failedCompulsory []`, `checking lists: optional, practicalFail`.
- **Note:** R-29's literal wording is "every student with a practical part below 8 in any
  subject", which the flag satisfies. The inconsistency is internal: the grader ignores a
  part it does not believe in, the list does not. Worth one line in `NOTES.md` at minimum
  so U4's list is not mistrusted if it ever happens.

### [T2-03] No test covers the pass marks at exactly 25 and exactly 8

- **Severity:** minor (test coverage — step 16 of the pack)
- **Where:** `src/lib/grading.test.mjs`
- **Steps:** `grep -oE "theory: [0-9]+, practical: [0-9]+" src/lib/grading.test.mjs`
- **Expected:** R-11's two pass marks tested on both sides — 24 fails / **25 passes**,
  7 fails / **8 passes**.
- **Actual:** the suite uses only three split marks: `21/24` (theory fail), `52/19`
  (a clean pass, both parts comfortably clear), `60/6` (practical fail). **The
  exactly-at-the-pass-mark case is never asserted**, which is precisely where a `<` that
  should be `<=` would hide.
- **Evidence:** 26/26 pass, and the behaviour is in fact correct — the QA-BOUNDARY case's
  `P01` (`theory 25, practical 8`) grades to 1.0 and the student passes at 3.50 A-. So
  this is a missing test, not a bug. Two asserts would close it.

---

## Evidence — what passed

**Section A, the boundary table.** All 22 students run through the shipped
`studentResult` and compared to the pack's table: **22/22 match** on the subject grade
point under test, the GPA and the letter. Also confirmed in the real UI — rendering the
shipped `App.jsx` with QA-BOUNDARY loaded produces exactly the pack's 22 rows, and the
header reads `22 students · 18 passing · 4 failing`.

- Step 4 — `B12` (BAN 32): table `0.00 F`; trace keeps the other five compulsory subjects
  at 4.0 each and shows **uncancelled average 3.33**. R-13 satisfied, not zeroed.
- Step 5 — `P02` (theory 24, total 49) and `P03` (practical 7, **total 82**) both grade
  point 0 and `0.00 F`. `P03`'s rule sentence reads "practical 7 is below the pass mark
  of 8" — it does not silently grade the 82.
- Step 6 — `A01` (AB in compulsory BIO) `0.00 F`; `A02` (AB in the optional) **`4.00 A`**,
  not failed.
- Step 7 — `O01` (optional exactly 2.0) and `A02` both **4.00**, identical, as they must be.
- Step 8 — `C01`: trace shows `(30.0 + 3.0) ÷ 6 = 5.5`, then `5.5 is above 5.00 → 5.00`,
  letter A+. Nothing anywhere in the case exceeds the cap.
- Step 3 — rule sentences: `B01` "mark 80 is 80 or above", `B02` "mark 79 is in 70–79".

**Section B, letter-band edges.** `B02`/`B03` both `4.00 A`; `B10`/`B11` both `3.50 A-`;
`B04` `3.92 A-`, not A. For step 10 I wrote an independent letter derivation straight from
R-10's text and compared it to the engine's letter for **every student in all 25 published
cases — 1,765 students, 0 disagreements**. Every GPA formats to exactly 2 decimals
(`formatGpa` is `toFixed(2)`); `4` renders as `4.00`.

**Section C, published cases.** PUB-01 reports **80 students, 59 passing, 21 failing** —
59 + 21 = 80. Eight students hand-computed from the raw fixture marks, arithmetic shown:

| Case | Student | Hand-computed | Engine |
|---|---|---|---|
| PUB-01 | S003 Urmi Akter | `29 + bonus 3 = 32`, `32/6 = 5.3333` → cap → **5.00 A+** | 5.00 A+ |
| PUB-01 | S011 Chandan Rahman | PHY `60+5=65` practical 5<8 → 0; `21 + 2 = 23`, `/6 = 3.8333` → **3.83**, PHY fails → **0.00 F** | 0.00 F, uncancelled 3.83 |
| PUB-01 | S032 Hasib Khatun | BIO AB → 0; `15.5 + 1.5 = 17`, `/6 = 2.8333` → **2.83**, BIO fails → **0.00 F** | 0.00 F, uncancelled 2.83 |
| PUB-01 | S001 Kamal Begum | `25.5 + 2 = 27.5`, `/6 = 4.5833` → **4.58 A** | 4.58 A |
| PUB-01 | S045 Jui Akter | REL AB → optional 0, bonus 0; `28/6 = 4.6667` → **4.67 A** | 4.67 A |
| PUB-09 | S007 Bithi Das | CHE `24+20=44` theory 24<25 → 0; `25 + 3 = 28`, `/6 = 4.6667` → **4.67**, CHE fails → **0.00 F** | 0.00 F, uncancelled 4.67 |
| PUB-14 | S012 Bithi Sultana | BIO `30+5=35` practical 5<8 → 0; `12 + 0 = 12`, `/6 = 2.00`, BIO fails → **0.00 F** | 0.00 F, uncancelled 2.00 |
| PUB-22 | S030 Sadia Hossain | `27.5 + 3 = 30.5`, `/6 = 5.0833` → cap → **5.00 A+** | 5.00 A+ |

PUB-09's S007 is the one worth keeping: a student who is A-grade on average (4.67) and
fails outright on a theory mark one below the pass line. It is the strongest single
demonstration of R-11 and R-13 together in the published data.

**Section D, the suite.** `node --test src/lib/grading.test.mjs` → **26 pass, 0 fail.**

**Other probes that behaved correctly and are not findings:** a practical subject supplied
as a single number skips the part checks and grades on the band (deliberate, and the code
says so); marks outside their ranges compute rather than crash (known and accepted — 101
→ 5.0, −5 → fails below 33, `{theory 80, practical 30}` → 5.0); a subject failing both
parts names the practical first (documented in `NOTES.md`).

One observation, not a finding: the divisor is the constant `6`, not `compulsory.length`.
That is exactly what R-13 says, so it is right — but a case with five compulsory subjects
would still divide by 6 and read low. Only reachable with a malformed case.

---

## The open decision — is `0` distinguishable enough from `AB`?

Yes as it stands, and I would not spend clock changing it: the constraint is "they must
not produce the same output", and the app already produces different output in two places
— the trace shows `AB` with "absent — AB, grade point 0" versus `0` with "mark 0 is below
33", and the absent checking list names every absentee by name. The results table showing
both as `0.00 F` is correct, because at that point they genuinely have the same result.
If anyone still wants belt-and-braces, the cheapest version is an `AB` chip on the roster
row, and it should only happen once nothing scored is open.

---

*One note on my own unit, since I found it while testing the rules and it belongs to T3
rather than to me: in the trace's calculation block the un-rounded quotient prints as
`= 4` and `= 3.5` rather than `4.00` / `3.50`. The GPA lines themselves are correct to two
decimals; this is the intermediate working. Flagging it so Dip can judge it in the T3 pass
rather than have it fall between us.*
