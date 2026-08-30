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
| Inter (variable) | https://rsms.me/inter/inter.css — third-party stylesheet linked in `index.html` | SIL Open Font License 1.1 | Body text, figures and interface controls |
| `src/data/seed-p08.json` | Case PUB-01 from the organizers' published fixture `P08_school_results_public.json` | Supplied by the organizers to participants for this event | Seed data, so the live URL is never empty |

That is the complete runtime: **two** shipped dependencies, `react` and `react-dom`. No UI
kit, no component library, no charting library, no date library, no icon set.

**Fonts.** One webfont is loaded, Inter, as third-party CSS from `rsms.me` — declared in the
table above. Headings are set in a system serif stack (`Iowan Old Style, Palatino, Charter,
Georgia, Times New Roman, serif`) declared in `src/app.css`: those faces ship with the
reader's operating system, so no file is downloaded and there is nothing to license. If the
Inter stylesheet fails to arrive the page falls back to `ui-sans-serif, system-ui` and is
otherwise unaffected. No icons or images ship; the only non-text asset is
`public/favicon.svg`, which we drew.

**No dependency, icon or image was added during the event window.** The Inter stylesheet
above arrived with the pre-existing starter kit's `index.html` rather than being added on
the night; it is declared because it is a third-party font this page loads. `@supabase/supabase-js` shipped with our
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
