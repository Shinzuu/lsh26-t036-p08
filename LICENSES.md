# Third-Party Material and AI Disclosure

List of material frameworks, libraries, starters, templates, UI kits, fonts, icons and
assets used in this repository. Every licence below was verified with
`npm view <package> license` against the versions actually installed, not copied from
memory.

| Name | Version or source URL | Licence | Used for |
|---|---|---|---|
| react | ^19.2.8 | MIT | The application's UI runtime |
| react-dom | ^19.2.8 | MIT | Rendering React to the browser |
| vite | ^8.2.0 | MIT | Build tool and dev server — not shipped to the browser |
| @vitejs/plugin-react | ^6.1.0 | MIT | React support in the build — not shipped |
| tailwindcss | ^4.3.3 | MIT | Styling — not shipped as a runtime |
| @tailwindcss/vite | ^4.3.3 | MIT | Tailwind's build integration — not shipped |
| wrangler | ^4.123.0 | MIT OR Apache-2.0 | Cloudflare Pages deploy CLI — not shipped |
| Team starter kit (Vite + React + Tailwind scaffold, helper scripts, colour palettes) | Our own pre-existing work, written before the event. Declared in full in [`EVENT.md`](EVENT.md). | MIT (our code) | The generic application scaffold the repository began from |
| `src/data/seed-p08.json` | Case PUB-01 from the organizers' published fixture `P08_school_results_public.json` | Supplied by the organizers to participants for this event | Seed data, so the live URL is never empty |

That is the complete runtime: **two** shipped dependencies, `react` and `react-dom`. No UI
kit, no component library, no charting library, no date library, no icon set. **No fonts,
icons or images ship** — the interface uses the system font stack declared in
`src/app.css`, and the only non-text asset is `public/favicon.svg`, which we drew.

**Nothing was added during the event window.** `@supabase/supabase-js` shipped with our
starter kit and was *removed*: P08 needs no backend, so carrying the client would have been
dead weight in the bundle and an inaccurate line in this file. The unused parts of that
starter kit — thirteen generic capability modules, the storage adapter, four unused colour
palettes, the Supabase schema templates and the documentation templates — were deleted from
this repository before submission rather than left as dead code. Their removal is visible in
the Git history.

## AI tools

**Claude Code (Anthropic).** Used to read and reconcile the organizer documents, to author
the build specification in [`SPEC.md`](SPEC.md), and to implement units against that
specification.

**How the output was verified.** A `node --test` suite covering every grade-band boundary
and each edge case named in the published clarifications; a second implementation of the
rules written independently from those clarifications and cross-checked across all 25
published cases and 1,765 students with zero mismatches; and a check of every requirement
by a team member on the deployed URL, with each member testing a requirement they had not
built. Recorded in full in [`evaluation-manifest.json`](evaluation-manifest.json) and
[`qa/`](qa/).

## Original-work statement

Everything not declared in this file or [`EVENT.md`](EVENT.md) was created by the registered
team during the event window.
