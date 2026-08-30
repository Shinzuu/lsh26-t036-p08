# Rule compliance — P08

Audited 20:04 against the organizers' event-day submission guide, the published
clarifications, and the problem statement's own constraints. Checked by running commands
against the repository, not by reading our own documentation back to ourselves.

Commit audited: `9b25ea749696b6004f3970cccf9a490831eb69fe`

## Repository rules

| Rule | State |
|---|---|
| Two problems, two repositories | ✅ `lsh26-t036-p08` and `lsh26-t036-p10` |
| Lowercase `lsh26-t###-p##` naming | ✅ `lsh26-t036-p08` |
| `EVENT.md` added in the **first event-work commit** | ✅ added in `130c477` at 18:17, the first commit after the pre-existing starter-kit baseline |
| `EVENT.md` carries team ID, problem ID, event start code, pre-event declaration | ✅ `LSH26-T036`, `P08`, `LSH26-8490-C900`, and a table declaring every part of the starter kit |
| **No squashing, deleting or rewriting history after 18:00** | ✅ 43 commits, the 18:11 baseline still present and unmodified, `git fsck` reports no corruption. Every merge in the repo is a merge commit; nothing was rebased |
| **Both repositories public before submission** | ⬜ **STILL PRIVATE — this is outstanding** |

## Required contents

| Required | State |
|---|---|
| Complete source code for this one problem | ✅ |
| `README.md` — team ID, problem ID, live URL, setup and run steps, **proof each requirement is met**, major decisions, known limitations | ✅ all seven present; each of the four proof lines was followed literally and reproduces |
| `evaluation-manifest.json` completed from the organizer template | ✅ the 18:20 Discord template, not the superseded participant-pack one; zero placeholders remain |
| `LICENSES.md` — every framework, library, starter, template, UI kit, font, icon, asset | ✅ seven dependencies, all licences re-verified with `npm view`; no fonts, icons or images ship |
| Approach statement + each member's major contribution | ✅ in `README.md` as a table and in the manifest with evidence paths |
| **No password, API key, token, private key or personal data** | ✅ see below |
| Live URL loads for a judge with no setup | ✅ opens on a computed 80-student roster, no login, no configuration |

## Secrets check

`preflight` passes: no key material in tracked files, no `.env` tracked, no credential
screenshots.

Deliberately verified rather than assumed:

- The only `.env`-shaped file in git is `.env.example`, and both of its values are **empty**.
- A real `.env` exists locally, is matched by `.gitignore`, is untracked, and contains
  **zero non-empty values** — it is the blank template `setup.sh` copied in.
- Every match for `service_role` in the repository is **prose warning against committing
  one** (`.env.example`, `CLAUDE.md`, `DEPLOY.md`, and the scanner's own pattern list), not
  a key.
- No JWT, no `sk-`/`ghp_`/`AKIA` shaped string anywhere in tracked files.

**Personal data:** the only real names in the repository are our own four, in the manifest
and README, which the organizer template explicitly requires. Student names come from the
organizers' own published fixture.

## Nothing private leaks when this repo goes public

The preparation repository is private and stays private. Checked what this repo says about
it: two references only — a `<prep-repo>` placeholder in a test file, and one comment
naming a filename. **No prep-repo URL, no prize figures, no internal company material.**

## Scoring rules

| Rule | State |
|---|---|
| All four required items working | ✅ 4 of 4, each verified on the deployed URL |
| **Published clarifications are specification, not advice** | ✅ all five ids that govern P08 — R-10, R-11, R-12, R-13, R-29 — appear verbatim in both `SPEC.md` and `README.md` |
| Grading rules exactly as written, no other board's rules | ✅ implemented from the statement and clarifications only; cross-checked against an independent implementation over 1,765 students with zero disagreement |
| A student absent in a subject is not a student who scored zero | ✅ `AB` with its own rule sentence, distinct from `0` with "mark 0 is below 33" |
| The trace shows the real numbers for that student, not a general explanation | ✅ every rule sentence carries that student's own mark |
| Pre-event material disclosed | ✅ `EVENT.md` table and the manifest's `pre_event_materials` |
| Third-party material disclosed | ✅ `LICENSES.md` |
| AI assistant use disclosed | ✅ `README.md` and the manifest's `ai_tools_used`, including how the output was verified |
| Sample data loads the published fixture | ✅ seeded on start, plus paste and upload; reset instructions in the manifest |

## Outstanding — all three need a human, none need code

1. **Make the repository public.** Required before submission, and it must stay public
   until results are announced.
2. **Submit the form** — leader only, one submission covering both projects, before 00:00.
3. **Use the exact forty-character commit SHA.** A branch name or a short SHA is rejected.
   At the time of writing that is `9b25ea749696b6004f3970cccf9a490831eb69fe`, but take it fresh at the freeze.

A demo video is **optional** — the event-day guide lists it as
`demo_video_url_optional` in the manifest and does not require it in the repository.
