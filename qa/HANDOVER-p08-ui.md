# Handover — P08 UI and product work

Written 20:52 by shinzuu's session, for whoever picks P08 up next.
Repo state at handover: `main`, working tree clean, nothing unpushed, deployed and live.

**Live:** https://lsh26-t036-p08.pages.dev

## Read this first — the clock changed

Submission Kit **v2.2** (published 18:50) supersedes every earlier submission document and
says so explicitly: *"If another document says something different about submission, this
guide controls."*

**The deadline is 22:00, not midnight.** *"Only receipts before 10:00:00 PM are on time. A
response received at or after 10:00 PM is late and is not judged."* The earlier live-site
guide's midnight deadline and 01:00 late window are dead.

Still outstanding and nobody has done them:

1. **Make the repository public.** It is still private. A judge given a private link loses
   the source entirely.
2. **Leader sends the Final Submission Form** — one form covering both problems.
3. **Use the exact 40-character SHA.** A branch name or short SHA is rejected.
4. Optional: a demo video, **max three minutes**, covering the solving method and every
   member's contribution.

## Where the app stands

All four required items are complete and verified on the deployed URL. The engine has not
been touched by any of the UI work.

- 28 of 28 tests pass: `node --test src/lib/grading.test.mjs`
- Independent cross-check: **25 cases, 1,765 students, 0 mismatches**
- Contrast: **53 text pairs audited live, 0 below WCAG AA**, weakest 4.92
- No horizontal scroll at 375 px; console clean; `preflight` passes
- Zero runtime dependencies beyond react and react-dom

## What changed in the UI round, and why

**The palette** is the team's five colours, placed by measured contrast rather than taste,
in `src/themes/miasma.css`. Two of the five cannot legally carry text on a light page and
that decided the placement — `#2e659b` is the accent, `#ab3b4c` is danger, `#86797a` is the
source of the whole neutral ramp, `#6c93b1` is rules and borders only, `#b58c91` is a
background fill only. The file explains each number. **If you change a colour, re-run a
contrast audit** — text sits on the page, on white cards, and on three row tints, and only
checking against the page background will miss failures.

**Dark mode was removed** on purpose. It was half-supported and never audited, and the
22:00 capture is automated so we cannot know the capturing machine's preference. The app
pins `color-scheme: light` to the one scheme we tested.

**The shell** — sticky bar, landing overview with live figures, labelled sections — is in
`src/App.jsx`. The sections are **anchors on one page, not routes.** That is deliberate:
the rubric asks a judge to reach the core loop with no setup, so hiding a scored item
behind navigation would trade Functionality marks for the look of an app. If you add
routing, keep all four items reachable without a click.

**The sign-off desk** (`src/features/PublishDesk.jsx`) is the product answer to "why would
a school use this". It collapses the 37 checking-list entries into the 27 distinct students
who need a human eye, tracks sign-off with a progress gate, and ends in the two artefacts a
school leaves with — a CSV for the office and a printed marksheet for the parent. Both are
bonus features the problem statement lists. It sits directly under the landing because it
is the office's first question; the evidence is in the sections below it.

Sign-off state is in memory only. No school's marks are ever written to storage or a
server, and a judge who reloads gets a clean desk.

## Traps someone will otherwise hit

- **`smoke-live.sh` reports a stale deploy when the deploy is current.** Vite's asset
  filename hash is not reproducible across machines while the content is byte-identical.
  Trust the content greps; trust the filename comparison only on the machine that deployed.
  Do not re-deploy at 21:40 on the strength of that FAIL.
- **Only grep the bundle for string literals.** Rule sentences like `mark 83 is 80 or
  above` are built at runtime from a template, so the full string is never in the bundle
  even though it renders. Grep `is 80 or above` instead.
- **Verify the rendered page, not the bundle.** A string being in the JS does not mean it
  is on screen. I made that mistake and reported something live before confirming it
  rendered.
- **React effects run after paint.** Reading `document.body.innerText` immediately after
  navigation will miss anything an effect sets — the trace opens on arrival via an effect,
  so wait ~800 ms before asserting.
- **Do not rewrite git history.** Judges read it, and v2.2 forbids it after 18:00. Use
  `git pull --no-rebase` in this repo.

## Known, logged, deliberately not fixed

- A `compulsory` list of a length other than six is accepted and still divided by six.
  Guarding it means editing the validator every judge case flows through, after testing
  closed — a guard that wrongly refuses a valid case costs more than one that accepts a
  malformed case nobody will send.
- The practical pass mark is declared in three files, all agreeing. Two copies of one rule
  is the shape of a future bug, not a present one.
- With duplicate student ids, clicking the second opens the first one's trace. Selection is
  by id; fixing it means selecting by index across three components. Invalid data only.
- On a narrow phone the trace table scrolls horizontally inside its own panel to reach the
  rule column. Nothing is unreachable and the page has no horizontal scroll.

## If you change anything, re-run this

```bash
node --test src/lib/grading.test.mjs      # expect 28 pass, 0 fail
bash scripts/preflight.sh                 # secrets, build, branding
npm run build && npm run deploy -- --project-name lsh26-t036-p08
```

Then open the **live** URL and confirm all four items render — the roster count and
hard-edges line, 80 rows with GPA and letter, the trace open on a student with its rule
sentences, and the three checking lists with their counts. `qa/TRIAGE.md` records what the
testing round already covered so nothing needs re-proving.
