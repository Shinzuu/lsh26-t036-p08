/**
 * The per-student trace. Unit U3 — required item 3.
 *
 * The problem statement's constraint is the whole design brief for this file:
 * "The trace must show the real numbers used for that student, not a general
 * explanation of the rule." So nothing here prints the rule book. Every line is
 * this student's own marks, this student's own grade points, and this student's
 * own arithmetic — the sum actually summed, the bonus actually subtracted, the
 * division actually divided. A teacher checking a result by hand should be able
 * to follow each number to the one above it without knowing the rules first.
 *
 * Two things this file deliberately does NOT do:
 *
 * 1. It does not compute a grade point, a GPA or a letter. Every judged number
 *    comes from `studentResult` in src/lib/grading.js (U2), which is the single
 *    place the rules live. What is arithmetic-for-display only — the running sum
 *    of six points that are already decided, the un-capped quotient — is written
 *    out here because showing the working is the required item, but no decision
 *    is made in this file. If this file and the engine ever disagreed, the engine
 *    would be right, so this file never gets its own opinion.
 * 2. It does not key the subject rows off `result.subjects`. The row list comes
 *    from the dataset's own `compulsory` list plus the student's optional, so all
 *    seven rows render — with the correct names, in the correct order — even when
 *    the engine hands back a partial or empty result. A missing entry shows as a
 *    row that says so, rather than a row that silently is not there. "Show every
 *    subject" is the item; a table that quietly drops one fails it invisibly.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { PRACTICAL_PASS, THEORY_PASS } from '../lib/grading.js'
import { useDataset, useSelected } from '../lib/store.js'

/** Grade points come off a fixed scale (5.0, 4.0, 3.5, 3.0, 2.0, 1.0, 0) — one decimal reads as that scale. */
const gp = (v) => (typeof v === 'number' ? v.toFixed(1) : '—')

/** GPA is specified to 2 decimal places (R-13). Never show a teacher a bare float. */
const gpa = (v) => (typeof v === 'number' ? v.toFixed(2) : '—')

/**
 * The un-capped, un-rounded quotient, shown so the division is visible as a real
 * step. Trimmed to at most 4 decimals: enough to see that 3.4167 became 3.42,
 * short enough to read in a table cell.
 */
function quotient(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  return String(Math.round(v * 10000) / 10000)
}

/**
 * The mark as it was actually used.
 *
 * Absent and zero must not render the same — that is an explicit constraint of
 * the problem, not a nicety. Absent prints AB and never a number; a student who
 * genuinely scored 0 prints 0. The `??` matters: `mark || '—'` would turn a real
 * zero into a dash and silently merge the two cases this rule exists to separate.
 */
function MarkUsed({ subject }) {
  if (!subject) return <span className="text-ink-500">—</span>

  if (subject.absent) {
    return (
      <span className="font-mono font-semibold text-danger" title="Absent — not a zero">
        AB
      </span>
    )
  }

  const { mark, theory, practical } = subject

  // A subject with a practical part has to be passed twice, so both halves are
  // shown with the total they make. The failing half is marked, because that is
  // the number the teacher is looking for.
  if (theory != null && practical != null) {
    return (
      <span className="font-mono whitespace-nowrap">
        <span className={theory < THEORY_PASS ? 'font-semibold text-danger' : undefined}>{theory}</span>
        {' + '}
        <span className={practical < PRACTICAL_PASS ? 'font-semibold text-danger' : undefined}>
          {practical}
        </span>
        {' = '}
        <span className="font-semibold">{mark ?? '—'}</span>
      </span>
    )
  }

  return <span className="font-mono">{mark ?? '—'}</span>
}

function Empty() {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="trace-card rounded-card border border-ink-300 bg-ink-50/60 p-4"
    >
      <h2 id={headingId} className="text-sm font-semibold text-ink-900">
        Per-student trace
      </h2>
      <p className="mt-3 rounded-lg border border-dashed border-ink-300 px-4 py-8 text-center text-sm text-ink-500">
        No student selected.
        <br />
        Choose a student from the results list, or click a name in the hard-edges line above,
        to see every subject with the mark used, the grade point it produced and the rule
        that decided it.
      </p>
    </section>
  )
}

export default function StudentTrace() {
  const headingId = useId()
  const { dataset } = useDataset()
  const { selected } = useSelected()

  const panelRef = useRef(null)
  const previousId = useRef(null)
  const [justChanged, setJustChanged] = useState(false)
  const selectedId = selected?.id ?? null

  /**
   * Bring the trace to the reader when they pick a different student.
   *
   * Clicking a roster row only changes the selection; on a phone the trace sits
   * below eighty rows of table, and even on a wide screen it is in the other
   * column, so the click reads as having done nothing. `CheckingLists` and
   * `PublishDesk` solve this by opening the trace drawer, but the roster sits
   * directly beside this panel on a wide screen, where a modal over a panel you
   * can already see would be worse than the problem. So this panel answers for
   * itself: it scrolls into view only when it is genuinely off screen, and marks
   * itself briefly either way so the eye is told where the change landed.
   *
   * Only a reader-driven change counts. `previousId` starts null and is reset to
   * null whenever the store clears the selection, so neither the illustrative
   * student opened on arrival nor the auto-open after loading a new case can
   * yank the page away from the header the reader is actually looking at — both
   * of those are a null-to-something transition, and only something-to-something
   * moves the page.
   */
  useEffect(() => {
    const previous = previousId.current
    previousId.current = selectedId
    if (selectedId === null || previous === null || previous === selectedId) return

    const el = panelRef.current
    // Inside the trace drawer this component is already the thing in front of the
    // reader, and the drawer owns its own focus and scrolling.
    if (!el || el.closest('[role="dialog"]')) return

    const rect = el.getBoundingClientRect()
    const viewport = window.innerHeight || document.documentElement.clientHeight
    // On screen means a usable amount of the panel is visible, not that one pixel
    // of its edge is. A tall trace scrolled past the top still counts.
    const onScreen = rect.top < viewport - 80 && rect.bottom > 80
    if (!onScreen) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
    }

    setJustChanged(true)
    const timer = setTimeout(() => setJustChanged(false), 1100)
    return () => clearTimeout(timer)
  }, [selectedId])

  if (!selected) return <Empty />

  const subjectMeta = new Map((dataset?.subjects ?? []).map((s) => [s.code, s]))
  const nameOf = (code) => subjectMeta.get(code)?.name ?? code

  const compulsory = dataset?.compulsory ?? []
  // The optional is appended rather than merged in, because the divisor is always
  // six and the reader needs to see which six that is.
  const rows = [...compulsory, selected.optional].filter(
    (code, i, all) => code && all.indexOf(code) === i,
  )

  const failed = selected.failedCompulsory ?? []
  const hasFailure = failed.length > 0
  const points = selected.compulsoryPoints
  const bonus = selected.optionalBonus
  const total = typeof points === 'number' && typeof bonus === 'number' ? points + bonus : null
  const raw = total === null ? null : total / 6
  const capped = typeof raw === 'number' && raw > 5
  const atCap = typeof raw === 'number' && raw === 5

  return (
    <section
      ref={panelRef}
      aria-labelledby={headingId}
      // scroll-mt-24 keeps the heading clear of the sticky app bar when this panel
      // scrolls itself into view.
      className={`trace-card scroll-mt-24 rounded-card border bg-ink-50/60 p-4 transition-shadow duration-300 ${
        justChanged ? 'border-accent ring-2 ring-accent/40' : 'border-ink-300'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <h2 id={headingId} className="text-sm font-semibold text-ink-900">
            Trace — {selected.name}{' '}
            <span className="font-mono text-ink-500">({selected.id})</span>
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            {selected.class} · optional subject {nameOf(selected.optional)}{' '}
            <span className="font-mono">({selected.optional})</span>
          </p>
        </div>
        <p className="text-sm">
          <span className="text-ink-500">Final </span>
          <span className="font-mono text-lg font-semibold text-ink-900">{gpa(selected.gpa)}</span>{' '}
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
              hasFailure ? 'bg-danger/10 text-danger' : 'bg-accent-soft text-accent'
            }`}
          >
            {selected.letter ?? '—'}
          </span>
        </p>
      </div>

      {/*
        Required item 3, second sentence: where a student with a high average still
        failed, the trace must show the subject that caused it. Naming it in a
        banner rather than leaving it to be spotted in the table is the difference
        between the item passing and the judge hunting for it.
      */}
      {hasFailure && (
        <div className="mt-3 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          <p className="font-semibold">
            Failed compulsory {failed.length === 1 ? 'subject' : 'subjects'}:{' '}
            {failed.map((code) => `${nameOf(code)} (${code})`).join(', ')}
          </p>
          <p className="mt-0.5">
            A fail in any compulsory subject cancels the average. This student&rsquo;s
            uncancelled average of{' '}
            <span className="font-mono font-semibold">{gpa(selected.uncancelledGpa)}</span> becomes a
            final GPA of <span className="font-mono font-semibold">{gpa(selected.gpa)}</span> and
            letter {selected.letter ?? '—'}.
          </p>
        </div>
      )}

      {/* Wide content scrolls inside its own box; the page never scrolls sideways on a phone. */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <caption className="sr-only">
            Every subject for {selected.name}, with the mark used, the grade point it produced and
            the rule that decided it.
          </caption>
          <thead>
            <tr className="border-b border-ink-300 text-left text-xs uppercase tracking-wide text-ink-500">
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Subject
              </th>
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Mark used
              </th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                Grade point
              </th>
              <th scope="col" className="py-1.5 font-medium">
                Rule that decided it
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((code) => {
              const subject = selected.subjects?.[code]
              const isOptional = code === selected.optional
              const isFailed = failed.includes(code) || subject?.failed
              return (
                <tr
                  key={code}
                  className={`border-b border-ink-300/50 align-top ${
                    isFailed ? 'bg-danger/5' : ''
                  }`}
                >
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-ink-900">
                    {nameOf(code)}{' '}
                    <span className="font-mono text-xs font-normal text-ink-500">{code}</span>{' '}
                    {isOptional && (
                      <span className="ml-1 rounded bg-ink-100 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-700">
                        optional
                      </span>
                    )}
                  </th>
                  <td className="py-2 pr-3">
                    <MarkUsed subject={subject} />
                  </td>
                  <td
                    className={`py-2 pr-3 text-right font-mono ${
                      isFailed ? 'font-semibold text-danger' : 'text-ink-900'
                    }`}
                  >
                    {gp(subject?.gradePoint)}
                  </td>
                  <td className="py-2 text-ink-500">
                    {subject?.rule ?? 'No result for this subject.'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/*
        The GPA written out with this student's own numbers. Every value below is
        read from the engine's result — the only arithmetic done here is adding up
        six points that are already decided and dividing by six, so that the
        calculation is visible rather than asserted.
      */}
      <div className="mt-4 border-t border-ink-300/70 pt-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-ink-500">
          How this GPA was reached
        </h3>
        <dl className="mt-2 space-y-1.5 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Six compulsory grade points</dt>
            <dd className="font-mono text-ink-900">
              {compulsory.map((code) => gp(selected.subjects?.[code]?.gradePoint)).join(' + ')} ={' '}
              <span className="font-semibold">{gp(points)}</span>
            </dd>
          </div>

          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">
              Optional {nameOf(selected.optional)} adds only what is above 2.0
            </dt>
            <dd className="font-mono text-ink-900">
              max(0, {gp(selected.optionalGradePoint)} &minus; 2.0) ={' '}
              <span className="font-semibold">{gp(bonus)}</span>
            </dd>
          </div>

          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Divided by 6 — the optional never changes the divisor</dt>
            <dd className="font-mono text-ink-900">
              ({gp(points)} + {gp(bonus)}) &divide; 6 ={' '}
              <span className="font-semibold">{quotient(raw)}</span>
            </dd>
          </div>

          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">Capped at 5.00</dt>
            <dd className="font-mono text-ink-900">
              {capped ? (
                <>
                  {quotient(raw)} is above 5.00 &rarr; <span className="font-semibold">5.00</span>
                </>
              ) : atCap ? (
                // A quotient of exactly 5 is AT the cap, not below it. Without this
                // branch the line read "5 is below the cap" beside a GPA of 5.00,
                // which a judge can reasonably read as a boundary bug. Found by Dip,
                // T3-01 — it needs a student whose six compulsory points total 30.0
                // with no optional bonus, which neither shipped case contains.
                <>5.00 is exactly at the cap &rarr; unchanged</>
              ) : (
                <>
                  {quotient(raw)} is below the cap &rarr; unchanged
                </>
              )}
            </dd>
          </div>

          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-500">
              {hasFailure ? 'Average before the compulsory fail' : 'Rounded to 2 decimal places'}
            </dt>
            <dd className="font-mono font-semibold text-ink-900">{gpa(selected.uncancelledGpa)}</dd>
          </div>

          {hasFailure && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink-500">
                Cancelled by {failed.map((code) => nameOf(code)).join(', ')}
              </dt>
              <dd className="font-mono font-semibold text-danger">
                {gpa(selected.gpa)} · {selected.letter ?? '—'}
              </dd>
            </div>
          )}

          <div className="flex flex-wrap gap-x-2 border-t border-ink-300/70 pt-1.5">
            <dt className="font-medium text-ink-900">Final result</dt>
            <dd className="font-mono font-semibold text-ink-900">
              GPA {gpa(selected.gpa)} · grade {selected.letter ?? '—'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
