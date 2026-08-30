# Submission checklist — P08

Run top to bottom before the merge freeze. Rules here are the event-day ones from the
organizers' submission guide and the clarifications published with the problem set; they
supersede anything written before 30 August.

## The clock

| Time | What happens |
|---|---|
| 22:00 | Building ends. Every live URL is checked and screenshotted once — **that capture is what gets judged.** |
| 00:00 | Submission deadline (Google Form). |
| 01:00 | Late window ends. |

**The early bonus is measured from the Google Form server receipt, not from any commit.**
The organizers state plainly that commit times are not used. So committing costs nothing —
what buys the bonus is submitting early, and only once at least three of the four required
items pass on **both** of the team's problems. Receipts before 18:00 are rejected; at or
after 22:00 they earn zero.

## Required in this repository

| # | Required | Where | Status |
|---|---|---|---|
| 1 | Complete source code for this one problem | this repo, `main` | ✅ |
| 2 | A live URL that opens for a judge with no setup | <https://lsh26-t036-p08.pages.dev> | ✅ verified after every merge |
| 3 | `README.md` — team ID, problem ID, live URL, setup and run steps, **proof each requirement is met**, major decisions, known limitations | [`README.md`](README.md) | ✅ |
| 4 | `evaluation-manifest.json` — the organizer template, filled | repo root | ⚠️ complete except the four **registered names** |
| 5 | `EVENT.md` — team ID, problem ID, event start code, pre-event material declaration, in the first event-work commit | [`EVENT.md`](EVENT.md) | ✅ |
| 6 | `LICENSES.md` — every framework, library, starter, template, UI kit, font, icon and asset | [`LICENSES.md`](LICENSES.md) | ✅ verified with `npm view` |
| 7 | A statement of the approach and each member's major contribution | [`README.md`](README.md) and the manifest | ✅ |
| 8 | No password, API key, token, private key or personal data | `bash scripts/preflight.sh` | ✅ passes |

A demo video is **optional** — the event-day guide lists it as
`demo_video_url_optional` in the manifest and does not require it in the repository.

## Before the leader submits

- [x] Fill the four `registered_name` fields in `evaluation-manifest.json`. — done, all four present with evidence paths.
- [ ] **Make this repository public** and keep it public until results are announced.
- [ ] Copy the **exact forty-character commit SHA** — a branch name or short SHA is
      rejected by the form.
- [ ] Confirm the live URL loads cold, on a phone, on mobile data.
- [ ] Re-run `bash scripts/preflight.sh` and `node --test src/lib/grading.test.mjs`.

## The form fields for this project

| Field | Value |
|---|---|
| Problem ID | `P08` |
| Repository URL | `https://github.com/Shinzuu/lsh26-t036-p08` |
| Live URL | `https://lsh26-t036-p08.pages.dev` |
| Commit SHA | *(fill with the exact 40 characters at freeze)* |

## Rules that cost marks if broken

- **Never squash, delete or rewrite git history after 18:00.** Judges read the history.
- Published clarifications are part of the specification, not advice — judges mark by
  them. The six that govern P08 are quoted verbatim in `SPEC.md` and `README.md`.
- The submission can be edited until the deadline, but **the recorded time becomes the
  time of the last edit**, which re-prices the bonus.
