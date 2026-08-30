/**
 * The publishing desk. INTEGRATOR-OWNED.
 *
 * The four required items answer "what is the result and why". This answers the
 * question a school actually has, which is "can we publish yet" — the job the
 * exam office is doing when it opens this at all.
 *
 * Nothing here changes a single grade. It reads the same engine output the rest
 * of the app does, tracks which flagged students a human has signed off, and
 * refuses to call the sheet ready until every one of them has been. Then it
 * hands over the two artefacts a school leaves with: a results file for the
 * office, and a printable marksheet for a parent.
 */
import { useEffect, useMemo, useState } from 'react'

/**
 * Rows put in the DOM at once. Same budget and same reason as the roster: a
 * district-sized sheet flags thousands of students, and rendering every one of
 * them cost 1,136ms and 27,591 nodes on the Overview.
 *
 * The cap is display only. Progress, the "sign off all" control and the CSV
 * export all read the whole queue, so a student who is below the fold is still
 * counted, still signed off by the bulk control, and still exported. A worklist
 * that silently shortened itself would be a correctness bug, not a slow view.
 */
const PAGE = 100
import { openTrace } from './TracePanel.jsx'
import { useDataset, useSelected, useVerification } from '../lib/store.js'
import { checkingLists } from '../lib/grading.js'

/** The optional subject's mark, in the same form the compulsory columns use. */
function optionalMark(r) {
  const s = r.subjects?.[r.optional]
  if (!s) return ''
  return s.absent ? 'AB' : `${s.mark} (${s.gradePoint})`
}

function toCsv(dataset, results) {
  const codes = [...dataset.compulsory]
  // The optional subject's own mark belongs in the file. The first version
  // exported its code and its grade point but not the mark behind them, so the
  // office could not reconcile that column against the marks sheet the way it
  // can for the six compulsory ones.
  const head = ['Student ID', 'Name', 'Class', ...codes, 'Optional', 'Optional mark', 'Optional GP', 'GPA', 'Letter', 'Failed subjects']
  const rows = results.map((r) => {
    const cells = codes.map((c) => {
      const s = r.subjects?.[c]
      if (!s) return ''
      return s.absent ? 'AB' : `${s.mark} (${s.gradePoint})`
    })
    return [
      r.id, r.name, r.class, ...cells,
      r.optional, optionalMark(r), r.optionalGradePoint ?? '',
      r.gpa.toFixed(2), r.letter,
      (r.failedCompulsory ?? []).join(' '),
    ]
  })
  // Neutralise CSV injection. Cell values come from a case a judge can paste, and
  // a spreadsheet treats a cell starting =, +, - or @ as a formula — so a student
  // name could execute when the office opens the export. Prefix those with an
  // apostrophe, which Excel, LibreOffice and Sheets all read as "this is text".
  const safe = (v) => {
    const t = String(v ?? '')
    const guarded = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t
    return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
  }

  return [head, ...rows]
    .map((row) => row.map(safe).join(','))
    .join('\r\n')
}

export default function PublishDesk() {
  const { dataset, results } = useDataset()
  const { verified, toggleVerified, verifyAll, clearVerified } = useVerification()
  const { select } = useSelected()

  // One row per student who needs a human eye, with every reason they were flagged.
  const queue = useMemo(() => {
    const lists = checkingLists(results)
    const reasons = new Map()
    const add = (r, why) => {
      if (!reasons.has(r.id)) reasons.set(r.id, { student: r, why: [] })
      reasons.get(r.id).why.push(why)
    }
    lists.optional.forEach((r) => add(r, 'optional rule'))
    lists.practicalFail.forEach((r) => add(r, 'practical fail'))
    lists.absent.forEach((r) => add(r, 'absent mark'))
    return [...reasons.values()].sort((a, b) => b.why.length - a.why.length || a.student.id.localeCompare(b.student.id))
  }, [results])

  const [limit, setLimit] = useState(PAGE)

  // A new sheet starts the budget again rather than inheriting the last one's depth.
  useEffect(() => {
    setLimit(PAGE)
  }, [results])

  const visible = useMemo(() => queue.slice(0, limit), [queue, limit])
  const hidden = queue.length - visible.length

  const done = queue.filter((q) => verified.has(q.student.id)).length
  const total = queue.length
  const ready = total > 0 && done === total
  const pct = total === 0 ? 100 : Math.round((done / total) * 100)

  function downloadCsv() {
    const blob = new Blob([toCsv(dataset, results)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `results-${dataset.case_id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section aria-labelledby="publish-heading" className="rounded-card border border-ink-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-300 px-4 py-3">
        <div className="min-w-0">
          <h3 id="publish-heading" className="font-semibold text-ink-900">
            Sign-off before publishing
          </h3>
          <p className={`text-sm ${ready || total === 0 ? 'text-ok' : 'text-ink-700'}`}>
            {total === 0
              ? 'Nothing in this sheet needs a second pair of eyes.'
              : ready
                ? 'Every flagged student checked. Ready to publish.'
                : `${total - done} still to check before publishing.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-semibold text-ink-900">
              {done}<span className="text-ink-500"> / {total}</span>
            </p>
            <p className="text-xs uppercase tracking-wide text-ink-500">Checked</p>
          </div>
          {total > 0 && (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => verifyAll(queue.map((q) => q.student.id))}
                className="rounded-lg border border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100"
              >
                Check all
              </button>
              <button
                type="button"
                onClick={clearVerified}
                className="rounded-lg px-2.5 py-1 text-xs text-ink-500 underline underline-offset-2 hover:text-ink-700"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {total > 0 && (
        <div className="px-4 pt-3">
          <div
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Students checked"
            className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${ready ? 'bg-ok' : 'bg-accent'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {total > 0 && (
        <ul className="max-h-[calc(100dvh-28rem)] min-h-[12rem] divide-y divide-ink-300/60 overflow-x-hidden overflow-y-auto px-1 py-1">
          {visible.map(({ student, why }) => {
            const isDone = verified.has(student.id)
            return (
              <li key={student.id} className="flex items-center gap-1 px-1 py-0.5">
                {/*
                  The box itself stays 16px because a checkbox that size is what
                  the platform draws and what people recognise, but a 16px hit
                  area on a phone is not tickable — WCAG 2.2 asks for 24px and a
                  thumb wants more. The padding around it does the work: the box
                  is unchanged, the target it sits in is 40px square.
                */}
                <span className="flex size-10 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    id={`verify-${student.id}`}
                    checked={isDone}
                    onChange={() => toggleVerified(student.id)}
                    className="size-4 accent-[var(--color-accent)]"
                  />
                </span>
                <label
                  htmlFor={`verify-${student.id}`}
                  className={`min-w-0 flex-1 cursor-pointer py-2 text-sm ${isDone ? 'text-ink-500 line-through' : 'text-ink-900'}`}
                >
                  <span className="font-medium">{student.name}</span>{' '}
                  <span className="font-mono text-xs text-ink-500">{student.id}</span>
                  <span className="ml-2 text-ink-500">{why.join(' · ')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    select(student.id)
                    openTrace()
                  }}
                  className="min-h-[2.25rem] shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
                >
                  Open trace
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Say what is held back and offer it, next to the number. The counts and
          the sign-off-all control above already cover the whole queue. */}
      {hidden > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-300 px-4 py-2 text-xs text-ink-500">
          <span>
            Listing the first{' '}
            <span className="font-medium text-ink-900 tabular-nums">{visible.length}</span> of{' '}
            <span className="font-medium text-ink-900 tabular-nums">{total}</span>. The progress
            above and “Sign off all” cover every one of them.
          </span>
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="rounded-lg border border-ink-300 bg-white px-2.5 py-1 font-medium text-ink-900 hover:bg-ink-100"
          >
            Show {Math.min(PAGE, hidden)} more
          </button>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-300 px-4 py-3">
        <p className="text-xs text-ink-500">
          Marksheets print one student at a time — open a student&rsquo;s trace and print from
          there.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Export results (CSV)
          </button>
          {/*
            Printing used to be offered here and it was wrong twice over. A
            marksheet is one student's document — nobody prints eighty at once —
            and the print stylesheet only ever emitted the trace, which is not
            mounted on this view at all, so pressing it from the Overview
            produced a blank page. The action now lives where a student is
            actually selected; this line says so rather than leaving a reader to
            wonder where it went.
          */}
        </div>
      </div>
    </section>
  )
}
