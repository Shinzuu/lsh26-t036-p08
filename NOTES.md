# NOTES — gotchas worth more than one device knowing

One line each, newest on top. Chat evaporates; this file syncs.

- U3: U1's hard-edges line in `DataSource.jsx` already calls `select(id)` on the
  student names it prints, so a student can be selected — and the trace opened —
  without `ResultsTable`. Useful for verifying U3/U4 live before U2 is merged, and
  it is the fastest path to the failing-student trace in the demo video.
- U3: `StudentTrace` builds its seven rows from `dataset.compulsory` + the student's
  `optional`, not from `Object.keys(result.subjects)`. A subject the engine has no
  entry for still renders as a row saying so, rather than vanishing from a table
  whose whole job is "show every subject".

- U2: `checkingLists(results)` returns whole `studentResult` objects in each of
  `optional` / `practicalFail` / `absent`, not bare ids — so U4 can print the name
  and call `select(row.id)` without a second lookup. SPEC.md fixed the key names
  but not the element type; this is the choice.
- U2: when a subject fails on both parts at once, `subjectResult.rule` names one
  cause, in the order absent → practical → theory → below 33 (the order SPEC.md
  lists its example sentences in). Only visible on a student who failed theory and
  practical together.
- U2: `grading.js` imports nothing — no store, no dataset, no React. That is what
  lets `node --test src/lib/grading.test.mjs` run the rules with no bundler. Keep
  it that way; an import of `store.js` would make the suite unrunnable.
- U2: `gpa` is a number, so `4` needs `.toFixed(2)` to read as `4.00`. The roster
  and the trace both have to format it; the engine deliberately does not return a
  pre-formatted string.
