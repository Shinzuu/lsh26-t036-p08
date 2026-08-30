# LICENSES.md

Every framework, library, starter, template, UI kit, font, icon and asset used in this
project, with its licence. No GPL, LGPL, AGPL, MPL, SSPL, other copyleft or
weak-copyleft licence, and nothing non-commercial or personal-use-only.

Every licence below was verified with `npm view <package> license` against the versions
actually installed, not copied from memory.

## Runtime dependencies — shipped in the browser bundle

| Package | Version | Licence |
|---|---|---|
| react | ^19.2.8 | MIT |
| react-dom | ^19.2.8 | MIT |

That is the whole runtime. No UI kit, no component library, no charting library, no date
library, no icon set. Nothing was added during the event.

`@supabase/supabase-js` shipped with our starter kit and was **removed** from this
project: P08 is a pure calculation over a JSON file and needs no backend, so carrying the
client would have been dead weight in the bundle and an inaccurate line in this file.

## Build and development dependencies — not shipped to the browser

| Package | Version | Licence |
|---|---|---|
| vite | ^8.2.0 | MIT |
| @vitejs/plugin-react | ^6.1.0 | MIT |
| tailwindcss | ^4.3.3 | MIT |
| @tailwindcss/vite | ^4.3.3 | MIT |
| wrangler | ^4.123.0 | MIT OR Apache-2.0 |

## Fonts, icons and assets

None. The interface uses the system font stack declared in `src/app.css`
(`ui-sans-serif, system-ui, sans-serif`), which ships no font file. There are no icons,
no images, and no third-party CSS. The only non-text asset is `public/favicon.svg`, which
we drew ourselves.

## Templates and pre-existing code

| Asset | Source | Licence |
|---|---|---|
| Starter kit — Vite + React + Tailwind scaffold, storage adapter, capability modules, colour palettes, helper scripts | Our own pre-existing work, written before the event. Declared in full in `EVENT.md`. | MIT (our code) |
| `src/themes/civic.css` | Our own pre-existing work, part of the same starter kit | MIT (our code) |

The unused parts of that starter kit — the thirteen capability modules, the storage
adapter, the four unused colour palettes, the Supabase schema templates and the
documentation templates — were deleted from this repository before submission rather
than left as dead code.

## Sample data

| Asset | Source | Licence / permission |
|---|---|---|
| `src/data/seed-p08.json` | Case PUB-01 from the organizers' published participant release v2.1 fixture `P08_school_results_public.json`, copied unmodified | Supplied by the organizers to participants for use in this event |

## Added during the event

Nothing. No dependency, font, icon, asset or third-party snippet was added after 18:00.
