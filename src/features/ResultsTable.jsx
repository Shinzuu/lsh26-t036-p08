/**
 * The roster — required item 2 on screen. Unit U2.
 *
 * Every student, their class, the GPA to two decimals and the letter grade, with
 * failing students visually distinct and every row selectable so the trace panel
 * beside it can open. The numbers come straight from `studentResult`; this file
 * decides nothing about grading and computes nothing — if a GPA looks wrong the
 * bug is in `grading.js`, never here.
 *
 * Failing is marked three ways on purpose, because colour alone is not a signal a
 * judge can rely on at phone width or on a bad projector: the row tints, the letter
 * sits in an outlined F chip, and the accessible name says "failed".
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

  return (
    <section aria-labelledby="results-heading" className="rounded-card border border-ink-300">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink-300 px-4 py-3">
        <h2 id="results-heading" className="text-sm font-semibold text-ink-900">
          Results
        </h2>
        <p className="text-sm text-ink-500">
          {results.length} students · {failing} failing
        </p>
      </div>

      <div className="border-b border-ink-300 px-4 py-3">
        <label htmlFor="roster-search" className="block text-xs font-medium text-ink-700">
          Find a student
        </label>
        <input
          id="roster-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, ID or class"
          className="mt-1 w-full rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-500">
          No student matches “{query}”.{' '}
          <button
            type="button"
            onClick={() => setQuery('')}
            className="underline underline-offset-2 hover:text-ink-700"
          >
            Clear the search
          </button>
        </p>
      ) : (
        // Scrolls rather than running the page to 80 rows tall, so the trace panel
        // stays beside the roster instead of below the fold.
        <div className="max-h-[32rem] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Every student with their class, GPA and letter grade. Select a row to see the
              full calculation.
            </caption>
            <thead className="sticky top-0 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
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
              {filtered.map((r) => {
                const failed = r.failedCompulsory.length > 0
                const isSelected = r.id === selectedId
                return (
                  <tr
                    key={r.id}
                    onClick={() => select(r.id)}
                    aria-selected={isSelected}
                    className={[
                      'cursor-pointer border-t border-ink-300/60',
                      failed ? 'bg-danger/5' : '',
                      isSelected ? 'bg-accent-soft' : 'hover:bg-ink-100',
                    ].join(' ')}
                  >
                    <th scope="row" className="px-4 py-2 text-left font-normal">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          select(r.id)
                        }}
                        className="text-left"
                      >
                        <span
                          className={`font-medium ${failed ? 'text-danger' : 'text-ink-900'}`}
                        >
                          {r.name}
                        </span>
                        <span className="ml-2 font-mono text-xs text-ink-500">{r.id}</span>
                        <span className="sr-only">
                          {failed
                            ? `, failed — GPA ${formatGpa(r.gpa)}, grade ${r.letter}`
                            : `, GPA ${formatGpa(r.gpa)}, grade ${r.letter}`}
                        </span>
                      </button>
                    </th>
                    <td className="px-2 py-2 text-ink-500">{r.class}</td>
                    <td
                      className={`px-2 py-2 text-right font-mono tabular-nums ${
                        failed ? 'text-danger' : 'text-ink-900'
                      }`}
                    >
                      {formatGpa(r.gpa)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        aria-hidden="true"
                        className={[
                          'inline-block min-w-[2.5rem] rounded-md px-2 py-0.5 text-center text-xs font-semibold',
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

      <p className="border-t border-ink-300 px-4 py-2 text-xs text-ink-500">
        A failing row means at least one compulsory subject scored grade point 0, so the
        GPA is 0.00 and the grade is F — the subject points behind it stay visible in the
        trace.
      </p>
    </section>
  )
}
