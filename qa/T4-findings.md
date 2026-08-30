# T4 findings — checking lists, and the judge's environment

Tester: MD. Nishadul Islam Chy Shezan · P08 · https://lsh26-t036-p08.pages.dev
Run at 19:21–19:26 against the deployed build, not localhost.

**Result: no blockers, no majors. Two minors, both listed below. Every check in
section A passed against independently computed expected values.**

---

### [T4-01] The empty state in the app shell can never be reached
- **Severity:** minor
- **Where:** `src/App.jsx` — the branch that renders *"No students loaded. Paste or upload
  a case above to begin."*
- **Steps:** tried to reach it by loading a case with `"students": []`.
- **Expected:** either the message renders, or the branch is unnecessary.
- **Actual:** `parseDataset` refuses an empty `students` array with *"Missing `students` —
  expected a non-empty list."*, so the dataset can never be empty after a successful load,
  and the seed is never empty. The branch is unreachable in practice.
- **Evidence:** `parseDataset({subjects:[…],compulsory:[…],students:[]})` throws before the
  store is ever updated.
- **Note:** this is defensive code rather than a defect — it costs nothing and protects
  against a future loader that does not validate. Recording it so nobody spends time
  hunting for the empty state. **My recommendation: leave it.**

### [T4-02] Keyboard users tab through the whole roster to reach the checking lists
- **Severity:** minor
- **Where:** page-wide tab order.
- **Steps:** counted focusable controls in document order.
- **Expected:** a keyboard user can reach each of the four panels without excessive
  tabbing.
- **Actual:** 124 focusable controls. Every one of the 80 roster rows is a button, so
  reaching the checking-list panel takes roughly a hundred presses of Tab.
- **Evidence:** `document.querySelectorAll('a[href],button,input,…')` → 124 visible.
- **Note:** everything *is* reachable and every control has an accessible name, so this is
  not a functional failure. **Carry it into the UI/UX round** — a skip link, or making the
  panels reachable by heading navigation, would fix it cheaply.

---

## Section A — the three lists

| # | Check | Result |
|---|---|---|
| 1 | Three lists, each with a count and a one-line rule | **pass** |
| 2 | Seeded case counts are optional 25, practical fail 10, absent 2 | **pass** — exact |
| 3 | Every entry states that student's own reason | **pass** — e.g. *"Agriculture practical 6 of 25"*, *"Religion (REL) — grade point 2.0, at or below 2.0"* |
| 4 | Students on more than one list appear on each, badged | **pass** — header says 10, screen shows 10, zero badge mismatches |
| 5 | Optional grade point of exactly 2.0 is on the list; 3.0 is not | **pass** — `O01` present, `O02` absent |
| 6 | An absent optional counts toward the optional list | **pass** — `A02` on both the optional and absent lists |
| 7 | The practical list reads the optional subject too | **pass** — `S030` and `S077` fail only on their optional's practical and both appear |
| 8 | Clicking an entry opens that student's trace | **pass** — opened `Trace — Chandan Das (S030)`, Agriculture row reads `31 + 6 = 37 / 0.0 / practical 6 is below the pass mark of 8` |
| 9 | Counts recompute on other cases | **pass** — QA-BOUNDARY gave 19 / 1 / 2, matching hand calculation; PUB-17 loaded clean |

**Cross-check on step 2 and 4.** I recomputed all three lists directly from
`seed-p08.json` with an independent script. Membership matched the screen exactly, and the
ten students on two or more lists were the same ten: S002, S010, S012, S013, S016, S030,
S034, S045, S051, S077. Note S011 is on the practical list but *not* the optional list, and
S032 is absent but not on the optional list — the app gets both of those right, which is
the discriminating case.

## Section B — the live URL as a judge meets it

| # | Check | Result |
|---|---|---|
| 10 | Cold load speed | **pass** — DOMContentLoaded 314 ms, HTML transfer ~1 KB |
| 11 | Phone width | **pass at 375 px** — document scroll width equals viewport width, nothing overflows. **See limitation below.** |
| 12 | Second browser | **not tested** — see limitation |
| 13 | Refresh mid-use with a student selected | **pass** — returns to PUB-01 with the trace back to its placeholder, no error |
| 14 | Title and header identify the project | **pass** — title *"Result Processor — School Result Processing and GPA Engine · LSH26-T036"*, header carries `LSH26-T036 · Problem P08` |

## Section C — states and resilience

| # | Check | Result |
|---|---|---|
| 15 | Bad input | **pass** — pasting a case missing a field gives *"Could not load that data. students[0] (S1) is missing its `optional`."* in a dismissible alert; the previous roster stays; the app works afterwards |
| 16 | Empty state | **unreachable** — see T4-01 |
| 17 | Console | **pass** — 0 errors, 0 warnings across the entire session |
| 18 | Keyboard | **pass with a note** — all 124 controls reachable, focus styles defined, every control has an accessible name (the roster search uses `<label for>`). See T4-02 |
| 19 | Zoom | **pass** — at a 625 px viewport there is no horizontal scroll and nothing overflows; the only clipped text is screen-reader-only content, which is intentional |

Structure worth recording: the page has `header` / `main` / `footer` landmarks, `lang="en"`,
one `h1`, and the results table carries a `<caption>`.

## Section D — the submission artifacts

| # | Check | Result |
|---|---|---|
| 20 | Every README proof line reproduces | **pass** — I followed all four literally. The counts, the four named hard-edge students, the 59/21 pass-fail split, S004's trace and uncancelled 4.67, and the 25/10/2 list counts all appear exactly as written |
| 21 | `EVENT.md` fields | **pass** — team `LSH26-T036`, problem `P08`, start code `LSH26-8490-C900`, repository name, the created-before-release answer, and the declaration sentence |
| 22 | `evaluation-manifest.json` | **pass** — valid JSON, all four requirements `complete` with evidence, no illegal status values, 4 members with zero placeholders, AI use disclosed, 4 known limitations, start code agrees with `EVENT.md` |
| 23 | `LICENSES.md` accuracy | **pass** — all seven declared dependencies appear; `@supabase/supabase-js` is correctly gone from both `package.json` and the file |

## Limitations of this run — someone should still cover these

1. **A real phone on mobile data.** I verified the 375 px viewport in a desktop browser,
   which catches layout overflow but not touch targets, real network latency, or mobile
   browser quirks. Someone should open the URL on an actual handset.
2. **A second browser engine.** Everything here ran in Chromium. Firefox and Safari are
   untested.

## Answer to the open question

**Should the checking-list panel filter to students on more than one list?**

No, and I would not spend the time. The panel already reports the number in its header and
badges every cross-listed entry, so the information is present without a control. A filter
adds a piece of state that can disagree with the counts beside it, and the judge's
question is *"does this list obey R-29"*, which the badges answer directly. If we want
anything here in the polish round, it is ordering — putting cross-listed students at the
top of each list would surface them with no new state at all.
