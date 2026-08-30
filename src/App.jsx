/**
 * App shell. INTEGRATOR-OWNED — do not edit in a unit branch.
 *
 * One screen, no router. The four panels below map one-to-one onto the four
 * required items, so a judge reading the problem statement can find each one
 * without being told where to look. Each panel is a separate unit's file; this
 * file only decides where they sit.
 */
import { StoreProvider, useDataset, useSelected } from './lib/store.js'
import DataSource from './features/DataSource.jsx'
import ResultsTable from './features/ResultsTable.jsx'
import StudentTrace from './features/StudentTrace.jsx'
import CheckingLists from './features/CheckingLists.jsx'

const APP_NAME = 'Result Processor'
const TAGLINE = 'Marks in, final result out — and the rule behind every number.'

function LoadError() {
  const { error, setError } = useDataset()
  if (!error) return null
  return (
    <div
      role="alert"
      className="mx-auto mt-3 w-full max-w-6xl rounded-card border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
    >
      <span className="font-medium">Could not load that data.</span> {error}{' '}
      <button className="underline underline-offset-2" onClick={() => setError(null)}>
        Dismiss
      </button>
    </div>
  )
}

function Layout() {
  const { dataset, results } = useDataset()
  const { selected } = useSelected()
  const empty = !dataset || dataset.students.length === 0

  return (
    <>
      {/* Skip links. Every roster row is a button, so a keyboard user would otherwise
          pass ~100 controls to reach the panels below the table. Hidden until focused,
          so they cost a mouse user nothing. */}
      <nav aria-label="Skip to a section" className="mx-auto w-full max-w-6xl px-4">
        <ul className="flex flex-wrap gap-2">
          {[
            ['#panel-results', 'Skip to results'],
            ['#panel-trace', 'Skip to the trace'],
            ['#panel-checking', 'Skip to the checking list'],
          ].map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                className="sr-only focus:not-sr-only focus:inline-block focus:rounded-lg focus:bg-accent focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-white"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <header className="mx-auto w-full max-w-6xl px-4 pt-8 pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          LSH26-T036 · Problem P08
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="mt-1 text-ink-500">{TAGLINE}</p>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        {/* Item 1 — the dataset and how a judge loads their own. */}
        <DataSource />
        <LoadError />

        {empty ? (
          <p className="mt-6 rounded-card border border-ink-300 p-6 text-center text-ink-500">
            No students loaded. Paste or upload a case above to begin.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Item 2 — every student's grade points, GPA and letter. */}
            <div id="panel-results" tabIndex={-1} className="min-w-0">
              <ResultsTable />
            </div>
            {/* Item 3 — the trace for whichever student is selected. */}
            <div id="panel-trace" tabIndex={-1} className="min-w-0">
              <StudentTrace />
            </div>
          </div>
        )}

        {/* Item 4 — the office's checking list, full width beneath the pair. */}
        <div id="panel-checking" tabIndex={-1} className="mt-6">
          <CheckingLists />
        </div>

        <p className="sr-only">
          {results.length} {results.length === 1 ? 'student' : 'students'} computed. {selected ? `${selected.name} selected.` : 'No student selected.'}
        </p>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-xs text-ink-500">
        Team Miasma · LSH26-T036 · LofiStack Hackathon 2026
      </footer>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Layout />
    </StoreProvider>
  )
}
