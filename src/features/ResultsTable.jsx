/**
 * The roster — required item 2 on screen. Unit U2.
 *
 * Every student, their class, the GPA to two decimals and the letter grade, with
 * failing students visually distinct and every row selectable so the trace panel
 * beside it can open. The numbers come straight from `studentResult`; this file
 * decides nothing about grading and computes nothing — if a GPA looks wrong the
 * bug is in `grading.js`, never here.
 *
 * Two framing decisions worth knowing before editing:
 *
 * - The table is `table-fixed` with an explicit width on all four columns. Under
 *   `auto` layout the columns re-measure as the search filters rows, so a name one
 *   character longer shifts the GPA column and the whole roster twitches while you
 *   type. Fixed widths cost a truncated long name and buy a table that holds still.
 * - Failing is marked four ways, because colour alone is not a signal a judge can
 *   rely on at phone width or on a washed-out projector: a tinted row, a red left
 *   rule, an outlined F chip, and the word "failed" in the row's accessible name.
 */
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useDataset, useSelected } from '../lib/store.js'

/**
 * How many rows are put in the DOM at once.
 *
 * The engine grades 5,000 students in 128ms, but rendering 5,000 rows costs 2.9
 * seconds and 50,000 DOM nodes, and every keystroke in the search box re-rendered
 * all of them — a measured 1,396ms for one character, which reads as a frozen
 * input. A district-sized upload is the case this app is meant to survive.
 *
 * Capping rather than virtualising: react-window would add a dependency, a
 * licence entry, and absolutely-positioned rows that would re-break the sr-only
 * clipping fix. A cap needs neither, and it is honest — the footer says exactly
 * how many rows are held back and offers them. Nothing is filtered out of the
 * export, the counts, the checking lists or the summary; this is a display
 * budget, not a data limit.
 */
const PAGE = 100

/** Always two decimals, so 4 reads as 4.00 and the column stays aligned. */
const formatGpa = (gpa) => (Number.isFinite(gpa) ? gpa.toFixed(2) : '—')

/**
 * A column header you can order by.
 *
 * `aria-sort` on the cell is what tells a screen reader the table is ordered and
 * which way, so it is set on the `th` rather than the button. The arrow is drawn
 * only on the active column: an idle arrow on every header reads as decoration
 * and stops meaning anything. Clicking the active column reverses it; clicking a
 * different one starts that column ascending, which is what every table people
 * already use does.
 */
function SortHeader({ sortKey, sort, setSort, children, className = '', align = 'left' }) {
  const active = sort.key === sortKey
  const dir = active ? sort.dir : null
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`font-medium ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
    >
      <button
        type="button"
        onClick={() =>
          setSort((s) =>
            s.key === sortKey
              ? { key: sortKey, dir: s.dir === 'asc' ? 'desc' : 'asc' }
              : { key: sortKey, dir: 'asc' },
          )
        }
        className={[
          'group flex w-full items-center gap-1 rounded text-xs uppercase tracking-wide transition-colors',
          align === 'right' ? 'justify-end' : 'justify-start',
          active ? 'text-accent' : 'text-ink-700 hover:text-ink-900',
        ].join(' ')}
      >
        <span>{children}</span>
        <span aria-hidden="true" className={active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}>
          {dir === 'desc' ? '↓' : '↑'}
        </span>
      </button>
    </th>
  )
}

export default function ResultsTable() {
  const { results } = useDataset()
  const { selectedId, select } = useSelected()
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  // Who is shown, and in what order. Both default to "everything, as the sheet
  // came in", so the panel a judge lands on is still the unedited roster.
  const [scope, setScope] = useState('all')
  const [klass, setKlass] = useState('all')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  // The input renders from `query` so typing is never held up; the table renders
  // from `deferredQuery`, which React is free to compute in a lower-priority pass.
  // Without this the keystroke and the 5,000-row re-render land in the same commit
  // and the character appears only after the table has finished.
  const deferredQuery = useDeferredValue(query)

  /** The classes actually present, so the filter offers only what exists. */
  const classes = useMemo(
    () => [...new Set(results.map((r) => r.class))].sort((a, b) => String(a).localeCompare(String(b))),
    [results],
  )

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()
    return results.filter((r) => {
      if (scope === 'failing' && r.failedCompulsory.length === 0) return false
      if (scope === 'checking' && !(r.flags?.optionalRule || r.flags?.practicalFail || r.flags?.absent)) {
        return false
      }
      if (klass !== 'all' && r.class !== klass) return false
      if (!needle) return true
      return (
        r.name.toLowerCase().includes(needle) ||
        r.id.toLowerCase().includes(needle) ||
        String(r.class).toLowerCase().includes(needle)
      )
    })
  }, [results, deferredQuery, scope, klass])

  /**
   * Sorted for reading, never for grading.
   *
   * Default is `key: null` — the sheet's own order — because that is the order
   * the marks arrived in and the order a clerk checking against paper expects.
   * Sorting is something the reader turns on.
   *
   * `toSorted` would be tidier but is too new to rely on for a judged build, so
   * this copies first. The comparator always falls back to name, so two students
   * on the same GPA never swap places between renders.
   */
  const sorted = useMemo(() => {
    if (!sort.key) return filtered
    const dir = sort.dir === 'desc' ? -1 : 1
    const byName = (a, b) => a.name.localeCompare(b.name)
    const compare = {
      name: byName,
      class: (a, b) => String(a.class).localeCompare(String(b.class)) || byName(a, b),
      // The Grade column sorts on the GPA behind it: the letter is derived from
      // that number, so ordering by one is ordering by the other, and it keeps
      // every F together in GPA order rather than alphabetically by letter.
      gpa: (a, b) => a.gpa - b.gpa || byName(a, b),
    }[sort.key]
    return [...filtered].sort((a, b) => dir * compare(a, b))
  }, [filtered, sort])

  // Narrowing the search or loading a new sheet starts the budget again, so a
  // reader who paged deep into one roster does not inherit that depth in the next.
  useEffect(() => {
    setLimit(PAGE)
  }, [deferredQuery, results, scope, klass, sort])

  const visible = useMemo(() => sorted.slice(0, limit), [sorted, limit])
  const hidden = filtered.length - visible.length

  const failing = useMemo(
    () => results.filter((r) => r.failedCompulsory.length > 0).length,
    [results],
  )
  const passing = results.length - failing
  const flagged = useMemo(
    () =>
      results.filter((r) => r.flags?.optionalRule || r.flags?.practicalFail || r.flags?.absent)
        .length,
    [results],
  )
  const filtering = scope !== 'all' || klass !== 'all'
  const searching = query.trim().length > 0
  // The table is one render behind the box. Say so rather than showing stale
  // counts as if they were current.
  const catchingUp = query !== deferredQuery

  return (
    <section
      aria-labelledby="results-heading"
      className="flex flex-col overflow-hidden rounded-card border border-ink-300 bg-white"
    >
      {/* Header — what this panel is, and the two counts a teacher reads first. */}
      <div className="border-b border-ink-300 bg-ink-50 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="results-heading" className="text-sm font-semibold text-ink-900">
            Results
          </h2>
          {/* The shell's header already names this view and its item number; a
              second copy of "Required item 2" inside the panel said it twice on
              one screen. The counts below carry more than a restated label. */}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium text-ink-900">{results.length}</span>
          <span className="text-ink-500">students</span>
          <span aria-hidden="true" className="text-rule">
            ·
          </span>
          <span className="text-ink-500">
            <span className="font-medium text-ink-900">{passing}</span> passing
          </span>
          <span aria-hidden="true" className="text-rule">
            ·
          </span>
          <span className={failing > 0 ? 'text-danger' : 'text-ink-500'}>
            <span className="font-medium">{failing}</span> failing
          </span>
        </p>
      </div>

      {/* Search — labelled, and it says how much of the roster it is hiding. */}
      <div className="border-b border-ink-300 bg-ink-50/50 px-4 py-3">
        <label htmlFor="roster-search" className="block text-xs font-medium text-ink-700">
          Find a student
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="roster-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, ID or class"
            autoComplete="off"
            // 34px tall was under the 36px this app sets for itself on a phone,
            // and under the 44px a thumb wants. Height is set outright rather
            // than left to line-height so it cannot drift with the type scale.
            className="min-h-[2.5rem] min-w-0 flex-1 rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 transition-colors placeholder:text-ink-500 hover:border-rule"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="min-h-[2.5rem] shrink-0 rounded-card border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              Clear
            </button>
          )}
        </div>
        {/*
          Who to show. The three scopes are the three questions an exam office
          actually asks of a finished sheet — everyone, who failed, who a human
          still has to check — rather than a generic filter builder. Counts sit
          on the buttons so the answer is visible before the click.
        */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Show" className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'Everyone', count: results.length },
              { id: 'failing', label: 'Failing', count: failing },
              { id: 'checking', label: 'Needs checking', count: flagged },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                aria-pressed={scope === s.id}
                className={[
                  'min-h-[2rem] rounded-card border px-2.5 py-1 text-xs font-medium transition-colors',
                  scope === s.id
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-ink-300 bg-white text-ink-700 hover:bg-ink-100',
                ].join(' ')}
              >
                {s.label}{' '}
                <span className="tabular-nums font-mono text-[0.7rem] text-ink-500">{s.count}</span>
              </button>
            ))}
          </div>

          {classes.length > 1 && (
            <>
              <label htmlFor="roster-class" className="sr-only">
                Class
              </label>
              <select
                id="roster-class"
                value={klass}
                onChange={(e) => setKlass(e.target.value)}
                // 2.25rem to match the phone minimum the stylesheet sets for
                // buttons; a <select> is not covered by that rule.
                className="min-h-[2.25rem] rounded-card border border-ink-300 bg-white px-2 py-1 text-xs font-medium text-ink-700"
              >
                <option value="all">All classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <p aria-live="polite" className="mt-1.5 text-xs text-ink-500">
          {catchingUp
            ? 'Searching…'
            : searching || filtering
            ? `${filtered.length} of ${results.length} students shown.`
            : selectedId
              // A student is opened on arrival, so the old prompt contradicted the
              // trace sitting beside it. Say what the row does instead.
              ? 'Select any row to open that student’s calculation.'
              : 'Select a student to see the full calculation.'}
        </p>
      </div>

      {filtered.length === 0 ? (
        // An empty result is a dead end unless it says which control emptied it,
        // so the message names what is currently narrowing the roster and the
        // button undoes exactly that.
        <p className="px-4 py-10 text-center text-sm text-ink-500">
          {searching ? <>No student matches “{query}”</> : 'No student matches these filters'}
          {filtering && scope === 'failing' && ' among the failing students'}
          {filtering && scope === 'checking' && ' among the students needing a check'}
          {klass !== 'all' && ` in ${klass}`}.{' '}
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setScope('all')
              setKlass('all')
            }}
            className="font-medium text-ink-700 underline underline-offset-2"
          >
            Show everyone again
          </button>
        </p>
      ) : (
        // A fixed viewport with its own scroll, so 80 rows do not push the trace
        // panel below the fold on a laptop or off the screen on a phone.
        <div className="max-h-[30rem] overflow-x-hidden overflow-y-auto overscroll-contain">
          <table className="w-full table-fixed border-collapse text-sm">
            <caption className="sr-only">
              Every student with their class, GPA and letter grade. Select a row to see the
              full calculation.
            </caption>
            {/*
              Widths live on the header cells rather than in a <colgroup>, because
              a colgroup cannot be dropped per breakpoint. On a 360px phone the
              three fixed columns claimed 240px of a 328px row and left the student
              56px — every name truncated to nothing, on the one column a reader
              actually needs. Below `sm` the class column is removed from the table
              entirely and reappears under the name, which returns roughly 216px to
              it, and the number columns tighten by a step.
            */}
            <thead>
              <tr className="sticky top-0 z-10 bg-ink-100 text-left text-xs uppercase tracking-wide text-ink-700 shadow-[0_1px_0_var(--color-ink-300)]">
                <SortHeader
                  sortKey="name"
                  sort={sort}
                  setSort={setSort}
                  className="px-4 py-2"
                >
                  Student
                </SortHeader>
                <SortHeader
                  sortKey="class"
                  sort={sort}
                  setSort={setSort}
                  className="hidden w-24 px-2 py-2 sm:table-cell"
                >
                  Class
                </SortHeader>
                <SortHeader
                  sortKey="gpa"
                  sort={sort}
                  setSort={setSort}
                  align="right"
                  className="w-16 px-2 py-2 sm:w-20"
                >
                  GPA
                </SortHeader>
                <th scope="col" className="w-14 px-3 py-2 text-right font-medium sm:w-16 sm:px-4">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => {
                const failed = r.failedCompulsory.length > 0
                const isSelected = r.id === selectedId
                return (
                  <tr
                    // Position is part of the key because a pasted case may repeat a
                    // student id. With `key={r.id}` alone, two rows share a key, and
                    // React's reconciler then keeps one of them mounted forever — it
                    // survived five later datasets in testing, leaving a student on
                    // screen who was not in the loaded case at all (T1-01).
                    key={`${r.id}-${i}`}
                    onClick={() => select(r.id)}
                    aria-selected={isSelected}
                    className={[
                      'cursor-pointer border-t border-ink-300/50 transition-colors',
                      isSelected
                        ? 'bg-accent-soft'
                        : failed
                          ? 'bg-danger/5 hover:bg-danger/10'
                          : 'hover:bg-ink-100',
                    ].join(' ')}
                  >
                    {/* The row header is the student, so a screen reader announces the
                        name before it reads the GPA and grade cells. */}
                    <th scope="row" className="p-0 text-left font-normal">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          select(r.id)
                        }}
                        className={[
                          'flex w-full min-w-0 flex-col gap-x-2 border-l-2 px-4 py-2 text-left',
                          'sm:flex-row sm:items-baseline',
                          failed ? 'border-l-danger' : 'border-l-transparent',
                        ].join(' ')}
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span
                            className={`truncate font-medium ${failed ? 'text-danger' : 'text-ink-900'}`}
                            title={r.name}
                          >
                            {r.name}
                          </span>
                          <span className="shrink-0 font-mono text-xs text-ink-500">{r.id}</span>
                        </span>
                        {/* The class column is gone below `sm`, so it rides with the
                            name instead of being lost. Deliberately not aria-hidden:
                            below `sm` the class cell is display:none and therefore
                            unreadable to a screen reader, so this is the only place
                            the class is announced. Above `sm` this span is the hidden
                            one and the cell takes over, so it is never said twice. */}
                        <span className="truncate text-xs text-ink-500 sm:hidden">{r.class}</span>
                        <span className="sr-only">
                          {failed
                            ? `, failed — GPA ${formatGpa(r.gpa)}, grade ${r.letter}`
                            : `, GPA ${formatGpa(r.gpa)}, grade ${r.letter}`}
                        </span>
                      </button>
                    </th>
                    <td className="hidden truncate px-2 py-2 text-ink-500 sm:table-cell">
                      {r.class}
                    </td>
                    <td
                      className={`px-2 py-1 text-right font-mono tabular-nums ${
                        failed ? 'font-medium text-danger' : 'text-ink-900'
                      }`}
                    >
                      {formatGpa(r.gpa)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <span
                        aria-hidden="true"
                        className={[
                          'inline-block min-w-[2.25rem] rounded-md px-1.5 py-0.5 text-center text-xs font-semibold',
                          failed
                            ? 'border border-danger/50 bg-danger/10 text-danger'
                            : 'bg-ink-100 text-ink-700',
                        ].join(' ')}
                      >
                        {r.letter}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* The display budget, stated. A count with no way to act on it would just
          be an apology, so the control that lifts it sits next to the number. */}
      {hidden > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-ink-300 bg-ink-50/50 px-4 py-2.5">
          <p className="text-xs text-ink-500">
            Showing the first{' '}
            <span className="font-medium text-ink-900 tabular-nums">{visible.length}</span> of{' '}
            <span className="font-medium text-ink-900 tabular-nums">{filtered.length}</span>{' '}
            matching students. Every one of them is still counted in the totals above and
            included in the export.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setLimit((n) => n + PAGE)}
              className="rounded-card border border-ink-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-900 hover:bg-ink-100"
            >
              Show {Math.min(PAGE, hidden)} more
            </button>
            {hidden > PAGE && (
              <button
                type="button"
                onClick={() => setLimit(filtered.length)}
                className="rounded-card border border-ink-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-100"
              >
                Show all {filtered.length}
              </button>
            )}
          </div>
        </div>
      )}

      {/* A legend, not an instruction. Anyone who needs it can open it; anyone
          who can already read a red row is not made to scroll past 42 words. */}
      <details className="border-t border-ink-300 bg-ink-50/50 px-4 py-2 text-xs text-ink-500">
        <summary className="cursor-pointer font-medium text-ink-700">Reading a red row</summary>
        <p className="mt-1 leading-relaxed">
          At least one compulsory subject scored grade point 0, so the GPA is 0.00 and the
          grade is F. The subject points behind it are not lost — open the trace to see them
          and the uncancelled average.
        </p>
      </details>
    </section>
  )
}
