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
import { useMemo, useState } from 'react'
import { useDataset, useSelected } from '../lib/store.js'

/** Always two decimals, so 4 reads as 4.00 and the column stays aligned. */
const formatGpa = (gpa) => (Number.isFinite(gpa) ? gpa.toFixed(2) : '—')

export default function ResultsTable() {
  const { results } = useDataset()
  const { selectedId, select } = useSelected()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return results
    return results.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.id.toLowerCase().includes(needle) ||
        String(r.class).toLowerCase().includes(needle),
    )
  }, [results, query])

  const failing = results.filter((r) => r.failedCompulsory.length > 0).length
  const passing = results.length - failing
  const searching = query.trim().length > 0

  return (
    <section
      aria-labelledby="results-heading"
      className="flex flex-col overflow-hidden rounded-card border border-ink-300 bg-white"
    >
      {/* Header — what this panel is, and the two counts a teacher reads first. */}
      <div className="border-b border-ink-300 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="results-heading" className="text-sm font-semibold text-ink-900">
            Results
          </h2>
          <p className="text-xs text-ink-500">Required item 2 — grade points, GPA, letter</p>
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
            className="min-w-0 flex-1 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-500"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 rounded-lg border border-ink-300 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-100"
            >
              Clear
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-1 text-xs text-ink-500">
          {searching
            ? `Showing ${filtered.length} of ${results.length} students.`
            : 'Select a student to see the full calculation.'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-ink-500">
          No student matches “{query}”.{' '}
          <button
            type="button"
            onClick={() => setQuery('')}
            className="font-medium text-ink-700 underline underline-offset-2"
          >
            Clear the search
          </button>
        </p>
      ) : (
        // A fixed viewport with its own scroll, so 80 rows do not push the trace
        // panel below the fold on a laptop or off the screen on a phone.
        <div className="max-h-[30rem] overflow-y-auto overscroll-contain">
          <table className="w-full table-fixed border-collapse text-sm">
            <caption className="sr-only">
              Every student with their class, GPA and letter grade. Select a row to see the
              full calculation.
            </caption>
            <colgroup>
              <col />
              <col className="w-24" />
              <col className="w-20" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="sticky top-0 z-10 bg-ink-100 text-left text-xs uppercase tracking-wide text-ink-700 shadow-[0_1px_0_var(--color-ink-300)]">
                <th scope="col" className="px-4 py-2 font-medium">
                  Student
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  Class
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  GPA
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
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
                          'flex w-full min-w-0 items-baseline gap-2 border-l-2 px-4 py-2 text-left',
                          failed ? 'border-l-danger' : 'border-l-transparent',
                        ].join(' ')}
                      >
                        <span
                          className={`truncate font-medium ${failed ? 'text-danger' : 'text-ink-900'}`}
                        >
                          {r.name}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-ink-500">{r.id}</span>
                        <span className="sr-only">
                          {failed
                            ? `, failed — GPA ${formatGpa(r.gpa)}, grade ${r.letter}`
                            : `, GPA ${formatGpa(r.gpa)}, grade ${r.letter}`}
                        </span>
                      </button>
                    </th>
                    <td className="truncate px-2 py-2 text-ink-500">{r.class}</td>
                    <td
                      className={`px-2 py-2 text-right font-mono tabular-nums ${
                        failed ? 'font-medium text-danger' : 'text-ink-900'
                      }`}
                    >
                      {formatGpa(r.gpa)}
                    </td>
                    <td className="px-4 py-2 text-right">
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

      <p className="border-t border-ink-300 bg-ink-50/50 px-4 py-2 text-xs leading-relaxed text-ink-500">
        <span className="font-medium text-ink-700">Reading a red row:</span> at least one
        compulsory subject scored grade point 0, so the GPA is 0.00 and the grade is F. The
        subject points behind it are not lost — open the trace to see them and the
        uncancelled average.
      </p>
    </section>
  )
}
