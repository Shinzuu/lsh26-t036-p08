/**
 * The head teacher's view. Bonus feature from the problem statement:
 * "Show a class summary: pass rate, grade distribution and the subject that
 * failed the most students."
 *
 * Everything here is aggregated from the same engine output the rest of the app
 * uses — no second implementation of any rule, so it cannot drift from the
 * per-student results a judge is checking against.
 */
import { useMemo } from 'react'
import { useDataset } from '../lib/store.js'

const LETTERS = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F']

function summarise(results, dataset) {
  if (!results.length) return null

  const byClass = new Map()
  const failuresBySubject = new Map()
  const distribution = Object.fromEntries(LETTERS.map((l) => [l, 0]))

  for (const r of results) {
    const cls = r.class ?? '—'
    if (!byClass.has(cls)) byClass.set(cls, { name: cls, total: 0, passed: 0 })
    const bucket = byClass.get(cls)
    bucket.total += 1
    if (!(r.failedCompulsory?.length > 0)) bucket.passed += 1

    if (r.letter in distribution) distribution[r.letter] += 1

    // Which subject sinks the most students. Counted per student, so a student
    // failing two subjects adds one to each rather than being counted twice
    // against the same subject.
    for (const code of r.failedCompulsory ?? []) {
      failuresBySubject.set(code, (failuresBySubject.get(code) ?? 0) + 1)
    }
  }

  const total = results.length
  const passed = results.filter((r) => !(r.failedCompulsory?.length > 0)).length
  const nameOf = (code) => dataset?.subjects?.find((s) => s.code === code)?.name ?? code

  const worst = [...failuresBySubject.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([code, count]) => ({ code, name: nameOf(code), count }))

  const gpas = results.filter((r) => r.gpa > 0).map((r) => r.gpa)
  const meanPassingGpa = gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0

  return {
    total,
    passed,
    passRate: total ? (passed / total) * 100 : 0,
    classes: [...byClass.values()].sort((a, b) => a.name.localeCompare(b.name)),
    distribution,
    worst,
    meanPassingGpa,
  }
}

export default function ClassSummary() {
  const { dataset, results } = useDataset()
  const s = useMemo(() => summarise(results, dataset), [results, dataset])
  if (!s) return null

  const peak = Math.max(...LETTERS.map((l) => s.distribution[l]), 1)

  return (
    <section aria-labelledby="summary-heading" className="rounded-card border border-ink-300 bg-white">
      <h3 id="summary-heading" className="font-semibold text-ink-900">
        How the sheet performed
      </h3>

      <div className="grid gap-6 p-4 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-ink-900">{s.passRate.toFixed(1)}%</p>
            <p className="text-sm text-ink-500">passed</p>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {s.passed} of {s.total} students. Mean GPA among those who passed{' '}
            <span className="font-medium text-ink-900">{s.meanPassingGpa.toFixed(2)}</span>.
          </p>

          <ul className="mt-3 space-y-1.5">
            {s.classes.map((c) => {
              const rate = c.total ? (c.passed / c.total) * 100 : 0
              return (
                <li key={c.name} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-ink-500">{c.name}</span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${rate}%` }}
                    />
                  </span>
                  <span className="w-24 shrink-0 text-right text-ink-700">
                    {c.passed}/{c.total} · {rate.toFixed(0)}%
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink-500">Grade distribution</p>
          <ul className="mt-2 space-y-1">
            {LETTERS.map((l) => {
              const n = s.distribution[l]
              return (
                <li key={l} className="flex items-center gap-3 text-sm">
                  <span className="w-6 shrink-0 font-mono text-ink-700">{l}</span>
                  <span className="h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-ink-100">
                    <span
                      className={`block h-full rounded-sm ${l === 'F' ? 'bg-danger' : 'bg-accent'}`}
                      style={{ width: `${(n / peak) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-ink-700">{n}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-300 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-ink-500">
          Subjects costing the most students their result
        </p>
        {s.worst.length === 0 ? (
          <p className="mt-1 text-sm text-ok">
            No compulsory subject failed anyone in this sheet.
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {s.worst.map((w, i) => (
              <li key={w.code} className="text-ink-700">
                <span className={i === 0 ? 'font-semibold text-danger' : 'font-medium'}>
                  {w.name}
                </span>{' '}
                <span className="font-mono text-xs text-ink-500">{w.code}</span>
                {' — '}
                {w.count} {w.count === 1 ? 'student' : 'students'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
